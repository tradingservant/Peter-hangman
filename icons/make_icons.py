#!/usr/bin/env python3
"""Draw the Peter's Hangman icons with the Python standard library."""

import math
import struct
import zlib
from pathlib import Path

BG = (35, 72, 60, 255)  # #23483c
CREAM = (243, 234, 215, 255)  # #f3ead7
OUT = Path(__file__).resolve().parent


def write_png(path, width, height, rows):
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    raw = b"".join(b"\x00" + bytes(row) for row in rows)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def canvas(size, color):
    pixel = bytes(color)
    return [bytearray(pixel * size) for _ in range(size)]


def blend(row, index, color):
    sr, sg, sb, sa = color
    if sa <= 0:
        return
    if sa >= 255:
        row[index : index + 4] = bytes(color)
        return
    dr, dg, db, da = row[index : index + 4]
    src_a = sa / 255
    dst_a = da / 255
    out_a = src_a + dst_a * (1 - src_a)
    if out_a <= 0:
        row[index : index + 4] = b"\x00\x00\x00\x00"
        return
    row[index] = int((sr * src_a + dr * dst_a * (1 - src_a)) / out_a)
    row[index + 1] = int((sg * src_a + dg * dst_a * (1 - src_a)) / out_a)
    row[index + 2] = int((sb * src_a + db * dst_a * (1 - src_a)) / out_a)
    row[index + 3] = int(out_a * 255)


def stamp_disc(img, cx, cy, radius, color):
    if radius <= 0:
        return
    height = len(img)
    width = len(img[0]) // 4
    x0 = max(0, int(cx - radius - 1))
    x1 = min(width - 1, int(cx + radius + 1))
    y0 = max(0, int(cy - radius - 1))
    y1 = min(height - 1, int(cy + radius + 1))
    limit = radius * radius
    for y in range(y0, y1 + 1):
        dy = y + 0.5 - cy
        row = img[y]
        for x in range(x0, x1 + 1):
            dx = x + 0.5 - cx
            dist2 = dx * dx + dy * dy
            if dist2 > limit:
                continue
            edge = radius - math.sqrt(dist2)
            alpha = 255 if edge >= 1 else max(0, min(255, int(edge * 255)))
            blend(row, x * 4, (color[0], color[1], color[2], alpha))


def stroke_line(img, x0, y0, x1, y1, thickness, color):
    length = math.hypot(x1 - x0, y1 - y0)
    step = max(0.45, thickness / 5)
    steps = max(1, int(length / step))
    radius = thickness / 2
    for i in range(steps + 1):
        t = i / steps
        stamp_disc(img, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, color)


def stroke_circle(img, cx, cy, radius, thickness, color):
    steps = max(16, int(2 * math.pi * radius / max(0.45, thickness / 5)))
    brush = thickness / 2
    for i in range(steps):
        angle = 2 * math.pi * i / steps
        stamp_disc(
            img,
            cx + radius * math.cos(angle),
            cy + radius * math.sin(angle),
            brush,
            color,
        )


def fill_round_rect(img, left, top, right, bottom, radius, color):
    height = len(img)
    width = len(img[0]) // 4
    radius = max(0, min(radius, (right - left) / 2, (bottom - top) / 2))
    for y in range(max(0, int(top)), min(height, int(bottom) + 1)):
        cy = y + 0.5
        row = img[y]
        for x in range(max(0, int(left)), min(width, int(right) + 1)):
            cx = x + 0.5
            dx = 0
            dy = 0
            if cx < left + radius and cy < top + radius:
                dx = cx - (left + radius)
                dy = cy - (top + radius)
            elif cx > right - radius and cy < top + radius:
                dx = cx - (right - radius)
                dy = cy - (top + radius)
            elif cx < left + radius and cy > bottom - radius:
                dx = cx - (left + radius)
                dy = cy - (bottom - radius)
            elif cx > right - radius and cy > bottom - radius:
                dx = cx - (right - radius)
                dy = cy - (bottom - radius)
            if dx or dy:
                if dx * dx + dy * dy > radius * radius:
                    continue
            elif not (left <= cx <= right and top <= cy <= bottom):
                continue
            blend(row, x * 4, color)


def downscale(img, factor):
    height = len(img) // factor
    width = (len(img[0]) // 4) // factor
    samples = factor * factor
    out = []
    for y in range(height):
        row = bytearray(width * 4)
        for x in range(width):
            total = [0, 0, 0, 0]
            for oy in range(factor):
                source = img[y * factor + oy]
                base = x * factor * 4
                for ox in range(factor):
                    index = base + ox * 4
                    total[0] += source[index]
                    total[1] += source[index + 1]
                    total[2] += source[index + 2]
                    total[3] += source[index + 3]
            for channel in range(4):
                row[x * 4 + channel] = total[channel] // samples
        out.append(row)
    return out


def draw_gallows(img, box, color, hole):
    left, top, right, bottom = box
    width = right - left
    height = bottom - top

    def px(nx, ny):
        return left + nx / 100 * width, top + ny / 100 * height

    stroke = max(3, width * 0.045)
    stroke_line(img, *px(10, 90), *px(58, 90), stroke, color)
    stroke_line(img, *px(24, 90), *px(24, 10), stroke, color)
    stroke_line(img, *px(24, 10), *px(70, 10), stroke, color)
    stroke_line(img, *px(70, 10), *px(70, 24), stroke * 0.72, color)
    head = px(70, 36)
    head_r = width * 0.075
    stroke_circle(img, head[0], head[1], head_r, stroke * 0.72, color)
    stroke_line(img, *px(70, 36 + 11), *px(70, 66), stroke * 0.72, color)
    stroke_line(img, *px(70, 50), *px(54, 62), stroke * 0.72, color)
    stroke_line(img, *px(70, 50), *px(86, 62), stroke * 0.72, color)
    stroke_line(img, *px(70, 66), *px(56, 86), stroke * 0.72, color)
    stroke_line(img, *px(70, 66), *px(84, 86), stroke * 0.72, color)
    del hole


def render(size, kind):
    scale = 3
    big = size * scale
    if kind == "any":
        img = canvas(big, (0, 0, 0, 0))
        pad = big * 0.04
        radius = big * 0.22
        fill_round_rect(img, pad, pad, big - pad, big - pad, radius, BG)
        inset = big * 0.16
    else:
        img = canvas(big, BG)
        inset = big * 0.2
    draw_gallows(img, (inset, inset, big - inset, big - inset), CREAM, BG)
    return downscale(img, scale)


def main():
    icons = {
        "icon-192.png": (192, "any"),
        "icon-512.png": (512, "any"),
        "icon-maskable-512.png": (512, "maskable"),
        "apple-touch-icon.png": (180, "apple"),
    }
    for name, (size, kind) in icons.items():
        rows = render(size, kind)
        write_png(OUT / name, size, size, rows)
        print(f"wrote {name} ({size}x{size})")


if __name__ == "__main__":
    main()
