class FaceDetector {
    constructor(callback) {
        let _this = this;
        this.ready = false;
        FaceDetectorWasm().then(function (Module) {
            console.log("Face Detector WASM module loaded.");
            _this.onWasmInit(Module);
            _this.getPoseModel();
            if (callback) {
                callback();
            }
        });
    }

    onWasmInit(Module) {
        this._Module = Module;
    }

    getPoseModel(Module) {
        const req = new XMLHttpRequest();
        req.open("GET", "shape_predictor_68_face_landmarks.dat", true);
        req.responseType = "arraybuffer";
        req.onload = (e) => {
            const payload = req.response;
            if (payload) {
                this.poseModelInit(payload);
                this.ready = true;
            }
        }
        req.send(null);
    }

    poseModelInit(data) {
        const model = new Uint8Array(data);
        const buf = this._Module._malloc(model.length);
        this._Module.HEAPU8.set(model, buf);
        this._Module.ccall(
            "pose_model_init",
            null,
            ["number", "number"],
            [buf, model.length]
        );
    }

    detect(im_arr, width, height) {
        if (!this.ready) return [];

        const im_ptr = this._Module._malloc(im_arr.length);
        this._Module.HEAPU8.set(im_arr, im_ptr);

        console.time("detect_face_features");
        let ptr = this._Module.ccall(
            "detect_face_features",
            "number",
            ["number", "number", "number"],
            [im_ptr, width, height]
        ) / Uint16Array.BYTES_PER_ELEMENT;
        console.timeEnd("detect_face_features");

        const len = this._Module.HEAPU16[ptr];
        const landmarks = [];
        for (let i = 1; i < len; i += 2) {
            const l = [this._Module.HEAPU16[ptr + i], this._Module.HEAPU16[ptr + i + 1]];
            landmarks.push(l);
        }

        this._Module._free(ptr);
        this._Module._free(im_ptr);

        return landmarks;
    }
}
