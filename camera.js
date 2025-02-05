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
    logSection : document.querySelector(".content-log-section"),
    logMessage : document.querySelector(".content-log-message"),
    video : document.querySelector(".recorder-video"),
    timer : document.querySelector(".recorder-timer"),
    goBackBtn : document.querySelector(".go-back-button"),
    settingsBtn : document.querySelector(".settings-button"),
    heroBtn : document.querySelector(".content-hero-button"),
    caputrePhotoBtn : document.querySelector(".capture-photo-button"),
    captureVideoBtn : document.querySelector(".capture-video-button"),
    stopRecordingBtn : document.querySelector(".stop-recording-button"),
    resetBtn : document.querySelector(".reset-button"),
    saveBtn : document.querySelector(".save-button")
},
//CONTENT ARRAYS
sections = ["hero", "recorder"],
recorderActions = ["preview", "record", "finished"]

let sectionsIndex = 0

function updateSections() {
    DOM.container.dataset.activeSection = sections[sectionsIndex]
    stopRecording()
}

function previousSection() {
    sectionsIndex = sectionsIndex > 0 ? sectionsIndex - 1 : 0
    updateSections()
}

function resetSections() {
    sectionsIndex = 0
    updateSections()
}

function stopRecording() {
    if (DOM.video.srcObject) {
        DOM.video.srcObject.getTracks().forEach(track => track.stop())
        DOM.recorderSection.dataset.ready = false
    }
}

function initRecording() {
    sectionsIndex = 1
    updateSections()
    navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true
    })
    .then(stream => {
        DOM.video.srcObject = stream
        DOM.video.captureStream = DOM.video.captureStream || DOM.video.mozCaptureStream
        DOM.video.muted = true
        DOM.video.play()
        DOM.video.addEventListener("playing", () => DOM.recorderSection.dataset.ready = true, {once: true})
    })
}

async function stall(delay) {
    
}

function capturePhoto() {

}

function captureVideo() {

}

DOM.goBackBtn.addEventListener("click", resetSections)

DOM.heroBtn.addEventListener("click", initRecording)

DOM.caputrePhotoBtn.addEventListener("click", capturePhoto)

DOM.captureVideoBtn.addEventListener("click", captureVideo)