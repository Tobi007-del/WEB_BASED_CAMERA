// let preview = document.getElementById("preview");
// let recording = document.getElementById("recording");
// let startButton = document.getElementById("startButton");
// let stopButton = document.getElementById("stopButton");
// let downloadButton = document.getElementById("downloadButton");
// let logElement = document.getElementById("log");

// let recordingTimeMS = 5000;

// function log(msg) {
//     logElement.innerText += `${msg}\n`;
// }

// function wait(delayInMs) {
//     return new Promise(resolve => setTimeout(resolve, delayInMs))
// }

// function startRecording(stream, lengthInMS) {
//     let recorder = new MediaRecorder(stream);
//     let data = [];

//     recorder.ondataavailable = event => data.push(event.data);
//     recorder.start();
//     log(`${recorder.state} for ${lengthInMS / 1000} seconds`);

//     let stopped = new Promise((resolve, reject) => {
//         recorder.onstop = resolve;
//         recorder.onerror = event => reject(event.filename);
//     });

//     let recorded = wait(lengthInMS).then(() => {
//         if (recorder.state === "recording") {
//             recorder.stop();
//         }
//     });

//     return Promise.all([stopped, recorded]).then(() => data);
// }

// function stop(stream) {
//     stream.getTracks().forEach(track => track.stop());
// }

// startButton.addEventListener("click", () => {
//     navigator.mediaDevices
//     .getUserMedia({
//         video: true, 
//         audio: true
//     })
//     .then(stream => {
//         preview.srcObject = stream;
//         preview.captureStream = preview.captureStream || preview.mozCaptureStream;
//         return new Promise(resolve => preview.onplaying = resolve);
//     })
//     .then(() => startRecording(preview.captureStream(), recordingTimeMS))
//     .then(recordedChunks => {
//         let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
//         recording.src = URL.createObjectURL(recordedBlob);
//         recording.load()
//         downloadButton.href = recording.src;
//         downloadButton.download = "RecordedVideo.webm";

//         log(`Successfully recored ${recordedBlob.size} bytes of ${recordedBlob.type} media.`);
//     })
//     .catch(error => {
//         if (error.name === "NotFoundError") {
//             log("Camera or microphone not found. Can't record.")
//         } else {
//             log(error);
//         }
//     });
//     },
//     false,
// );

// stopButton.addEventListener("click", () => {
//         stop(preview.srcObject);
//     },
//     false,
// );



















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
    caputrePhotoBtn : container.querySelector(".capture-photo-button"),
    captureVideoBtn : container.querySelector(".capture-video-button"),
    stopRecordingBtn : container.querySelector(".stop-recording-button"),
    resetBtn : container.querySelector(".reset-button"),
    saveBtn : container.querySelector(".save-button"),
    settingsWrapper: container.querySelector(".settings-wrapper"),
    closeSettingsBtn: container.querySelector(".close-settings-button"),
    stallTimerBtns: container.querySelectorAll(".stall-timer-button"),
    videoPickerWrapper: container.querySelector(".camera-section .section-picker-wrapper"),
    videoPickerBtn: container.querySelector(".video-picker-button"),
    audioPickerWrapper: container.querySelector(".audio-section .section-picker-wrapper"),
    audioPickerBtn: container.querySelector(".audio-picker-button"),
    videoSettingsDropdown: container.querySelector(".camera-section .settings-choices-dropdown"),
    audioSettingsDropdown: container.querySelector(".audio-section .settings-choices-dropdown"),
    activeElements: container.querySelectorAll("[data-active]")
},
//CONTENT ARRAYS
sections = ["hero", "recorder"],
recorderActions = ["preview", "record", "finished"],
//CONSTANTS
stallTimerDelaynMs = () => stallTimerDelayInS * 1000
//NON-CONSTANTS
let sectionsIndex = 0,
stallTimerDelayInS = 3,
userMediaDevices = [],
recorderConstraints = {audio:true, video:true}

