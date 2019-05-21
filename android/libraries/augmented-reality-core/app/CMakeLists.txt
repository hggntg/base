# Sets the minimum version of CMake required to build your native library.
# This ensures that a certain set of CMake features is available to
# your build.
cmake_minimum_required(VERSION 3.6)

# Import the ARCore library.
add_library(arcore SHARED IMPORTED)
set_target_properties(arcore PROPERTIES IMPORTED_LOCATION
              ${ARCORE_LIBPATH}/${ANDROID_ABI}/libarcore_sdk_c.so
              INTERFACE_INCLUDE_DIRECTORIES ${ARCORE_INCLUDE}
)