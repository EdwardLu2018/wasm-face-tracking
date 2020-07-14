cmake_minimum_required( VERSION 3.1 )
project( DetectFace )

# Use C++ 11 by default
set( CMAKE_CXX_STANDARD 11 )

# Set Release as default build type
if( NOT CMAKE_BUILD_TYPE )
    set( CMAKE_BUILD_TYPE Release )
endif( NOT CMAKE_BUILD_TYPE )

set( CMAKE_CXX_FLAGS_RELEASE "-Oz" )

# Needed for dlib/*
add_subdirectory( dlib )

set( DLIB_NO_GUI_SUPPORT ON )

add_executable( detect_face_wasm detect_face_wasm.cpp )
target_link_libraries( detect_face_wasm dlib::dlib )

# Specify linker arguments
set_target_properties( detect_face_wasm PROPERTIES LINK_FLAGS "-s MODULARIZE=1 -s EXPORT_NAME='FaceDetectorWasm' -s DEMANGLE_SUPPORT=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS='['_malloc', '_free']' -s EXTRA_EXPORTED_RUNTIME_METHODS='['ccall', 'cwrap']' -s WASM=1" )
