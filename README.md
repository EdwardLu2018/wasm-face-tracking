# wasm-face-tracking

Pretty much just a standalone version for [this](https://github.com/conix-center/ARENA-core/tree/master/face-tracking)

## Building

Download npm dependencies:
```shell
npm install
```

Download dlib:
```shell
git clone https://github.com/davisking/dlib
```

Download and install emsdk (version 1.39.16 is recommended):
```shell
git clone https://github.com/emscripten-core/emsdk
cd emsdk
./emsdk update
./emsdk install 1.39.16
./emsdk activate 1.39.16
cd ..
```

Next, you need opencv with WebAssembly support.

Instead of building opencv, you can use opencv-em: https://gist.github.com/kalwalt/a5fb9230f21b9e39f6fbc872cf20c376
```shell
curl --location "https://github.com/webarkit/opencv-em/releases/download/0.0.3/opencv-em-4.5.0-alpha-rc1.zip" -o opencv-em.zip
unzip -o opencv-em.zip -d opencv
cp -avr opencv/build_wasm/opencv ./
rm opencv-em.zip
```

OR

You can build opencv_js manually (make sure emsdk is installed!): https://docs.opencv.org/master/d4/da1/tutorial_js_setup.html
```shell
git clone https://github.com/opencv/opencv.git
cd opencv
python ./platforms/js/build_js.py build_wasm --build_wasm
```
The python script will build the static and the WASM lib in the build_wasm folder.

Then, run:
```shell
npm run build
```
