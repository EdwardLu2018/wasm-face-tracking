#include <iostream>
#include <math.h>

#include <emscripten/emscripten.h>

#include <dlib/opencv.h>
#include <opencv2/calib3d/calib3d.hpp>
#include <opencv2/imgproc/imgproc.hpp>

#include <dlib/image_processing.h>
#include <dlib/image_processing/frontal_face_detector.h>
#include <dlib/image_transforms.h>

#include <dlib/external/zlib/zlib.h>

#define PI                  3.14159265
#define FRAME_SKIP_RATE     5
#define MODEL_SIZE          99693937

#define POSE_LEN            7       // 4 + 3

#ifdef __cplusplus
extern "C" {
#endif

using namespace std;
using namespace dlib;
using namespace cv;

frontal_face_detector detector;
shape_predictor pose_model;

std::vector<Point3d> model_points;

EMSCRIPTEN_KEEPALIVE
void pose_model_init(char buf[], size_t buf_len) {
    detector = get_frontal_face_detector();

    char *decompressed = new char[MODEL_SIZE];

    z_stream stream;
    stream.zalloc = Z_NULL;
    stream.zfree = Z_NULL;
    stream.opaque = Z_NULL;
    stream.avail_in = buf_len;
    stream.next_in = (Bytef *)buf;
    stream.avail_out = MODEL_SIZE;
    stream.next_out = (Bytef *)decompressed;

    inflateInit(&stream);
    inflate(&stream, Z_NO_FLUSH);
    inflateEnd(&stream);

    std::string model(decompressed, stream.total_out);
    std::istringstream model_istringstream(model);
    deserialize(pose_model, model_istringstream);

    delete [] buf;
    delete [] decompressed;

    model_points.push_back( Point3d(6.825897, 6.760612, 4.402142) );
    model_points.push_back( Point3d(1.330353, 7.122144, 6.903745) );
    model_points.push_back( Point3d(-1.330353, 7.122144, 6.903745) );
    model_points.push_back( Point3d(-6.825897, 6.760612, 4.402142) );
    model_points.push_back( Point3d(5.311432, 5.485328, 3.987654) );
    model_points.push_back( Point3d(1.789930, 5.393625, 4.413414) );
    model_points.push_back( Point3d(-1.789930, 5.393625, 4.413414) );
    model_points.push_back( Point3d(-5.311432, 5.485328, 3.987654) );
    model_points.push_back( Point3d(2.005628, 1.409845, 6.165652) );
    model_points.push_back( Point3d(-2.005628, 1.409845, 6.165652) );
    model_points.push_back( Point3d(2.774015, -2.080775, 5.048531) );
    model_points.push_back( Point3d(-2.774015, -2.080775, 5.048531) );
    model_points.push_back( Point3d(0.000000, -3.116408, 6.097667) );
    model_points.push_back( Point3d(0.000000, -7.415691, 4.070434) );

    cout << "Face Tracking Ready!" << endl;
}

EMSCRIPTEN_KEEPALIVE
void detect_face_features(uchar pixels[], size_t cols, size_t rows) {
    static correlation_tracker tracker;
    static bool track = false;
    static uint32_t frames = 0;

    int left, top, right, bottom;

    // convert pixels to cv Mat and then to dlib cv_image
    Mat grayIm = Mat(rows, cols, CV_8UC1, pixels);
    cv_image<uint8_t> gray(grayIm);

    dlib::rectangle face_rect;
    if (!track) {
        std::vector<dlib::rectangle> face_rects;
        face_rects = detector(gray);
        face_rect = face_rects[0];
    }
    else {
        double psr = tracker.update(gray); // "Peak-to-Sidelobe Ratio"
        if (0 < psr && psr < 30) {
            face_rect = tracker.get_position();
        }
        else {
            track = false;
        }
    }

    left = face_rect.left();
    top = face_rect.top();
    right = face_rect.right();
    bottom = face_rect.bottom();

    if (left >= 0 && top < rows && right < cols && bottom >= 0) {
        dlib::rectangle face_rect(
            (long)(left),
            (long)(top),
            (long)(right),
            (long)(bottom)
        );

        full_object_detection shape = pose_model(gray, face_rect);

        if (!track) {
            track = true;
            tracker.start_track(gray, face_rect);
        }

        EM_ASM_({
            var $a = arguments;
            var i = 0;

            const features = {};

            features["bbox"] = {};
            features["bbox"]["left"] = $a[i++];
            features["bbox"]["top"] = $a[i++];
            features["bbox"]["right"] = $a[i++];
            features["bbox"]["bottom"] = $a[i++];

            features["landmarks"] = [];
            features["landmarks"][0] = $a[i++];
            features["landmarks"][1] = $a[i++];
            features["landmarks"][2] = $a[i++];
            features["landmarks"][3] = $a[i++];
            features["landmarks"][4] = $a[i++];
            features["landmarks"][5] = $a[i++];
            features["landmarks"][6] = $a[i++];
            features["landmarks"][7] = $a[i++];
            features["landmarks"][8] = $a[i++];
            features["landmarks"][9] = $a[i++];
            features["landmarks"][10] = $a[i++];
            features["landmarks"][11] = $a[i++];
            features["landmarks"][12] = $a[i++];
            features["landmarks"][13] = $a[i++];
            features["landmarks"][14] = $a[i++];
            features["landmarks"][15] = $a[i++];
            features["landmarks"][16] = $a[i++];
            features["landmarks"][17] = $a[i++];
            features["landmarks"][18] = $a[i++];
            features["landmarks"][19] = $a[i++];
            features["landmarks"][20] = $a[i++];
            features["landmarks"][21] = $a[i++];
            features["landmarks"][22] = $a[i++];
            features["landmarks"][23] = $a[i++];
            features["landmarks"][24] = $a[i++];
            features["landmarks"][25] = $a[i++];
            features["landmarks"][26] = $a[i++];
            features["landmarks"][27] = $a[i++];
            features["landmarks"][28] = $a[i++];
            features["landmarks"][29] = $a[i++];
            features["landmarks"][30] = $a[i++];
            features["landmarks"][31] = $a[i++];
            features["landmarks"][32] = $a[i++];
            features["landmarks"][33] = $a[i++];
            features["landmarks"][34] = $a[i++];
            features["landmarks"][35] = $a[i++];
            features["landmarks"][36] = $a[i++];
            features["landmarks"][37] = $a[i++];
            features["landmarks"][38] = $a[i++];
            features["landmarks"][39] = $a[i++];
            features["landmarks"][40] = $a[i++];
            features["landmarks"][41] = $a[i++];
            features["landmarks"][42] = $a[i++];
            features["landmarks"][43] = $a[i++];
            features["landmarks"][44] = $a[i++];
            features["landmarks"][45] = $a[i++];
            features["landmarks"][46] = $a[i++];
            features["landmarks"][47] = $a[i++];
            features["landmarks"][48] = $a[i++];
            features["landmarks"][49] = $a[i++];
            features["landmarks"][50] = $a[i++];
            features["landmarks"][51] = $a[i++];
            features["landmarks"][52] = $a[i++];
            features["landmarks"][53] = $a[i++];
            features["landmarks"][54] = $a[i++];
            features["landmarks"][55] = $a[i++];
            features["landmarks"][56] = $a[i++];
            features["landmarks"][57] = $a[i++];
            features["landmarks"][58] = $a[i++];
            features["landmarks"][59] = $a[i++];
            features["landmarks"][60] = $a[i++];
            features["landmarks"][61] = $a[i++];
            features["landmarks"][62] = $a[i++];
            features["landmarks"][63] = $a[i++];
            features["landmarks"][64] = $a[i++];
            features["landmarks"][65] = $a[i++];
            features["landmarks"][66] = $a[i++];
            features["landmarks"][67] = $a[i++];
            features["landmarks"][68] = $a[i++];
            features["landmarks"][69] = $a[i++];
            features["landmarks"][70] = $a[i++];
            features["landmarks"][71] = $a[i++];
            features["landmarks"][72] = $a[i++];
            features["landmarks"][73] = $a[i++];
            features["landmarks"][74] = $a[i++];
            features["landmarks"][75] = $a[i++];
            features["landmarks"][76] = $a[i++];
            features["landmarks"][77] = $a[i++];
            features["landmarks"][78] = $a[i++];
            features["landmarks"][79] = $a[i++];
            features["landmarks"][80] = $a[i++];
            features["landmarks"][81] = $a[i++];
            features["landmarks"][82] = $a[i++];
            features["landmarks"][83] = $a[i++];
            features["landmarks"][84] = $a[i++];
            features["landmarks"][85] = $a[i++];
            features["landmarks"][86] = $a[i++];
            features["landmarks"][87] = $a[i++];
            features["landmarks"][88] = $a[i++];
            features["landmarks"][89] = $a[i++];
            features["landmarks"][90] = $a[i++];
            features["landmarks"][91] = $a[i++];
            features["landmarks"][92] = $a[i++];
            features["landmarks"][93] = $a[i++];
            features["landmarks"][94] = $a[i++];
            features["landmarks"][95] = $a[i++];
            features["landmarks"][96] = $a[i++];
            features["landmarks"][97] = $a[i++];
            features["landmarks"][98] = $a[i++];
            features["landmarks"][99] = $a[i++];
            features["landmarks"][100] = $a[i++];
            features["landmarks"][101] = $a[i++];
            features["landmarks"][102] = $a[i++];
            features["landmarks"][103] = $a[i++];
            features["landmarks"][104] = $a[i++];
            features["landmarks"][105] = $a[i++];
            features["landmarks"][106] = $a[i++];
            features["landmarks"][107] = $a[i++];
            features["landmarks"][108] = $a[i++];
            features["landmarks"][109] = $a[i++];
            features["landmarks"][110] = $a[i++];
            features["landmarks"][111] = $a[i++];
            features["landmarks"][112] = $a[i++];
            features["landmarks"][113] = $a[i++];
            features["landmarks"][114] = $a[i++];
            features["landmarks"][115] = $a[i++];
            features["landmarks"][116] = $a[i++];
            features["landmarks"][117] = $a[i++];
            features["landmarks"][118] = $a[i++];
            features["landmarks"][119] = $a[i++];
            features["landmarks"][120] = $a[i++];
            features["landmarks"][121] = $a[i++];
            features["landmarks"][122] = $a[i++];
            features["landmarks"][123] = $a[i++];
            features["landmarks"][124] = $a[i++];
            features["landmarks"][125] = $a[i++];
            features["landmarks"][126] = $a[i++];
            features["landmarks"][127] = $a[i++];
            features["landmarks"][128] = $a[i++];
            features["landmarks"][129] = $a[i++];
            features["landmarks"][130] = $a[i++];
            features["landmarks"][131] = $a[i++];
            features["landmarks"][132] = $a[i++];
            features["landmarks"][133] = $a[i++];
            features["landmarks"][134] = $a[i++];
            features["landmarks"][135] = $a[i++];
            features["landmarks"][136] = $a[i++];

            const tagEvent = new CustomEvent("onFaceFeaturesFound", {detail: {features: features}});
            var scope;
            if ('function' === typeof importScripts)
                scope = self;
            else
                scope = window;
            scope.dispatchEvent(tagEvent);
        },
            left,
            top,
            right,
            bottom,

            shape.part(0).x(),
            shape.part(0).y(),
            shape.part(1).x(),
            shape.part(1).y(),
            shape.part(2).x(),
            shape.part(2).y(),
            shape.part(3).x(),
            shape.part(3).y(),
            shape.part(4).x(),
            shape.part(4).y(),
            shape.part(5).x(),
            shape.part(5).y(),
            shape.part(6).x(),
            shape.part(6).y(),
            shape.part(7).x(),
            shape.part(7).y(),
            shape.part(8).x(),
            shape.part(8).y(),
            shape.part(9).x(),
            shape.part(9).y(),
            shape.part(10).x(),
            shape.part(10).y(),
            shape.part(11).x(),
            shape.part(11).y(),
            shape.part(12).x(),
            shape.part(12).y(),
            shape.part(13).x(),
            shape.part(13).y(),
            shape.part(14).x(),
            shape.part(14).y(),
            shape.part(15).x(),
            shape.part(15).y(),
            shape.part(16).x(),
            shape.part(16).y(),
            shape.part(17).x(),
            shape.part(17).y(),
            shape.part(18).x(),
            shape.part(18).y(),
            shape.part(19).x(),
            shape.part(19).y(),
            shape.part(20).x(),
            shape.part(20).y(),
            shape.part(21).x(),
            shape.part(21).y(),
            shape.part(22).x(),
            shape.part(22).y(),
            shape.part(23).x(),
            shape.part(23).y(),
            shape.part(24).x(),
            shape.part(24).y(),
            shape.part(25).x(),
            shape.part(25).y(),
            shape.part(26).x(),
            shape.part(26).y(),
            shape.part(27).x(),
            shape.part(27).y(),
            shape.part(28).x(),
            shape.part(28).y(),
            shape.part(29).x(),
            shape.part(29).y(),
            shape.part(30).x(),
            shape.part(30).y(),
            shape.part(31).x(),
            shape.part(31).y(),
            shape.part(32).x(),
            shape.part(32).y(),
            shape.part(33).x(),
            shape.part(33).y(),
            shape.part(34).x(),
            shape.part(34).y(),
            shape.part(35).x(),
            shape.part(35).y(),
            shape.part(36).x(),
            shape.part(36).y(),
            shape.part(37).x(),
            shape.part(37).y(),
            shape.part(38).x(),
            shape.part(38).y(),
            shape.part(39).x(),
            shape.part(39).y(),
            shape.part(40).x(),
            shape.part(40).y(),
            shape.part(41).x(),
            shape.part(41).y(),
            shape.part(42).x(),
            shape.part(42).y(),
            shape.part(43).x(),
            shape.part(43).y(),
            shape.part(44).x(),
            shape.part(44).y(),
            shape.part(45).x(),
            shape.part(45).y(),
            shape.part(46).x(),
            shape.part(46).y(),
            shape.part(47).x(),
            shape.part(47).y(),
            shape.part(48).x(),
            shape.part(48).y(),
            shape.part(49).x(),
            shape.part(49).y(),
            shape.part(50).x(),
            shape.part(50).y(),
            shape.part(51).x(),
            shape.part(51).y(),
            shape.part(52).x(),
            shape.part(52).y(),
            shape.part(53).x(),
            shape.part(53).y(),
            shape.part(54).x(),
            shape.part(54).y(),
            shape.part(55).x(),
            shape.part(55).y(),
            shape.part(56).x(),
            shape.part(56).y(),
            shape.part(57).x(),
            shape.part(57).y(),
            shape.part(58).x(),
            shape.part(58).y(),
            shape.part(59).x(),
            shape.part(59).y(),
            shape.part(60).x(),
            shape.part(60).y(),
            shape.part(61).x(),
            shape.part(61).y(),
            shape.part(62).x(),
            shape.part(62).y(),
            shape.part(63).x(),
            shape.part(63).y(),
            shape.part(64).x(),
            shape.part(64).y(),
            shape.part(65).x(),
            shape.part(65).y(),
            shape.part(66).x(),
            shape.part(66).y(),
            shape.part(67).x(),
            shape.part(67).y(),
            shape.part(68).x(),
            shape.part(68).y()
        );
    }
    else {
        track = false; // detect again if bbox is out of bounds
    }

    if (++frames % FRAME_SKIP_RATE == 0) {
        track = false;
    }
}

EMSCRIPTEN_KEEPALIVE
void get_pose(uint16_t landmarks[], size_t cols, size_t rows) {
    static bool first_iter = true;

    static Mat camera_matrix, distortion;
    static Mat rot_vec, trans_vec, rot_mat;
    static Mat out_intrinsics = Mat(3, 3, CV_64FC1);
    static Mat out_rot = Mat(3, 3, CV_64FC1);
    static Mat out_trans = Mat(3, 1, CV_64FC1);
    static Mat pose_mat = Mat(3, 4, CV_64FC1);
    static Mat euler_angle = Mat(3, 1, CV_64FC1);

    static std::vector<Point2d> image_pts;

    double x, y, z;

    if (first_iter) {
        double focal_length = cols;
        Point2d center = Point2d(cols/2, rows/2);
        camera_matrix = (Mat_<double>(3,3) << focal_length, 0, center.x, 0 , focal_length, center.y, 0, 0, 1);
        distortion = Mat::zeros(4, 1, CV_64FC1);
        first_iter = false;
    }

    image_pts.push_back(Point2d(landmarks[2*17], landmarks[2*17+1])); // left brow left corner
    image_pts.push_back(Point2d(landmarks[2*21], landmarks[2*21+1])); // left brow right corner
    image_pts.push_back(Point2d(landmarks[2*22], landmarks[2*22+1])); // right brow left corner
    image_pts.push_back(Point2d(landmarks[2*26], landmarks[2*26+1])); // right brow right corner
    image_pts.push_back(Point2d(landmarks[2*36], landmarks[2*36+1])); // left eye left corner
    image_pts.push_back(Point2d(landmarks[2*39], landmarks[2*39+1])); // left eye right corner
    image_pts.push_back(Point2d(landmarks[2*42], landmarks[2*42+1])); // right eye left corner
    image_pts.push_back(Point2d(landmarks[2*45], landmarks[2*45+1])); // right eye right corner
    image_pts.push_back(Point2d(landmarks[2*31], landmarks[2*31+1])); // nose left corner
    image_pts.push_back(Point2d(landmarks[2*35], landmarks[2*35+1])); // nose right corner
    image_pts.push_back(Point2d(landmarks[2*48], landmarks[2*48+1])); // mouth left corner
    image_pts.push_back(Point2d(landmarks[2*54], landmarks[2*54+1])); // mouth right corner
    image_pts.push_back(Point2d(landmarks[2*57], landmarks[2*57+1])); // mouth central bottom corner
    image_pts.push_back(Point2d(landmarks[2*8],  landmarks[2*8+1]));  // chin corner

    solvePnP(model_points, image_pts, camera_matrix, distortion, rot_vec, trans_vec);

    image_pts.clear();

    Rodrigues(rot_vec, rot_mat);
    hconcat(rot_mat, trans_vec, pose_mat);
    decomposeProjectionMatrix(pose_mat, out_intrinsics, out_rot, out_trans, noArray(), noArray(), noArray(), euler_angle);

    x = euler_angle.at<double>(0) * PI / 180.0;
    y = euler_angle.at<double>(1) * PI / 180.0;
    z = euler_angle.at<double>(2) * PI / 180.0;

    EM_ASM_({
        var $a = arguments;
        var i = 0;

        const pose = {};
        pose["quaternion"] = {};
        pose["quaternion"]["x"] = $a[i++];
        pose["quaternion"]["y"] = $a[i++];
        pose["quaternion"]["z"] = $a[i++];
        pose["quaternion"]["w"] = $a[i++];

        pose["translation"] = {};
        pose["translation"]["x"] = $a[i++];
        pose["translation"]["y"] = $a[i++];
        pose["translation"]["z"] = $a[i++];

        const tagEvent = new CustomEvent("onFacePoseFound", {detail: {pose: pose}});
        var scope;
        if ('function' === typeof importScripts)
            scope = self;
        else
            scope = window;
        scope.dispatchEvent(tagEvent);
    },
        sin(x/2) * cos(y/2) * cos(z/2) - cos(x/2) * sin(y/2) * sin(z/2),
        cos(x/2) * sin(y/2) * cos(z/2) + sin(x/2) * cos(y/2) * sin(z/2),
        cos(x/2) * cos(y/2) * sin(z/2) - sin(x/2) * sin(y/2) * cos(z/2),
        cos(x/2) * cos(y/2) * cos(z/2) + sin(x/2) * sin(y/2) * sin(z/2),

        trans_vec.at<double>(0),
        trans_vec.at<double>(1),
        trans_vec.at<double>(2)
    );
}

#ifdef __cplusplus
}
#endif
