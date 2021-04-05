import {FaceTrackerModule} from "./face-tracker-module";

onmessage = function (e) {
    var msg = e.data;
    switch (msg.type) {
        case "init": {
            load(msg.width, msg.height, msg.data);
            return;
        }
        case "process": {
            next = msg.imagedata;
            process();
            return;
        }
        default: {
            return;
        }
    }
};

var next = null;
var faceTracker = null;
var features = null, pose = null;

function load(width, height, data) {
    var onLoad = function() {
        postMessage({type: "loaded"});
    }

    faceTracker = new FaceTrackerModule(width, height, data, onLoad);
}

function process() {
    features = null;
    pose = null;

    if (faceTracker && faceTracker.ready) {
        features = faceTracker.detectFeatures(next);
        if (features) {
            pose = faceTracker.getPose(features.landmarks);
        }
    }
    console.log(pose.translation.x, pose.translation.y, pose.translation.z);

    postMessage({type: "result", features: features, pose: pose});

    next = null;
}
