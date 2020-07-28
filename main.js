let width = 320// Math.min(window.innerWidth, window.innerHeight);

function initStats() {
    window.stats = new Stats();
    window.stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
}

function setVideoStyle(elem) {
    elem.style.position = "absolute";
    elem.style.top = 0;
    elem.style.left = 0;
}

function setupVideo(displayCanv, displayOverlay, setupCallback) {
    window.videoElem = document.createElement("video");
    window.videoElem.setAttribute("autoplay", "");
    window.videoElem.setAttribute("muted", "");
    window.videoElem.setAttribute("playsinline", "");

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
    window.videoCanv.style.zIndex = -1;
    if (displayCanv) {
        document.body.appendChild(window.videoCanv);
    }

    if (displayOverlay) {
        window.overlayCanv = document.createElement("canvas");
        setVideoStyle(window.overlayCanv);
        window.overlayCanv.style.zIndex = 0;
        document.body.appendChild(window.overlayCanv);
    }

    window.videoElem.addEventListener("canplay", function(e) {
        window.width = width;
        window.height = window.videoElem.videoHeight / (window.videoElem.videoWidth / window.width);

        window.videoElem.setAttribute("width", window.width);
        window.videoElem.setAttribute("height", window.height);

        window.videoCanv.width = window.width;
        window.videoCanv.height = window.height;
        window.videoCanv.getContext('2d').translate(window.width, 0);
        window.videoCanv.getContext('2d').scale(-1, 1);

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

function drawBbox(bbox) {
    const overlayCtx = window.overlayCanv.getContext("2d");

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = "red";
    overlayCtx.lineWidth = 2;

    // [x1,y1,x2,y2]
    overlayCtx.moveTo(bbox[0], bbox[1]);
    overlayCtx.lineTo(bbox[0], bbox[3]);
    overlayCtx.lineTo(bbox[2], bbox[3]);
    overlayCtx.lineTo(bbox[2], bbox[1]);
    overlayCtx.lineTo(bbox[0], bbox[1]);

    overlayCtx.stroke();
}

function hasFace(landmarks) {
    if (!landmarks || landmarks.length == 0) return false;

    let zeros = 0;
    for (let i = 0; i < landmarks.length; i++) {
        if (i % 2 == 0 && landmarks[i] > window.width) return false;
        if (i % 2 == 1 && landmarks[i] > window.height) return false;
        if (landmarks[i] == 0) {
            zeros++;
        }
    }
    return zeros <= landmarks.length / 3;
}

function drawOverlay(landmarks, bbox) {
    if (!landmarks || !bbox) return;

    const overlayCtx = window.overlayCanv.getContext("2d");
    overlayCtx.clearRect(
        0, 0,
        window.width,
        window.height
    );

    let landmarksFormatted = [];
    let face = hasFace(landmarks);
    for (let i = 0; i < landmarks.length; i += 2) {
        if (face) {
            const l = [landmarks[i], landmarks[i+1]];
            landmarksFormatted.push(l);
        }
        else {
            landmarksFormatted.push([0,0]);
        }
    }

    drawBbox(bbox);

    drawPolyline(landmarksFormatted, 0,  16, false);   // jaw
    drawPolyline(landmarksFormatted, 17, 21, false);   // left eyebrow
    drawPolyline(landmarksFormatted, 22, 26, false);   // right eyebrow
    drawPolyline(landmarksFormatted, 27, 30, false);   // nose bridge
    drawPolyline(landmarksFormatted, 30, 35, true);    // lower nose
    drawPolyline(landmarksFormatted, 36, 41, true);    // left eye
    drawPolyline(landmarksFormatted, 42, 47, true);    // right Eye
    drawPolyline(landmarksFormatted, 48, 59, true);    // outer lip
    drawPolyline(landmarksFormatted, 60, 67, true);    // inner lip
}

function processVideo() {
    window.stats.begin();
    const [landmarksRaw, bbox] = window.faceDetector.detect(getFrame(), window.width, window.height);
    const [quat, trans] = window.faceDetector.getPose(landmarksRaw, window.width, window.height);
    drawOverlay(landmarksRaw, bbox);
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
