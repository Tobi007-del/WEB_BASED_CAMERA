let preview = document.getElementById("preview");
let recording = document.getElementById("recording");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");

let recordingTimeMS = 5000;

function log(msg) {
    logElement.innerText += `${msg}\n`;
}

function wait(delayInMs) {
    return new Promise(resolve => setTimeout(resolve, delayInMs))
}

function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = event => data.push(event.data);
    recorder.start();
    log(`${recorder.state} for ${lengthInMS / 1000} seconds`);

    let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = event => reject(event.filename);
    });

    let recorded = wait(lengthInMS).then(() => {
        if (recorder.state === "recording") {
            recorder.stop();
        }
    });

    return Promise.all([stopped, recorded]).then(() => data);
}

function stop(stream) {
    stream.getTracks().forEach(track => track.stop());
}

startButton.addEventListener("click", () => {
    navigator.mediaDevices
    .getUserMedia({
        video: true, 
        audio: true
    })
    .then(stream => {
        preview.srcObject = stream;
        preview.captureStream = preview.captureStream || preview.mozCaptureStream;
        return new Promise(resolve => preview.onplaying = resolve);
    })
    .then(() => startRecording(preview.captureStream(), recordingTimeMS))
    .then(recordedChunks => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
        recording.src = URL.createObjectURL(recordedBlob);
        recording.load()
        downloadButton.href = recording.src;
        downloadButton.download = "RecordedVideo.webm";

        log(`Successfully recored ${recordedBlob.size} bytes of ${recordedBlob.type} media.`);
    })
    .catch(error => {
        if (error.name === "NotFoundError") {
            log("Camera or microphone not found. Can't record.")
        } else {
            log(error);
        }
    });
    },
    false,
);

stopButton.addEventListener("click", () => {
        stop(preview.srcObject);
    },
    false,
);