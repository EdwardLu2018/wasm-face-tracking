var width = 320; // window.innerWidth;
var height = 240; // window.innerHeight;

var stats = null;

const OVERLAY_COLOR = "#ef2d5e";

var faceTrackerSource = new FaceTracker.FaceTrackerSource({
    width: 320,
    height: 240,
});
var faceTracker = new FaceTracker.FaceTracker(faceTrackerSource);
faceTracker.init();

var overlayCanvas = document.createElement("canvas");
overlayCanvas.id = "face-tracking-overlay";
overlayCanvas.style.zIndex = "9999";
faceTrackerSource.copyDimensionsTo(overlayCanvas);

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

function drawPolyline(landmarks, start, end, closed) {
    const overlayCtx = overlayCanvas.getContext("2d");

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = OVERLAY_COLOR;
    overlayCtx.lineWidth = 1.5;

    overlayCtx.moveTo(landmarks[start][0], landmarks[start][1]);
    for (var i = start + 1; i <= end; i++) {
        overlayCtx.lineTo(landmarks[i][0], landmarks[i][1]);
    }
    if (closed) {
        overlayCtx.lineTo(landmarks[start][0], landmarks[start][1]);
    }
    overlayCtx.stroke();
}

function drawBbox(bbox) {
    const overlayCtx = overlayCanvas.getContext("2d");

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = "blue";
    overlayCtx.lineWidth = 1.5;

    // [x1,y1,x2,y2]
    overlayCtx.moveTo(bbox.left, bbox.top);
    overlayCtx.lineTo(bbox.left, bbox.bottom);
    overlayCtx.lineTo(bbox.right, bbox.bottom);
    overlayCtx.lineTo(bbox.right, bbox.top);
    overlayCtx.lineTo(bbox.left, bbox.top);

    overlayCtx.stroke();
}

function drawFeatures(features) {
    const bbox = features.bbox
    const landmarks = features.landmarks;

    const overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.clearRect( 0, 0, width, height );

    drawBbox(bbox);

    var landmarksFormatted = [];
    for (var i = 0; i < landmarks.length; i += 2) {
        const l = [landmarks[i], landmarks[i+1]];
        landmarksFormatted.push(l);
    }

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

window.addEventListener("onFaceTrackerInit", (e) => {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);

    document.body.appendChild(e.detail.source);
    document.body.appendChild(overlayCanvas);
    // document.body.appendChild(faceTracker.preprocessor.canvas);
});

window.addEventListener("onFaceTrackerProgress", (e) => {
    const progress = e.detail.progress;
    // console.log(progress);
    writeOverlayText(`Downloading Face Model: ${progress}%`);
});

window.addEventListener("onFaceTrackerLoading", (e) => {
    writeOverlayText("Initializing face tracking...");
});

window.addEventListener("onFaceTrackerFeatures", (e) => {
    drawFeatures(e.detail.features);
    stats.update();
});

function stop() {
    FaceTracker.stop();
}

function restart() {
    FaceTracker.restart();
}
