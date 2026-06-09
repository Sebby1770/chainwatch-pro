# ChainWatch Pro C++ Client / CLI

Lightweight native client example for ChainWatch Pro.

## Build

```bash
mkdir build && cd build
cmake ..
cmake --build . -j
./chainwatch_cli --help
```

## Usage

```bash
./chainwatch_cli scan 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --chain base
./chainwatch_cli vaults
```

## Notes

- The example performs a mock local computation by default (no network) so it always works.
- Pass `--api-key` and it will attempt a real HTTP call using libcurl if present (CMake will try to find it).
- Production version would use proper JSON (nlohmann/json recommended) + your preferred http client.

See main repo `backend/` for the reference FastAPI server.
