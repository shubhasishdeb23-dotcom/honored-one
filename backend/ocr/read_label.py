"""
read_label.py
--------------
Cleans up a (possibly blurry, tilted, or dim) product label photo using
OpenCV, THEN reads all the text on it using PaddleOCR, and saves the
results (the words, their position, and how confident the AI is) as a
JSON file.

HOW TO USE
1. Put a photo of the product label in the SAME FOLDER as this script.
2. Change IMAGE_PATH below to that photo's file name (or just rename
   your photo to "label.jpg").
3. Open a terminal in this folder and run:
       python read_label.py
4. Two new files will appear in this folder:
       cleaned_label.jpg  -> the touched-up photo PaddleOCR actually reads
       ocr_result.json    -> the text it found, with position + confidence

You can also skip editing IMAGE_PATH and instead run:
       python read_label.py my_photo.jpg
"""

import json
import sys

import cv2
import numpy as np
from paddleocr import PaddleOCR


# ---------- 1. SETTINGS - change these if you need to ----------

# The photo you want to read text from. Change this to your file name,
# or pass a different file name on the command line (see the note above).
IMAGE_PATH = sys.argv[1] if len(sys.argv) > 1 else "label.jpg"

# Where the cleaned-up photo and the JSON result will be saved.
CLEANED_IMAGE_PATH = "cleaned_label.jpg"
OUTPUT_PATH = "ocr_result.json"

# Turn any of these off (set to False) if they make YOUR photos look
# worse instead of better - not every photo needs every fix.
DO_STRAIGHTEN = True         # try to rotate a tilted photo so text is level
DO_UPSCALE = True            # make the image bigger, so small text is easier to read
DO_IMPROVE_CONTRAST = True   # make text stand out more from the background
UPSCALE_FACTOR = 1.6         # 1.6 = 60% bigger. Try 2.0 if text is still tiny.


# ---------- 2. THE OPENCV "CLEAN UP THE PHOTO" STEPS ----------

def straighten_image(image):
    """
    Figures out how tilted the photo is, and rotates it back to level.

    HOW: it turns the photo into black-and-white, treats all the dark
    pixels (mostly text) as "points", and asks OpenCV for the smallest
    tilted rectangle that fits around all those points. The angle of
    that rectangle is roughly the angle the photo is tilted by.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Make text show up as white pixels on a black background - easier
    # for OpenCV to find "where the text is".
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) == 0:
        return image  # blank image, nothing to straighten

    angle = cv2.minAreaRect(coords)[-1]
    # OpenCV's angle can come out in a confusing range - this fixes it
    # so we always rotate the shorter way round.
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    # Skip rotating if the photo is already nearly level - avoids making
    # a perfectly fine photo slightly crooked because of noise.
    if abs(angle) < 0.5:
        return image

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(
        image, matrix, (w, h),
        flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE,
    )


def upscale_image(image, scale):
    """
    Makes the image bigger using a high-quality resize, so small/thin
    text has more pixels for PaddleOCR to work with.
    """
    h, w = image.shape[:2]
    new_w, new_h = int(w * scale), int(h * scale)

    # Safety cap - a huge image can make OCR slow or use a lot of memory.
    max_dimension = 4000
    if max(new_w, new_h) > max_dimension:
        return image

    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)


def improve_contrast(image):
    """
    Makes text stand out more from the background, without changing
    the actual colors much.

    HOW: it splits the image into "how bright" (L) and "what color"
    (A, B) parts, boosts only the brightness contrast using something
    called CLAHE (a smarter, local version of "auto-contrast"), then
    puts the color parts back together.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)

    lab = cv2.merge((l_channel, a_channel, b_channel))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def clean_up_image(image_path, save_path):
    """
    Runs all the enabled cleanup steps in order, saves the result, and
    returns the file path PaddleOCR should read instead of the original.
    """
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(
            f"Couldn't open '{image_path}'. Check the file name and that "
            f"it's in the same folder as this script."
        )

    if DO_STRAIGHTEN:
        print("  - straightening...")
        image = straighten_image(image)

    if DO_UPSCALE:
        print("  - enlarging...")
        image = upscale_image(image, UPSCALE_FACTOR)

    if DO_IMPROVE_CONTRAST:
        print("  - improving contrast...")
        image = improve_contrast(image)

    cv2.imwrite(save_path, image)
    return save_path


# ---------- 3. CLEAN UP THE PHOTO, THEN LOAD THE OCR MODEL ----------

print(f"Cleaning up: {IMAGE_PATH}")
ocr_input_path = clean_up_image(IMAGE_PATH, CLEANED_IMAGE_PATH)
print(f"Saved the cleaned-up photo to: {CLEANED_IMAGE_PATH}")
print("(Open that file yourself to see what PaddleOCR will actually read.)")

# The FIRST time you run this, PaddleOCR needs to download its AI models
# (a few hundred MB) - this can take a few minutes depending on your
# internet connection. Every time after that, it will be fast because
# the models are saved on your computer.
print("\nLoading PaddleOCR... (the very first run may take a few minutes)")

ocr = PaddleOCR(
    use_doc_orientation_classify=False,  # we're not scanning a rotated document/page
    use_doc_unwarping=False,             # not un-warping a curved/bent page
    use_textline_orientation=True,       # helps read text that's sideways/tilted on a label
    lang="en",                           # change to "ch", "hi", etc. if your labels use another language
    enable_mkldnn=False,                 # avoids a known oneDNN/PIR bug in PaddlePaddle on some machines
)


# ---------- 4. READ THE TEXT FROM THE CLEANED-UP IMAGE ----------
print(f"Reading text from: {ocr_input_path}")
result = ocr.predict(ocr_input_path)


# ---------- 5. TURN THE RESULT INTO OUR OWN SIMPLE FORMAT ----------
# PaddleOCR gives back a lot of technical detail. We only pull out the
# three things we care about for each line of text it found:
#   - text:       the words it read
#   - bbox:       the box around that text, as [x1, y1, x2, y2]
#                 (x1,y1 = top-left corner, x2,y2 = bottom-right corner,
#                 measured in pixels from the top-left of the CLEANED image)
#   - confidence: how sure the AI is, from 0 (not sure at all) to 1 (very sure)
lines = []

for page in result:  # usually just one item, for one image
    texts = page["rec_texts"]      # list of text strings PaddleOCR read
    scores = page["rec_scores"]    # list of confidence numbers, one per text line
    boxes = page["rec_boxes"]      # list of [x1, y1, x2, y2] boxes, one per text line

    for text, score, box in zip(texts, scores, boxes):
        lines.append({
            "text": text,
            "bbox": [int(coordinate) for coordinate in box],
            "confidence": round(float(score), 4),
        })


# ---------- 6. SAVE THE RESULT AS JSON ----------
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(lines, f, indent=2, ensure_ascii=False)

print(f"\nDone! Found {len(lines)} line(s) of text.")
print(f"Saved to: {OUTPUT_PATH}")