function deactivateStates({target}) {
    console.log(target)
    Array.from(DOM.activeElements).filter(element => JSON.parse(element.dataset.active)).forEach(element => {
        if (element === target || element.contains(target)) return
        element.dataset.active = false
    })
}

function updateConstraints({currentTarget}) {
    const {kind, label, deviceId} = currentTarget.dataset
    if (kind === "videoinput") {
        DOM.videoSettingsDropdown.dataset.active = false
        DOM.videoPickerBtn.textContent = label
        recorderConstraints.video = {deviceId: {exact: deviceId}}
    } else if (kind === "audioinput") {
        DOM.audioSettingsDropdown.dataset.active = false
        DOM.audioPickerBtn.textContent = label
        recorderConstraints.audio = {deviceId: {exact: deviceId}}
    }
    
    initPreview()
}

function removeAudioConstraint() {
    DOM.audioSettingsDropdown.dataset.active = false
    DOM.audioPickerBtn.textContent = "Without audio"
    recorderConstraints.audio = false

    initPreview()
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

function updateSections() {
    DOM.container.dataset.activeSection = sections[sectionsIndex]
    stopRecording()
}

function previousSection() {
    sectionsIndex = sectionsIndex > 0 ? sectionsIndex - 1 : 0
    updateSections()
}

function goToSection(section) {
    DOM.container.dataset.activeSection = section
    stopRecording()
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

function stopRecording() {
    if (DOM.video.srcObject) {
        DOM.video.srcObject.getTracks().forEach(track => track.stop())
        DOM.recorderSection.dataset.ready = false
    }
}

async function initPreview() {
try {
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
    } else {
        DOM.audioPickerBtn.textContent = "Without audio"
    }
        
    DOM.video.srcObject = stream
    DOM.video.captureStream = DOM.video.captureStream || DOM.video.mozCaptureStream
    DOM.video.muted = true
    DOM.video.addEventListener("playing", () => DOM.recorderSection.dataset.ready = true, {once: true})
    DOM.timerVideos.forEach(video => video.srcObject = stream)
    DOM.video.play()
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
}
})
}

function capturePhoto() {
    stall(stallTimerDelaynMs()).then(res => console.log(res))
}

function captureVideo() {
    stall(stallTimerDelaynMs()).then(res => console.log(res))
}

//EVENT LISTENERS
window.addEventListener("load", getMediaDevices)

document.addEventListener("click", deactivateStates)

navigator.mediaDevices.addEventListener("devicechange", () => getMediaDevices().then(() => {
    if (!userMediaDevices.filter(device => device.kind === "videoinput").find(device => device.label === DOM.videoPickerBtn.textContent) || !userMediaDevices.filter(device => device.kind === "audioinput").find(device => device.label === DOM.audioPickerBtn.textContent)) initPreview()
}))

DOM.goBackBtn.addEventListener("click", previousSection)

DOM.heroBtn.addEventListener("click", initPreview)

DOM.caputrePhotoBtn.addEventListener("click", capturePhoto)

DOM.captureVideoBtn.addEventListener("click", captureVideo)

DOM.stallTimerBtns.forEach(btn => btn.addEventListener("click", editStallDelay))

DOM.closeSettingsBtn.addEventListener("click", () => DOM.settingsWrapper.dataset.active = "false")

DOM.settingsBtn.addEventListener("click", e => {
    e.stopPropagation()
    DOM.settingsWrapper.dataset.active = !JSON.parse(DOM.settingsWrapper.dataset.active)
})

DOM.videoPickerBtn.addEventListener("click", e => {
    e.stopPropagation()
    DOM.videoSettingsDropdown.dataset.active = !JSON.parse(DOM.videoSettingsDropdown.dataset.active)
})

DOM.audioPickerBtn.addEventListener("click", e => {
    e.stopPropagation()
    DOM.audioSettingsDropdown.dataset.active = !JSON.parse(DOM.audioSettingsDropdown.dataset.active)
})