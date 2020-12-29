export class FaceTracker {
    constructor(width, height, init_callback) {
        let _this = this;
        this._ready = false;

        this._width = width;
        this._height = height;

        this._bboxLength = 4;
        this._landmarksLength = 2 * 68;
        this._featuresLength = this._landmarksLength + this._bboxLength;
        this._rotLength = 4;
        this._transLength = 3;
        this._poseLength = this._rotLength + this._transLength;

        FaceDetectorWasm().then(function (Module) {
            console.log("Face Detector WASM module loaded.");
            _this.onWasmInit(Module);
            _this.getPoseModel();
            if (init_callback) init_callback();
        });
    }

    onWasmInit(Module) {
        this._Module = Module;

        this.initializeShapePredictor = this._Module.cwrap("pose_model_init", null, ["number", "number"]);
        this.detectFaceFeatures = this._Module.cwrap("detect_face_features", "number", ["number", "number", "number"]);
        this.findPose = this._Module.cwrap("get_pose", "number", ["number", "number", "number"]);

        this.imBuf = this._Module._malloc(this._width * this._height);
        this.landmarksPtr = this._Module._malloc(this._landmarksLength * Uint16Array.BYTES_PER_ELEMENT);
    }

    getPoseModel(download_callback) {
        const req = new XMLHttpRequest();
        req.addEventListener('progress', this.poseModelProgress);
        req.open("GET", "/shape_predictor_68_face_landmarks_compressed.dat", true);
        req.responseType = "arraybuffer";
        req.onload = e => {
            const payload = req.response;
            if (payload) {
                this.poseModelInit(payload);
                this._ready = true;
            }
        }
        req.send(null);
    }

    poseModelProgress(e) {
        if (e.lengthComputable) {
            // var percentage = (e.loaded / e.total) * 100;
            const downloadEvent = new CustomEvent("faceModelDownloadProgress", {
                detail: (e.loaded / e.total) * 100
            });
            window.dispatchEvent(downloadEvent);
        }
        else {
            console.log("Cannot log face model download progress!");
        }
    }

    poseModelInit(data) {
        const model = new Uint8Array(data);
        const buf = this._Module._malloc(model.length);
        this._Module.HEAPU8.set(model, buf);
        this.initializeShapePredictor(buf, model.length);
    }

    detectFeatures(im) {
        if (!this._ready) undefined;

        this._Module.HEAPU8.set(im, this.imBuf);

        // console.time("features");
        const ptr = this.detectFaceFeatures(this.imBuf, this._width, this._height);
        // console.timeEnd("features");
        let features = new Uint16Array(this._Module.HEAPU16.buffer, ptr, this._featuresLength);

        const bbox = features.slice(0, this._bboxLength);
        const landmarksRaw = features.slice(this._bboxLength, this._featuresLength);

        this._Module._free(ptr);

        return {
            bbox: bbox,
            landmarks: landmarksRaw
        };
    }

    getPose(landmarks) {
        if (!this._ready) return undefined;

        this._Module.HEAPU16.set(landmarks, this.landmarksPtr / Uint16Array.BYTES_PER_ELEMENT);

        // console.time("pose");
        const ptr = this.findPose(this.landmarksPtr, this._width, this._height);
        // console.timeEnd("pose");

        let pose = new Float64Array(this._Module.HEAPF64.buffer, ptr, this._featuresLength);

        const quat = pose.slice(0, this._rotLength);
        const trans = pose.slice(this._rotLength, this._poseLength);

        this._Module._free(ptr);

        return {
            rotation: quat,
            translation: trans
        };
    }
}
