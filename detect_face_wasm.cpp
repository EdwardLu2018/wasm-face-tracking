#include <emscripten/emscripten.h>
#include <iostream>

#include <dlib/image_processing.h>
#include <dlib/image_processing/frontal_face_detector.h>
#include <dlib/image_transforms.h>

#define DOWNSAMPLE_RATIO    1.25

#ifdef __cplusplus
extern "C" {
#endif

using namespace std;
using namespace dlib;

frontal_face_detector detector;
shape_predictor pose_model;

EMSCRIPTEN_KEEPALIVE
void pose_model_init(char buf[], size_t buf_len) {
    detector = get_frontal_face_detector();

    std::string model(buf, buf_len);
    std::istringstream model_istringstream(model);
    deserialize(pose_model, model_istringstream);

    delete [] buf;

    cout << "Ready to detect!\n";
}

EMSCRIPTEN_KEEPALIVE
uint16_t *detect_face_features(unsigned char srcData[], size_t srcCols, size_t srcRows) {
    static std::vector<dlib::rectangle> d;
    static full_object_detection shape;

    uint8_t parts_len;
    uint16_t *parts;

    array2d<uint8_t> gray, gray_small;
    gray.set_size(srcRows, srcCols);
    gray_small.set_size(srcRows / DOWNSAMPLE_RATIO, srcCols / DOWNSAMPLE_RATIO);

    uint32_t idx;
    for (int i = 0; i < srcRows; ++i) {
        for (int j = 0; j < srcCols; ++j) {
            idx = (i * srcCols * 4) + j * 4;

            // rgba to rgb
            unsigned char r = srcData[idx];
            unsigned char g = srcData[idx + 1];
            unsigned char b = srcData[idx + 2];
            // unsigned char a = srcData[idx + 3];

            // turn src image to gray scale
            gray[i][j] = (0.30 * r) + (0.59 * g) + (0.11 * b);
        }
    }

    // optimization: shrink image but grow output
    resize_image(gray, gray_small);

    d = detector(gray_small);

    dlib::rectangle rect(
        (long)(d[0].left() * DOWNSAMPLE_RATIO),
        (long)(d[0].top() * DOWNSAMPLE_RATIO),
        (long)(d[0].right() * DOWNSAMPLE_RATIO),
        (long)(d[0].bottom() * DOWNSAMPLE_RATIO)
    );

    shape = pose_model(gray, rect);

    parts_len = 1 + shape.num_parts() * 2;
    parts = new uint16_t[parts_len];
    parts[0] = parts_len; // set first idx to len when passed to js

    for (uint8_t i = 0, j = 1; i < shape.num_parts(); i += 1, j += 2) {
        parts[j] = shape.part(i).x();
        parts[j + 1] = shape.part(i).y();
    }

    return parts;
}

#ifdef __cplusplus
}
#endif
