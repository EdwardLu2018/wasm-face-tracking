var WasmAR =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./faceTracker.js":
/*!************************!*\
  !*** ./faceTracker.js ***!
  \************************/
/*! exports provided: FaceTracker */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FaceTracker", function() { return FaceTracker; });
class FaceTracker {
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
    };

    req.send(null);
  }

  poseModelProgress(e) {
    if (e.lengthComputable) {
      // var percentage = (e.loaded / e.total) * 100;
      const downloadEvent = new CustomEvent("faceModelDownloadProgress", {
        detail: e.loaded / e.total * 100
      });
      window.dispatchEvent(downloadEvent);
    } else {
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

    this._Module.HEAPU8.set(im, this.imBuf); // console.time("features");


    const ptr = this.detectFaceFeatures(this.imBuf, this._width, this._height); // console.timeEnd("features");

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

    this._Module.HEAPU16.set(landmarks, this.landmarksPtr / Uint16Array.BYTES_PER_ELEMENT); // console.time("pose");


    const ptr = this.findPose(this.landmarksPtr, this._width, this._height); // console.timeEnd("pose");

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

/***/ }),

/***/ "./grayscale.js":
/*!**********************!*\
  !*** ./grayscale.js ***!
  \**********************/
/*! exports provided: GrayScale */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GrayScale", function() { return GrayScale; });
class GrayScale {
  constructor(source, width, height, canvas) {
    this._source = source;
    this._sourceType = typeof this._source;
    this._width = width;
    this._height = height;
    this._canvas = canvas ? canvas : document.createElement("canvas");
    this._canvas.width = width;
    this._canvas.height = height;
    this._flipImageProg = __webpack_require__(/*! ./shaders/flip-image.glsl */ "./shaders/flip-image.glsl");
    this._grayscaleProg = __webpack_require__(/*! ./shaders/grayscale.glsl */ "./shaders/grayscale.glsl");
    this.glReady = false;
    this.initGL(this._flipImageProg, this._grayscaleProg);
  }

  initGL(vertShaderSource, fragShaderSource) {
    this.gl = this._canvas.getContext("webgl");
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(vertShader, vertShaderSource);
    this.gl.shaderSource(fragShader, fragShaderSource);
    this.gl.compileShader(vertShader);
    this.gl.compileShader(fragShader);
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertShader);
    this.gl.attachShader(program, fragShader);
    this.gl.linkProgram(program);
    this.gl.useProgram(program);
    const vertices = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    const positionLocation = this.gl.getAttribLocation(program, "position");
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionLocation);
    const texture = this.gl.createTexture();
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture); // if either dimension of image is not a power of 2

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.glReady = true;
    this.pixelBuf = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight * 4);
    this.grayBuf = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight);
  }

  getFrame() {
    if (!this.glReady) return undefined;
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this._source);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    this.gl.readPixels(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.pixelBuf); // webgl returns flipped image, so we will need to flip image buffer to return the correct orientation

    let j = this.grayBuf.length - this.gl.drawingBufferWidth,
        k = 0;

    for (let i = 0; i < this.pixelBuf.length; i += 4) {
      this.grayBuf[j + k] = this.pixelBuf[i];
      k++;

      if (k == this.gl.drawingBufferWidth) {
        j -= this.gl.drawingBufferWidth;
        k = 0;
      }
    }

    return this.grayBuf;
  }

  requestStream() {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return reject();
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: {
            ideal: this._width
          },
          height: {
            ideal: this._height
          },
          aspectRatio: {
            ideal: this._width / this._height
          },
          facingMode: "environment"
        }
      }).then(stream => {
        this._source.srcObject = stream;

        this._source.onloadedmetadata = e => {
          this._source.play();

          resolve(this._source, stream);
        };
      }).catch(err => {
        console.warn("ERROR: " + err);
      });
    });
  }

}

/***/ }),

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _grayscale_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./grayscale.js */ "./grayscale.js");
/* harmony import */ var _faceTracker_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./faceTracker.js */ "./faceTracker.js");


let width = 320; // window.innerWidth;

let height = 240; // window.innerHeight;

let stats = null;
let grayscale = null;
let faceTracker = null;
let overlayCanv = null;
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

