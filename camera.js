//DOM Elements
const container = document.querySelector(".content-container")

const DOM = {
    container : container,
    headerWrapper : container.querySelector(".content-header-wrapper"),
    bodyWrapper : container.querySelector(".content-body-wrapper"),
    footerWrapper : container.querySelector(".content-footer-wrapper"),
    heroSection : container.querySelector(".content-hero-section"),
    recorderSection : container.querySelector(".content-recorder-section"),
    recorderVideoWrapper : container.querySelector(".content-recorder-video-wrapper"),
    logSection : container.querySelector(".content-log-section"),
    logMessage : container.querySelector(".content-log-message"),
    video : container.querySelector(".recorder-video"),
    timerVideos : container.querySelectorAll(".stall-timer video"),
    timerTopWrapper : container.querySelector(".timer-top-wrapper"),
    timerBottomWrapper : container.querySelector(".timer-bottom-wrapper"),
    topFlipWrapper : container.querySelector(".top-flip-wrapper"),
    bottomFlipWrapper : container.querySelector(".bottom-flip-wrapper"),
    timer : container.querySelector(".recorder-timer"),
    goBackBtn : container.querySelector(".go-back-button"),
    settingsBtn : container.querySelector(".settings-button"),
    heroBtn : container.querySelector(".content-hero-button"),
    capturePhotoBtn : container.querySelector(".capture-photo-button"),
    recordVideoBtn : container.querySelector(".record-video-button"),
    stopRecordingBtn : container.querySelector(".stop-recording-button"),
    resetBtn : container.querySelector(".reset-button"),
    saveBtn : container.querySelector(".save-button"),
    contentFooterWrapper: container.querySelector(".content-footer-wrapper"),
    closeSettingsBtn: container.querySelector(".close-settings-button"),
    stallTimerBtns: container.querySelectorAll(".stall-timer-button"),
    videoPickerWrapper: container.querySelector(".video-section .section-picker-wrapper"),
    videoPickerBtn: container.querySelector(".video-section .media-picker-button"),
    videoSettingsDropdown: container.querySelector(".video-section .settings-choices-dropdown"),
    audioPickerWrapper: container.querySelector(".audio-section .section-picker-wrapper"),
    audioPickerBtn: container.querySelector(".audio-section .media-picker-button"),
    audioSettingsDropdown: container.querySelector(".audio-section .settings-choices-dropdown"),
    activeElements: container.querySelectorAll("[data-active]")
},
//CONTENT ARRAYS
sections = ["hero", "recorder"],
//CONSTANTS
stallTimerDelaynMs = () => stallTimerDelayInS * 1000,
mediaCanvas = document.createElement("canvas"),
mediaContext = mediaCanvas.getContext("2d"),
formatter = new Intl.NumberFormat(undefined, {minimumIntegerDigits: 2})
//NON-CONSTANTS
let sectionsIndex = 0,
stallTimerDelayInS = 3,
userMediaDevices = [],
recorderConstraints = {audio:true, video:true},
videoRecorder = null,
videoData = null,
videoBlob = null,
videoURL = null,
videoTimer = null

function deactivateStates({target}) {
    Array.from(DOM.activeElements).filter(element => JSON.parse(element.dataset.active)).forEach(element => {
        if (element === target || element.contains(target)) return
        element.dataset.active = false
    })
}

function updateConstraints({currentTarget}) {
    const {kind, label, deviceId} = currentTarget.dataset
    if (kind === "videoinput") {
        DOM.videoPickerWrapper.dataset.active = false
        DOM.videoPickerBtn.textContent = label
        recorderConstraints.video = {deviceId: {exact: deviceId}}
    } else if (kind === "audioinput") {
        DOM.audioPickerWrapper.dataset.active = false
        DOM.audioPickerBtn.textContent = label
        recorderConstraints.audio = {deviceId: {exact: deviceId}}
    }

    startCapturingStream()
}

function removeAudioConstraint() {
    DOM.audioPickerWrapper.dataset.active = false
    DOM.audioPickerBtn.textContent = "Without audio"
    recorderConstraints.audio = false

    startCapturingStream()
}

function settingsChoiceBtn({kind, label, deviceId}) {
    const button = document.createElement('button')
    button.type = "button"
    button.className = "settings-choice"
    button.textContent = button.title = button.dataset.label = label
    button.dataset.kind = kind
    button.dataset.deviceId = deviceId 
    button.addEventListener("click", updateConstraints)
    
    return button
}

function noAudioChoiceBtn() {
    const button = document.createElement('button')
    button.type = "button"
    button.className = "settings-choice"
    button.textContent = button.title = "Without audio"
    button.addEventListener("click", removeAudioConstraint)

    return button
}

