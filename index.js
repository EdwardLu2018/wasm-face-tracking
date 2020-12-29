let width = 320; // window.innerWidth;
let height = 240; // window.innerHeight;

let stats = null;
let grayscale = null;
let faceTracker = null;

let overlayCanvas = null;

const OVERLAY_COLOR = "#ef2d5e";

function initStats() {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
}

function setVideoStyle(elem) {
    elem.style.position = "absolute";
    elem.style.top = 0;
    elem.style.left = 0;
}

function drawPolyline(landmarks, start, end, closed) {
    const overlayCtx = overlayCanvas.getContext("2d");

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = 'blue';
    overlayCtx.lineWidth = 1;

    overlayCtx.moveTo(landmarks[start][0], landmarks[start][1]);
    for (let i = start + 1; i <= end; i++) {
        overlayCtx.lineTo(landmarks[i][0], landmarks[i][1]);
    }
    if (closed) {
        overlayCtx.lineTo(landmarks[start][0], landmarks[start][1]);
    }
    overlayCtx.stroke();
}

function writeOverlayText(text) {
    const overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.clearRect(
        0, 0,
        width,
        height
    );
    overlayCtx.font = "17px Arial";
    overlayCtx.textAlign = "center";
    overlayCtx.fillStyle = OVERLAY_COLOR;
    overlayCtx.fillText(text, overlayCanvas.width/2, overlayCanvas.height/8);
}

function drawBbox(bbox) {
    const overlayCtx = overlayCanvas.getContext("2d");

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = "red";
    overlayCtx.lineWidth = 1;

    // [x1,y1,x2,y2]
    overlayCtx.moveTo(bbox[0], bbox[1]);
    overlayCtx.lineTo(bbox[0], bbox[3]);
    overlayCtx.lineTo(bbox[2], bbox[3]);
    overlayCtx.lineTo(bbox[2], bbox[1]);
    overlayCtx.lineTo(bbox[0], bbox[1]);

    overlayCtx.stroke();
}

function drawFeatures(features) {
    const bbox = features.bbox
    const landmarks = features.landmarks;

    const overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.clearRect(
        0, 0,
        width,
        height
    );

    let landmarksFormatted = [];
    for (let i = 0; i < landmarks.length; i += 2) {
        const l = [landmarks[i], landmarks[i+1]];
        landmarksFormatted.push(l);
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
    stats.begin();

    const features = faceTracker.detectFeatures();
    const pose = faceTracker.getPose(features.landmarks);
    // const rotation = pose.rotation;
    // const translation = pose.translation;

    if (features) drawFeatures(features);

    stats.end();

    requestAnimationFrame(processVideo);
}

window.addEventListener("faceModelDownloadProgress", e => {
    const progress = Math.round(e.detail * 100) / 100;
    writeOverlayText(`Downloading Face Model: ${progress}%`);
}, false);

window.onload = () => {
    let video = document.createElement("video");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    // document.body.appendChild(video);

    let canvas = document.createElement("canvas");
    canvas.style.zIndex = 9998;
    setVideoStyle(canvas);
    document.body.appendChild(canvas);

    overlayCanvas = document.createElement("canvas");
    setVideoStyle(overlayCanvas);
    overlayCanvas.id = "overlay";
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    overlayCanvas.style.zIndex = 9999;
    document.body.appendChild(overlayCanvas);

    faceTracker = new ARENAFaceTracker.FaceTracker(video, width, height, canvas);
    faceTracker.requestStream()
        .then(() => {
            initStats();
            requestAnimationFrame(processVideo);
        })
        .catch(err => {
            console.warn("ERROR: " + err);
        });
}
