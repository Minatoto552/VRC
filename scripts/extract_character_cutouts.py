from __future__ import annotations

from collections import deque
from pathlib import Path
from statistics import fmean

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "src" / "assets" / "illustrations"
FILES = (
    "faq-guide.png",
    "join-guide.png",
    "lottery-guide.png",
    "members-guide.png",
    "schedule-guide.png",
    "welcome-guide.png",
)

LOW_THRESHOLD = 34
HIGH_THRESHOLD = 58
LUMA_THRESHOLD = 214
ALPHA_THRESHOLD = 16
PADDING = 36


def brightness(pixel: tuple[int, int, int, int]) -> float:
    red, green, blue, _ = pixel
    return (red + green + blue) / 3


def distance_sq(left: tuple[int, int, int, int], right: tuple[int, int, int]) -> int:
    return sum((left[index] - right[index]) ** 2 for index in range(3))


def sample_background(pixels, width: int, height: int) -> tuple[int, int, int]:
    samples: list[tuple[int, int, int, int]] = []

    for x in range(0, width, max(1, width // 80)):
        samples.append(pixels[x, 0])
        samples.append(pixels[x, height - 1])

    for y in range(0, height, max(1, height // 80)):
        samples.append(pixels[0, y])
        samples.append(pixels[width - 1, y])

    red = round(fmean(sample[0] for sample in samples))
    green = round(fmean(sample[1] for sample in samples))
    blue = round(fmean(sample[2] for sample in samples))
    return red, green, blue


def is_background_pixel(
    pixel: tuple[int, int, int, int],
    background: tuple[int, int, int],
    threshold: int,
) -> bool:
    return (
        pixel[3] > 0
        and brightness(pixel) >= LUMA_THRESHOLD
        and distance_sq(pixel, background) <= threshold**2
    )


def build_alpha_mask(image: Image.Image) -> Image.Image:
    width, height = image.size
    pixels = image.load()
    background = sample_background(pixels, width, height)
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def mark(x: int, y: int) -> None:
        index = y * width + x
        if visited[index]:
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        if is_background_pixel(pixels[x, 0], background, LOW_THRESHOLD):
            mark(x, 0)
        if is_background_pixel(pixels[x, height - 1], background, LOW_THRESHOLD):
            mark(x, height - 1)

    for y in range(height):
        if is_background_pixel(pixels[0, y], background, LOW_THRESHOLD):
            mark(0, y)
        if is_background_pixel(pixels[width - 1, y], background, LOW_THRESHOLD):
            mark(width - 1, y)

    while queue:
        x, y = queue.popleft()

        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if not (0 <= nx < width and 0 <= ny < height):
                continue

            index = ny * width + nx
            if visited[index]:
                continue

            if is_background_pixel(pixels[nx, ny], background, HIGH_THRESHOLD):
                visited[index] = 1
                queue.append((nx, ny))

    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = alpha.load()

    for y in range(height):
        for x in range(width):
            if visited[y * width + x]:
                alpha_pixels[x, y] = 0

    return alpha.filter(ImageFilter.GaussianBlur(1.2))


def crop_to_subject(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0).getbbox()

    if bbox is None:
        return image

    left, top, right, bottom = bbox
    left = max(0, left - PADDING)
    top = max(0, top - PADDING)
    right = min(image.width, right + PADDING)
    bottom = min(image.height, bottom + PADDING)
    return image.crop((left, top, right, bottom))


def create_cutout(source_path: Path) -> Path:
    image = Image.open(source_path).convert("RGBA")
    cutout = image.copy()
    cutout.putalpha(build_alpha_mask(image))
    cutout = crop_to_subject(cutout)

    output_path = source_path.with_name(f"{source_path.stem}-cutout.png")
    cutout.save(output_path)
    return output_path


def main() -> None:
    for filename in FILES:
        output_path = create_cutout(SOURCE_DIR / filename)
        print(f"created {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
