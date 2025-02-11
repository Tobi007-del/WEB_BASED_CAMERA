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
const DOM = {
    container : document.querySelector(".content-container"),
    headerWrapper : document.querySelector(".content-header-wrapper"),
    bodyWrapper : document.querySelector(".content-body-wrapper"),
    footerWrapper : document.querySelector(".content-footer-wrapper"),
    heroSection : document.querySelector(".content-hero-section"),
    recorderSection : document.querySelector(".content-recorder-section"),
    recorderVideoWrapper : document.querySelector(".content-recorder-video-wrapper"),
    logSection : document.querySelector(".content-log-section"),
    logMessage : document.querySelector(".content-log-message"),
    video : document.querySelector(".recorder-video"),
    timerVideos : document.querySelectorAll(".stall-timer video"),
    timerTopWrapper : document.querySelector(".timer-top-wrapper"),
    timerBottomWrapper : document.querySelector(".timer-bottom-wrapper"),
    topFlipWrapper : document.querySelector(".top-flip-wrapper"),
    bottomFlipWrapper : document.querySelector(".bottom-flip-wrapper"),
    timer : document.querySelector(".recorder-timer"),
    goBackBtn : document.querySelector(".go-back-button"),
    settingsBtn : document.querySelector(".settings-button"),
    heroBtn : document.querySelector(".content-hero-button"),
    caputrePhotoBtn : document.querySelector(".capture-photo-button"),
    captureVideoBtn : document.querySelector(".capture-video-button"),
    stopRecordingBtn : document.querySelector(".stop-recording-button"),
    resetBtn : document.querySelector(".reset-button"),
    saveBtn : document.querySelector(".save-button"),
    settingsWrapper: document.querySelector(".settings-wrapper"),
    closeSettingsBtn: document.querySelector(".close-settings-button"),
    stallTimerBtns: document.querySelectorAll(".stall-timer-button"),
    videoPickerWrapper: document.querySelector(".camera-section .section-picker-wrapper"),
    videoPickerBtn: document.querySelector(".video-picker-button"),
    audioPickerWrapper: document.querySelector(".audio-section .section-picker-wrapper"),
    audioPickerBtn: document.querySelector(".audio-picker-button"),
    videoSettingsDropdown: document.querySelector(".camera-section .settings-choices-dropdown"),
    audioSettingsDropdown: document.querySelector(".audio-section .settings-choices-dropdown"),
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

function updateConstraints({target}) {
    const {kind, label, deviceId} = target.dataset
    if (kind === "videoinput") {
        DOM.videoPickerBtn.textContent = label
        recorderConstraints.video = {deviceId: deviceId ? {exact: deviceId} : undefined}
    } else if (kind === "audioinput") {
        DOM.audioPickerBtn.textContent = label
        recorderConstraints.audio = {deviceId: deviceId ? {exact: deviceId} : undefined}
    }
    initPreview()
}

function removeAudioConstraint() {
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
    button.textContent = button.title = "No Audio"
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
    devices.filter(device => !device.deviceId.match("^[a-zA-Z]+$")).forEach(device => {
        userMediaDevices.push(device)
        if (device.kind === "videoinput")
            DOM.videoSettingsDropdown.appendChild(settingsChoiceBtn(device))
        else if (device.kind === "audioinput") 
            DOM.audioSettingsDropdown.appendChild(settingsChoiceBtn(device))
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
    const videoSettings = videoTrack.getSettings()
    const audioSettings = audioTrack.getSettings()
    DOM.videoPickerBtn.textContent = userMediaDevices.find(device => device.deviceId === videoSettings.deviceId).label
    DOM.audioPickerBtn.textContent = userMediaDevices.find(device => device.deviceId === audioSettings.deviceId).label
        
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
    stallTimerDelayInS = parseInt(currentTarget.dataset.stallTime)
    DOM.stallTimerBtns.forEach(btn => btn.classList.remove("active"))
    currentTarget.classList.add("active")
}

//logic for a somewhat experimental countdown timer cause "why not?"
async function stall(delayInMs) {
return new Promise(resolve => {
if (delayInMs > 0) {
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
            resolve(delayInMs / 1000 + " seconds elapsed, stalling successfully... You can now ride on!")
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

navigator.mediaDevices.addEventListener("devicechange", () => getMediaDevices().then(() => {
    const videoSettingsLabel = DOM.videoPickerBtn.textContent
    const audioSettingsLabel = DOM.audioPickerBtn.textContent

    if (!userMediaDevices.filter(device => device.kind === "videoinput").find(device => device.label === videoSettingsLabel) || !userMediaDevices.filter(device => device.kind === "audioinput").find(device => device.label === audioSettingsLabel)) initPreview()
}))

DOM.goBackBtn.addEventListener("click", previousSection)

DOM.heroBtn.addEventListener("click", initPreview)

DOM.caputrePhotoBtn.addEventListener("click", capturePhoto)

DOM.captureVideoBtn.addEventListener("click", captureVideo)

DOM.stallTimerBtns.forEach(btn => btn.addEventListener("click", editStallDelay))

DOM.settingsBtn.addEventListener("click", () => DOM.settingsWrapper.classList.toggle("active"))

DOM.closeSettingsBtn.addEventListener("click", () => DOM.settingsWrapper.classList.remove("active"))

DOM.videoPickerBtn.addEventListener("click", () => DOM.videoSettingsDropdown.classList.toggle("active"))

DOM.audioPickerBtn.addEventListener("click", () => DOM.audioSettingsDropdown.classList.toggle("active"))