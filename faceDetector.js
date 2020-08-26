class FaceDetector {
    constructor(init_callback, req_callback) {
        let _this = this;
        this.ready = false;
        FaceDetectorWasm().then(function (Module) {
            console.log("Face Detector WASM module loaded.");
            _this.onWasmInit(Module);
            _this.getPoseModel(req_callback);
            if (init_callback) {
                init_callback();
            }
        });
    }

    onWasmInit(Module) {
        this._Module = Module;
    }

    getPoseModel(req_callback) {
        const req = new XMLHttpRequest();
        req.open("GET", "/face_landmarks_68_compressed.dat", true);
        req.responseType = "arraybuffer";
        req.onload = (e) => {
            const payload = req.response;
            if (payload) {
                if (req_callback) {
                    req_callback();
                }
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
        if (!this.ready) return [null, null];

        const im_ptr = this._Module._malloc(im_arr.length);
        this._Module.HEAPU8.set(im_arr, im_ptr);

        // console.time("detect_face_features");
        const ptr = this._Module.ccall(
            "detect_face_features",
            "number",
            ["number", "number", "number"],
            [im_ptr, width, height]
        );
        const ptrU16 = ptr / Uint16Array.BYTES_PER_ELEMENT;
        // console.timeEnd("detect_face_features");

        const len = this._Module.HEAPU16[ptrU16];

        let i = 1;

        let bbox = [];
        for (; i < 5; i++) {
            bbox.push(this._Module.HEAPU16[ptrU16+i]);
        }

        let landmarksRaw = [];
        for (; i < len; i++) {
            landmarksRaw.push(this._Module.HEAPU16[ptrU16+i]);
        }

        this._Module._free(ptr);
        this._Module._free(im_ptr);

        return [landmarksRaw, bbox];
    }

    getPose(parts_arr, width, height) {
        if (!this.ready) return [null, null];

        const parts_ptr = this._Module._malloc(parts_arr.length * Uint16Array.BYTES_PER_ELEMENT);
        this._Module.HEAPU16.set(parts_arr, parts_ptr / Uint16Array.BYTES_PER_ELEMENT);

        const ptr = this._Module.ccall(
            "get_pose",
            "number",
            ["number", "number", "number"],
            [parts_ptr, width, height]
        );
        const ptrF64 = ptr / Float64Array.BYTES_PER_ELEMENT;

        const len = this._Module.HEAPF64[ptrF64];

        let i = 1;

        let quat = [];
        for (; i < 5; i++) {
            quat.push(this._Module.HEAPF64[ptrF64+i]);
        }

        let trans = [];
        for (; i < len; i++) {
            trans.push(this._Module.HEAPF64[ptrF64+i]);
        }

        this._Module._free(ptr);
        this._Module._free(parts_ptr);

        return [quat, trans];
    }
}