async function getMediaDevices() {
try {
    recorderConstraints = {audio:true, video:true}
    userMediaDevices = []

    const devices = await navigator.mediaDevices
    .enumerateDevices()

    DOM.videoSettingsDropdown.innerHTML = ''
    DOM.audioSettingsDropdown.innerHTML = ''
    devices.forEach(device => {
    if (!userMediaDevices.some(d => d.label.includes(device.label) || device.label.includes(d.label))) {
        userMediaDevices.push(device)
        if (device.kind === "videoinput")
            DOM.videoSettingsDropdown.appendChild(settingsChoiceBtn(device))
        else if (device.kind === "audioinput") 
            DOM.audioSettingsDropdown.appendChild(settingsChoiceBtn(device))
    }
    })
    DOM.audioSettingsDropdown.appendChild(noAudioChoiceBtn())
} catch(error) {
    logError(error)
}
}

async function handleMediaDeviceChange() {
    await getMediaDevices()
    if (!DOM.video.srcObject) return
    if (!userMediaDevices.filter(device => device.kind === "videoinput").find(device => device.label === DOM.videoPickerBtn.textContent) || !userMediaDevices.filter(device => device.kind === "audioinput").find(device => device.label === DOM.audioPickerBtn.textContent)) startCapturingStream()
}

function updateSections() {
    DOM.container.dataset.activeSection = sections[sectionsIndex]
    stopCapturingStream()
    DOM.video.poster = ""
    // DOM.video.src = ""
    DOM.video.muted = true
    DOM.video.controls = false
}

function previousSection() {
    sectionsIndex = sectionsIndex > 0 ? sectionsIndex - 1 : 0
    updateSections()
}

function goToSection(section) {
    DOM.container.dataset.activeSection = section
    stopCapturingStream()
    if (section !== "log") sectionsIndex = sections.indexOf(section)
}

function resetSections() {
    sectionsIndex = 0
    updateSections()
}

function logError(error) {
    console.log("Error occured: " + error)
    goToSection("log")
    DOM.logMessage.textContent = error.message
}

function stopCapturingStream() {
    if (DOM.video.srcObject) {
        DOM.video.srcObject.getTracks().forEach(track => track.stop())
        DOM.video.srcObject = null
    }
}

async function startCapturingStream() { 
try {
    DOM.recorderSection.dataset.action = "preview"
    DOM.recorderSection.dataset.ready = false
    sectionsIndex = 1
    updateSections()
    
    const stream = await navigator.mediaDevices
    .getUserMedia(recorderConstraints)

    const videoTrack = stream.getVideoTracks()[0]
    const audioTrack = stream.getAudioTracks()[0] 
    if(videoTrack) {
        const videoSettings = videoTrack.getSettings()
        DOM.videoPickerBtn.textContent = userMediaDevices.filter(device => device.kind === "videoinput").find(device => device.deviceId === videoSettings.deviceId)?.label
    } 
    if(audioTrack) {
        const audioSettings = audioTrack.getSettings()
        DOM.audioPickerBtn.textContent = userMediaDevices.filter(device => device.kind === "audioinput").find(device => device.deviceId === audioSettings.deviceId)?.label
    } else DOM.audioPickerBtn.textContent = "Without audio"

    DOM.video.srcObject = stream
    DOM.video.captureStream = DOM.video.captureStream || DOM.video.mozCaptureStream
    DOM.video.addEventListener("playing", () => DOM.recorderSection.dataset.ready = true, {once: true})
    DOM.video.play()
    DOM.timerVideos.forEach(video => video.srcObject = stream)
} catch(error) {
    logError(error)
}
}

function editStallDelay({currentTarget}) {
    stallTimerDelayInS = parseInt(currentTarget.dataset.stallTime ?? 0)
    DOM.stallTimerBtns.forEach(btn => btn.classList.remove("active"))
    currentTarget.classList.add("active")
}

//logic for a somewhat experimental countdown timer cause "why not?"
async function stall(delayInMs) {
return new Promise(resolve => {
if (delayInMs > 1000) {
    DOM.timerTopWrapper.querySelector("p").textContent = Math.round(delayInMs / 1000)
    DOM.timerBottomWrapper.querySelector("p").textContent = Math.round(delayInMs / 1000)
    DOM.recorderSection.classList.add("stall")

    let activeTime = 0
    let stallInterval = setInterval(() => {
        activeTime += 1000

        if (activeTime < delayInMs) {
            const startNumber = parseInt(DOM.timerTopWrapper.querySelector("p").textContent)
            const newNumber = Math.round(delayInMs / 1000) - Math.round(activeTime / 1000)

            DOM.timerTopWrapper.querySelector("p").textContent = startNumber
            DOM.timerBottomWrapper.querySelector("p").textContent = startNumber
            DOM.topFlipWrapper.querySelector("p").textContent = startNumber
            DOM.bottomFlipWrapper.querySelector("p").textContent = newNumber

            DOM.topFlipWrapper.onanimationstart = () => DOM.timerTopWrapper.querySelector("p").textContent = newNumber
            DOM.topFlipWrapper.onanimationend = () => DOM.topFlipWrapper.classList.remove("flip")
            DOM.bottomFlipWrapper.onanimationend = () => {
                DOM.timerBottomWrapper.querySelector("p").textContent = newNumber
                DOM.bottomFlipWrapper.classList.remove("flip")
            }

            DOM.bottomFlipWrapper.classList.add("flip")
            DOM.topFlipWrapper.classList.add("flip")
        } else {
            DOM.recorderSection.classList.remove("stall")
            clearInterval(stallInterval)
            resolve(delayInMs / 1000 + " seconds elapsed, stalled user successfully... You can now ride on!")
        }
    }, 1000)
} else resolve("Not stalling user, You can ride on!")
})
}

