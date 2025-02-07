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
    saveBtn : document.querySelector(".save-button")
},
//CONTENT ARRAYS
sections = ["hero", "recorder"],
recorderActions = ["preview", "record", "finished"],
//CONSTANTS
stallTimerDelayInS = 3,
stallTimerDelaynMs = stallTimerDelayInS * 1000

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
        DOM.video.addEventListener("playing", () => DOM.recorderSection.dataset.ready = true, {once: true})
        DOM.video.play()
        DOM.timerVideos.forEach(video => video.srcObject = stream)
    })
}

//logic for a somewhat experimental countdown timer cause "why not?"

async function stall(delayInMs) {
return new Promise(resolve => {
    DOM.recorderSection.classList.add("stall")
    DOM.timerTopWrapper.querySelector("p").textContent = Math.round(delayInMs / 1000)
    DOM.timerBottomWrapper.querySelector("p").textContent = Math.round(delayInMs / 1000)

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
})
}

function capturePhoto() {
    stall(stallTimerDelaynMs).then(res => console.log(res))
}

function captureVideo() {
    stall(stallTimerDelaynMs).then(res => console.log(res))
}

DOM.goBackBtn.addEventListener("click", resetSections)

DOM.heroBtn.addEventListener("click", initRecording)

DOM.caputrePhotoBtn.addEventListener("click", capturePhoto)

DOM.captureVideoBtn.addEventListener("click", captureVideo)