function setupVideo() {
  return new Promise((resolve, reject) => {
    let video = document.createElement("video");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", ""); // document.body.appendChild(video);

    let canvas = document.createElement("canvas");
    canvas.style.zIndex = 9998;
    setVideoStyle(canvas);
    document.body.appendChild(canvas);
    grayscale = new _grayscale_js__WEBPACK_IMPORTED_MODULE_0__["GrayScale"](video, width, height, canvas);
    grayscale.requestStream().then(() => {
      resolve();
    }).catch(err => {
      console.warn("ERROR: " + err);
      reject();
    });
  });
}

function drawPolyline(landmarks, start, end, closed) {
  const overlayCtx = overlayCanv.getContext("2d");
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
  const overlayCtx = overlayCanv.getContext("2d");
  overlayCtx.clearRect(0, 0, width, height);
  overlayCtx.font = "17px Arial";
  overlayCtx.textAlign = "center";
  overlayCtx.fillStyle = OVERLAY_COLOR;
  overlayCtx.fillText(text, overlayCanv.width / 2, overlayCanv.height / 8);
}

function drawBbox(bbox) {
  const overlayCtx = overlayCanv.getContext("2d");
  overlayCtx.beginPath();
  overlayCtx.strokeStyle = "red";
  overlayCtx.lineWidth = 1; // [x1,y1,x2,y2]

  overlayCtx.moveTo(bbox[0], bbox[1]);
  overlayCtx.lineTo(bbox[0], bbox[3]);
  overlayCtx.lineTo(bbox[2], bbox[3]);
  overlayCtx.lineTo(bbox[2], bbox[1]);
  overlayCtx.lineTo(bbox[0], bbox[1]);
  overlayCtx.stroke();
}

function drawFeatures(features) {
  const bbox = features.bbox;
  const landmarks = features.landmarks;
  const overlayCtx = overlayCanv.getContext("2d");
  overlayCtx.clearRect(0, 0, width, height);
  let landmarksFormatted = [];

  for (let i = 0; i < landmarks.length; i += 2) {
    const l = [landmarks[i], landmarks[i + 1]];
    landmarksFormatted.push(l);
  }

  drawBbox(bbox);
  drawPolyline(landmarksFormatted, 0, 16, false); // jaw

  drawPolyline(landmarksFormatted, 17, 21, false); // left eyebrow

  drawPolyline(landmarksFormatted, 22, 26, false); // right eyebrow

  drawPolyline(landmarksFormatted, 27, 30, false); // nose bridge

  drawPolyline(landmarksFormatted, 30, 35, true); // lower nose

  drawPolyline(landmarksFormatted, 36, 41, true); // left eye

  drawPolyline(landmarksFormatted, 42, 47, true); // right Eye

  drawPolyline(landmarksFormatted, 48, 59, true); // outer lip

  drawPolyline(landmarksFormatted, 60, 67, true); // inner lip
}

function processVideo() {
  stats.begin();
  const features = faceTracker.detectFeatures(grayscale.getFrame());
  const pose = faceTracker.getPose(features.landmarks); // const rotation = pose.rotation;
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
  overlayCanv = document.createElement("canvas");
  setVideoStyle(overlayCanv);
  overlayCanv.id = "overlay";
  overlayCanv.width = width;
  overlayCanv.height = height;
  overlayCanv.style.zIndex = 9999;
  document.body.appendChild(overlayCanv);
  faceTracker = new _faceTracker_js__WEBPACK_IMPORTED_MODULE_1__["FaceTracker"](width, height, () => {
    initStats();
    setupVideo().then(() => {
      requestAnimationFrame(processVideo);
    });
  });
};

/***/ }),

/***/ "./shaders/flip-image.glsl":
/*!*********************************!*\
  !*** ./shaders/flip-image.glsl ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "attribute vec2 position;\nvarying vec2 tex_coords;\nvoid main(void) {\ntex_coords = (position + 1.0) / 2.0;\ntex_coords.y = 1.0 - tex_coords.y;\ngl_Position = vec4(position, 0.0, 1.0);\n}"

/***/ }),

/***/ "./shaders/grayscale.glsl":
/*!********************************!*\
  !*** ./shaders/grayscale.glsl ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "precision highp float;\nuniform sampler2D u_image;\nvarying vec2 tex_coords;\nconst vec3 g = vec3(0.299, 0.587, 0.114);\nvoid main(void) {\nvec4 color = texture2D(u_image, tex_coords);\nfloat gray = dot(color.rgb, g);\ngl_FragColor = vec4(vec3(gray), 1.0);\n}"

/***/ })

/******/ })["default"];
//# sourceMappingURL=arena-face-tracker.js.map