async function capturePhoto() {
try {
    await stall(stallTimerDelaynMs())
    mediaCanvas.width = DOM.video.videoWidth
    mediaCanvas.height = DOM.video.videoHeight
    mediaContext.drawImage(DOM.video, 0, 0, mediaCanvas.width, mediaCanvas.height)
    mediaCanvas.toBlob(blob => {
        DOM.saveBtn.download = "Photo.png"
        DOM.saveBtn.href = DOM.video.poster = URL.createObjectURL(blob)
        // DOM.video.src = ""
        DOM.video.muted = true
        DOM.video.controls = false
        stopCapturingStream()
        DOM.recorderSection.dataset.action = "finished"        
    })
} catch(error) {
    logError(error)
}
}

async function recordVideo() {
try {
    await stall(stallTimerDelaynMs())
    DOM.recorderSection.dataset.action = "record"
    videoRecorder = new MediaRecorder(DOM.video.captureStream())
    videoRecorder.onerror = event => logError(event)
    videoRecorder.start()
    let time = 0
    videoTimer = setInterval(() => DOM.timer.textContent = formatTime(++time), 1000)
} catch(error) {
    logError(error)
}
}

function formatTime(time) {
    const hours =  time >= 3600 ? formatter.format(Math.floor(time/3600)) + ":" : ""
    const minutes = formatter.format(Math.floor(time/60) % 60) + ":"
    const seconds = formatter.format(time % 60)
    return hours + minutes + seconds
}

async function stopRecording() {
    if (videoRecorder?.state === "recording") {
        videoData = []
        videoRecorder.ondataavailable = event => videoData.push(event.data)
        videoRecorder.onstop = () => {
            clearInterval(videoTimer)
            DOM.timer.textContent = "00:00"
            videoBlob = new Blob(videoData, {type: "video/webm"})
            URL.revokeObjectURL(DOM.video.src)
            videoURL = URL.createObjectURL(videoBlob)
            DOM.saveBtn.download = "Video.webm"
            DOM.saveBtn.href = DOM.video.src = videoURL
            DOM.video.load()
            DOM.video.poster = ""
            DOM.video.controls = true
            DOM.video.muted = false
            stopCapturingStream()
            videoData = videoBlob = videoURL = null
            DOM.recorderSection.dataset.action = "finished"
        }
        videoRecorder.stop()
    }
}

function resetCapture() {
    DOM.recorderSection.dataset.action = "preview"
    startCapturingStream()
}

//EVENT LISTENERS
window.addEventListener("load", getMediaDevices)

document.addEventListener("click", deactivateStates, true)

navigator.mediaDevices.addEventListener("devicechange", handleMediaDeviceChange)

DOM.goBackBtn.addEventListener("click", previousSection)

DOM.heroBtn.addEventListener("click", startCapturingStream)

DOM.capturePhotoBtn.addEventListener("click", capturePhoto)

DOM.recordVideoBtn.addEventListener("click", recordVideo)

DOM.stopRecordingBtn.addEventListener("click", stopRecording)

DOM.resetBtn.addEventListener("click", resetCapture)

DOM.stallTimerBtns.forEach(btn => btn.addEventListener("click", editStallDelay))

DOM.closeSettingsBtn.addEventListener("click", () => DOM.contentFooterWrapper.dataset.active = "false")

DOM.settingsBtn.addEventListener("click", () => DOM.contentFooterWrapper.dataset.active = !JSON.parse(DOM.contentFooterWrapper.dataset.active))

DOM.videoPickerBtn.addEventListener("click", () => DOM.videoPickerWrapper.dataset.active = !JSON.parse(DOM.videoPickerWrapper.dataset.active))

DOM.audioPickerBtn.addEventListener("click", () => DOM.audioPickerWrapper.dataset.active = !JSON.parse(DOM.audioPickerWrapper.dataset.active))