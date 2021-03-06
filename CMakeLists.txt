cmake_minimum_required( VERSION 3.1 )
project( FaceTracker )

set( CMAKE_CXX_STANDARD 11 )

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif(NOT CMAKE_BUILD_TYPE)

set( CMAKE_CXX_FLAGS_RELEASE "-Wall -O3" )

# set( WASM ${CMAKE_SOURCE_DIR}/wasm )
# file( MAKE_DIRECTORY ${WASM} )
# set( CMAKE_RUNTIME_OUTPUT_DIRECTORY ${WASM} )

set( BUILD_WASM opencv/build_wasm )
set( SRC_DIR emscripten )

add_subdirectory( dlib/dlib )
set( DLIB_NO_GUI_SUPPORT ON )

include_directories( ${BUILD_WASM} )
include_directories( ${BUILD_WASM}/opencv/include )

file( GLOB opencv_include_modules "${BUILD_WASM}/opencv/modules/*/include" )
include_directories( ${opencv_include_modules} )

file( GLOB opencv_js "${BUILD_WASM}/lib/*.a" )

include_directories( ${SRC_DIR} )
file( GLOB SRCS ${SRC_DIR}/*.cpp )

add_executable( face_tracker_wasm ${SRC_DIR}/face_tracker_wasm.cpp ${SRCS} )
target_link_libraries( face_tracker_wasm dlib::dlib ${opencv_js} )

set_target_properties( face_tracker_wasm PROPERTIES LINK_FLAGS "--memory-init-file 0 -s MODULARIZE=1 -s EXPORT_NAME='FaceTrackerWASM' -s SINGLE_FILE=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS='['_malloc', '_free']' -s EXTRA_EXPORTED_RUNTIME_METHODS='['cwrap']' -s USE_ZLIB=1 -s WASM=1" )
