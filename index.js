var width = 320; // window.innerWidth;
var height = 240; // window.innerHeight;

var stats = null;
var grayscale = null;

var videoCanvas = null;
var overlayCanvas = null;
var videoStream = null;

var worker = null;
var imageData = null;

var running = false;

const OVERLAY_COLOR = "#ef2d5e";

function initStats() {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
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
    overlayCtx.clearRect( 0, 0, width, height );

    var landmarksFormatted = [];
    for (var i = 0; i < landmarks.length; i += 2) {
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

function tick() {
    if (!running) return;

    stats.begin();

    imageData = grayscale.getFrame();

    stats.end();

    requestAnimationFrame(tick);
}

function onInit(source) {
    videoStream = source;
    running = true;

    worker = new Worker("./face-tracker.worker.js");
    worker.postMessage({ type: "init", width: width, height: height });

    worker.onmessage = function (e) {
        var msg = e.data;
        switch (msg.type) {
            case "loaded": {
                // console.log("Loaded");
                writeOverlayText("Initializing face tracking...");
                break;
            }
            case "progress": {
                const progress = Math.round(msg.progress * 100) / 100;
                writeOverlayText(`Downloading Face Model: ${progress}%`);
                break;
            }
            case "result": {
                if (running) {
                    drawFeatures(msg.features);
                }
                // console.log(msg.pose.translation);
                break;
            }
            // case "not found": {
            //     console.log("No face found");
            //     break;
            // }
            default: {
                break;
            }
        }
        process();
    }

    tick();
    process();
}

function process() {
    if (running && imageData) {
        worker.postMessage({ type: 'process', imagedata: imageData });
    }
}

function stop() {
    if (!running) return;
    if (videoStream) {
        const overlayCtx = overlayCanvas.getContext("2d");
        overlayCtx.clearRect( 0, 0, width, height );

        const tracks = videoStream.srcObject.getTracks();
        tracks.forEach(function(track) {
            track.stop();
        });
        videoStream.srcObject = null;

        videoCanvas.style.display = "none";
        running = false;
    }
}

function restart() {
    if (running) return;
    videoCanvas.style.display = "block";
    grayscale.requestStream()
        .then(source => {
            const overlayCtx = overlayCanvas.getContext("2d");
            overlayCtx.clearRect( 0, 0, width, height );
            running = true;
            tick();
            process();
        })
        .catch(err => {
            console.warn("ERROR: " + err);
        });
}

window.onload = () => {
    function setVideoStyle(elem) {
        elem.style.position = "absolute";
        elem.style.borderRadius = "10px";
        elem.style.top = "15px";
        elem.style.left = "15px";
    }

    var video = document.createElement("video");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    // document.body.appendChild(video);

    videoCanvas = document.createElement("canvas");
    videoCanvas.style.zIndex = 9998;
    setVideoStyle(videoCanvas);
    document.body.appendChild(videoCanvas);

    overlayCanvas = document.createElement("canvas");
    setVideoStyle(overlayCanvas);
    overlayCanvas.id = "overlay";
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    overlayCanvas.style.zIndex = 9999;
    document.body.appendChild(overlayCanvas);

    grayscale = new ARENAFaceTracker.GrayScaleMedia(video, width, height, videoCanvas);
    grayscale.requestStream()
        .then(source => {
            initStats();
            onInit(source);
        })
        .catch(err => {
            console.warn("ERROR: " + err);
        });
}
