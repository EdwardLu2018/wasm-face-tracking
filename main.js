function initStats() {
    window.stats = new Stats();
    window.stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
};

function setVideoStyle(elem) {
    elem.style.position = "absolute";
    elem.style.right = 0;
    elem.style.bottom = 0;
    elem.style.minWidth = "100%";
    elem.style.minHeight = "100%";
}

function setupVideo(displayCanv, displayOverlay, setupCallback) {
    window.videoElem = document.createElement("video");
    setVideoStyle(window.videoElem);
    // document.body.appendChild(window.videoElem);

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
    })
    .then(stream => {
        const videoSettings = stream.getVideoTracks()[0].getSettings();
        window.videoElem.srcObject = stream;
        window.videoElem.play();
    })
    .catch(function(err) {
        console.log("ERROR: " + err);
    });

    window.videoCanv = document.createElement("canvas");
    setVideoStyle(window.videoCanv);
    if (displayCanv) {
        document.body.appendChild(window.videoCanv);
    }

    if (displayOverlay) {
        window.overlayCanv = document.createElement("canvas");
        setVideoStyle(window.overlayCanv);
        document.body.appendChild(window.overlayCanv);
    }

    window.videoElem.addEventListener("canplay", function(e) {
        window.width = window.videoElem.videoWidth;
        window.height = window.videoElem.videoHeight;

        window.videoCanv.width = window.width;
        window.videoCanv.height = window.height;

        if (displayOverlay) {
            window.overlayCanv.width = window.width;
            window.overlayCanv.height = window.height;
        }

        if (setupCallback != null) {
            setupCallback();
        }
    }, false);
}

function getFrame() {
    const videoCanvCtx = window.videoCanv.getContext("2d");
    videoCanvCtx.drawImage(
        window.videoElem,
        0, 0,
        window.width,
        window.height
    );

    return videoCanvCtx.getImageData(0, 0, window.width, window.height).data;
}

function drawPolyline(landmarks, start, end, closed) {
    const overlayCtx = window.overlayCanv.getContext("2d");

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = 'blue';
    overlayCtx.lineWidth = 2;

    overlayCtx.moveTo(landmarks[start][0], landmarks[start][1]);
    for (let i = start + 1; i <= end; i++) {
        overlayCtx.lineTo(landmarks[i][0], landmarks[i][1]);
    }
    if (closed) {
        overlayCtx.lineTo(landmarks[start][0], landmarks[start][1]);
    }
    overlayCtx.stroke();
}

function drawPolylines(landmarks) {
    if (landmarks === undefined || landmarks.length != 68) return;

    const overlayCtx = window.overlayCanv.getContext("2d");
    overlayCtx.clearRect(
        0, 0,
        window.width,
        window.height
    );

    drawPolyline(landmarks, 0,  16, false);   // jaw
    drawPolyline(landmarks, 17, 21, false);   // left eyebrow
    drawPolyline(landmarks, 22, 26, false);   // right eyebrow
    drawPolyline(landmarks, 27, 30, false);   // nose bridge
    drawPolyline(landmarks, 30, 35, true);    // lower nose
    drawPolyline(landmarks, 36, 41, true);    // left eye
    drawPolyline(landmarks, 42, 47, true);    // right Eye
    drawPolyline(landmarks, 48, 59, true);    // outer lip
    drawPolyline(landmarks, 60, 67, true);    // inner lip
}

function processVideo() {
    window.stats.begin();
    const frame = getFrame();
    const landmarks = window.faceDetector.detect(frame, window.width, window.height);
    drawPolylines(landmarks);
    window.stats.end();
    requestAnimationFrame(processVideo);
}

function init() {
    window.faceDetector = new FaceDetector(() => {
        initStats();
        setupVideo(true, true, () => {
            requestAnimationFrame(processVideo);
        });
    });
}

init();
