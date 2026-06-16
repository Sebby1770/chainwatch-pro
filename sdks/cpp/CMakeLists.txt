cmake_minimum_required(VERSION 3.16)
project(chainwatch_cpp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(USE_CURL "Try to link libcurl for real HTTP calls" ON)

add_executable(chainwatch_cli
    src/main.cpp
    src/chainwatch_client.cpp
)

target_include_directories(chainwatch_cli PRIVATE include)

if(USE_CURL)
  find_package(CURL QUIET)
  if(CURL_FOUND)
    target_compile_definitions(chainwatch_cli PRIVATE CHAINWATCH_HAVE_CURL=1)
    target_link_libraries(chainwatch_cli PRIVATE CURL::libcurl)
    message(STATUS "libcurl found — real HTTP mode enabled")
  else()
    message(STATUS "libcurl not found — falling back to pure mock mode")
  endif()
endif()

# Optional: nlohmann_json via FetchContent or system package for prod
# find_package(nlohmann_json 3.11 REQUIRED)
# target_link_libraries(chainwatch_cli PRIVATE nlohmann_json::nlohmann_json)
