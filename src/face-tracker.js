import {Preprocessor} from "./preprocessor";
import {Utils} from "./utils/utils";
import Worker from "./face-tracker.worker";

export class FaceTracker {
    constructor(source) {
        this.running = false;

        this.source = source;
        this.sourceWidth = this.source.options.width;
        this.sourceHeight = this.source.options.height;

        this.preprocessor = new Preprocessor(this.sourceWidth, this.sourceHeight);
        this.worker = new Worker();
    }

    init(cameraOptions) {
        this.running = true;
        this.cameraOptions = cameraOptions;
        this.source.init(cameraOptions)
            .then((source) => {
                this.preprocessor.attachElem(source);
                this.onInit(source);
            })
            .catch((err) => {
                console.warn("ERROR: " + err);
            });
    }

    onInit(source) {
        let _this = this;
        this.getShapePredictor();
        const initEvent = new CustomEvent(
            "onFaceTrackerInit",
            {detail: {source: source}}
        );
        window.dispatchEvent(initEvent);

        this.worker.onmessage = function (e) {
            var msg = e.data;
            switch (msg.type) {
                case "loaded": {
                    break;
                }
                case "result": {
                    const features = msg.features;
                    const pose = msg.pose;
                    const featuresEvent = new CustomEvent(
                        "onFaceTrackerFeatures",
                        {
                            detail: {
                                features: features,
                                pose: pose,
                            }
                        }
                    );
                    window.dispatchEvent(featuresEvent);
                    break;
                }
                default: {
                    break;
                }
            }
            _this.process();
        }
    }

    getShapePredictor() {
        const req = new XMLHttpRequest();
        req.addEventListener('progress', (e) => this.shapePredictorProgress(e));
        req.open("GET", "/data/shape_predictor_68_face_landmarks_compressed.dat", true);
        req.responseType = "arraybuffer";
        req.onload = (e) => {
            const payload = req.response;
            if (payload) {
                this.worker.postMessage({
                    type: "init",
                    width: this.sourceWidth,
                    height: this.sourceHeight,
                    data: payload,
                });
                const loadingEvent = new CustomEvent(
                    "onFaceTrackerLoading",
                    {detail: {}}
                );
                window.dispatchEvent(loadingEvent);
            }
        }
        req.send(null);
    }

    shapePredictorProgress(e) {
        if (e.lengthComputable) {
            const downloadProgress = (e.loaded / e.total) * 100;
            if (downloadProgress < 100) {
                const progress = Utils.round3(downloadProgress);
                const progressEvent = new CustomEvent(
                    "onFaceTrackerProgress",
                    {detail: {progress: progress}}
                );
                window.dispatchEvent(progressEvent);
            }
        }
        else {
            console.log("Cannot log face model download progress!");
        }
    }

    process() {
        if (this.running) {
            const imageData = this.preprocessor.getPixels();
            this.worker.postMessage({
                type: "process",
                imagedata: imageData
            });
        }
    }

    stop() {
        if (this.running) {
            const tracks = this.source.video.srcObject.getTracks();
            tracks.forEach(function(track) {
                track.stop();
            });
            this.source.video.srcObject = null;
            this.running = false;
        }
    }

    restart() {
        if (!this.running) {
            this.source.init(this.cameraOptions)
                .then((source) => {
                    this.preprocessor.attachElem(source);
                    this.running = true;
                    this.process();
                })
                .catch((err) => {
                    console.warn("ERROR: " + err);
                });
        }
    }
}
