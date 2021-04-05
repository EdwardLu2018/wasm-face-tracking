import FaceTrackerWASM from "./face_tracker_wasm";

export class FaceTrackerModule {
    constructor(width, height, shapePredictorData, init_callback) {
        let _this = this;

        this.ready = false;

        this.scope;
        if ('function' === typeof importScripts)
            this.scope = self;
        else
            this.scope = window;

        this._width = width;
        this._height = height;

        this._init_callback = init_callback;

        this._bboxLength = 4;
        this._landmarksLength = 2 * 68;
        this._featuresLength = this._landmarksLength + this._bboxLength;
        this._rotLength = 4;
        this._transLength = 3;
        this._poseLength = this._rotLength + this._transLength;

        this.features = {};
        this.scope.addEventListener("onFaceFeaturesFound", (e) => {
            _this.features = e.detail.features;
        });

        this.pose = {};
        this.scope.addEventListener("onFacePoseFound", (e) => {
            _this.pose = e.detail.pose;
        });

        FaceTrackerWASM().then(function(Module) {
            console.log("Face Detector WASM module loaded.");
            _this.onWasmInit(Module);
            _this.shapePredictorInit(shapePredictorData);
        });
    }

    onWasmInit(Module) {
        this._Module = Module;

        this.initializeShapePredictor = this._Module.cwrap("pose_model_init", null, ["number", "number"]);
        this.detectFaceFeatures = this._Module.cwrap("detect_face_features", null, ["number", "number", "number"]);
        this.findPose = this._Module.cwrap("get_pose", null, ["number", "number", "number"]);

        this.imBuf = this._Module._malloc(this._width * this._height);
        this.landmarksPtr = this._Module._malloc(this._landmarksLength * Uint16Array.BYTES_PER_ELEMENT);
    }

    shapePredictorInit(data) {
        const model = new Uint8Array(data);
        const buf = this._Module._malloc(model.length);
        this._Module.HEAPU8.set(model, buf);
        this.initializeShapePredictor(buf, model.length);
        this._init_callback();
        this.ready = true;
    }

    detectFeatures(im) {
        this._Module.HEAPU8.set(im, this.imBuf);
        // console.time("features");
        this.detectFaceFeatures(this.imBuf, this._width, this._height);
        // console.timeEnd("features");
        return this.features;
    }

    getPose(landmarks) {
        this._Module.HEAPU16.set(landmarks, this.landmarksPtr / Uint16Array.BYTES_PER_ELEMENT);
        // console.time("pose");
        this.findPose(this.landmarksPtr, this._width, this._height);
        // console.timeEnd("pose");
        return this.pose;
    }
}
