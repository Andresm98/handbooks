import os
import struct
import zlib

os.makedirs("public/icons", exist_ok=True)

COLORS = {
    "icon-192.png": (56, 189, 248),
    "icon-512.png": (56, 189, 248),
    "apple-touch-icon.png": (56, 189, 248),
}
SIZES = {
    "icon-192.png": (192, 192),
    "icon-512.png": (512, 512),
    "apple-touch-icon.png": (180, 180),
}


def write_png(path, width, height, rgb):
    pixels = bytes(rgb) * width
    raw_image = b"".join(b"\x00" + pixels for _ in range(height))
    compressed = zlib.compress(raw_image, 9)

    def chunk(chunk_type, data):
        chunk_payload = struct.pack("!I", len(data)) + chunk_type + data
        checksum = struct.pack("!I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
        return chunk_payload + checksum

    ihdr = struct.pack("!IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", compressed)
        + chunk(b"IEND", b"")
    )

    with open(path, "wb") as f:
        f.write(png)


for filename, rgb in COLORS.items():
    width, height = SIZES[filename]
    write_png(os.path.join("public/icons", filename), width, height, rgb)

print("Created icons:", ", ".join(COLORS.keys()))
