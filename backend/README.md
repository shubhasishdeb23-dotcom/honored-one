# LabelGuard AI - backend / OCR

This folder holds the Python side of LabelGuard AI: reading text off a
product label photo. The `src/` folder at the project root is the React
frontend and doesn't call this yet - for now this runs as a standalone
script you use from the command line, side by side with the frontend.

## What's here

```
backend/
  ocr/
    read_label.py     - cleans up a label photo (OpenCV) then reads its
                         text (PaddleOCR), saving text + position +
                         confidence to a JSON file
  requirements.txt    - the Python packages read_label.py needs
```

## Windows setup (one time)

Open Command Prompt and run these one at a time:

```
python -m pip install --upgrade pip
python -m pip install paddlepaddle==3.3.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
cd backend
python -m pip install -r requirements.txt
```

(macOS/Linux: the same commands work, but you can usually just run
`pip install paddlepaddle` for the first one instead of the Windows CPU
index URL.)

## Running it

1. Put a photo of a product label in `backend/ocr/` (next to
   `read_label.py`).
2. From that folder, run:
   ```
   python read_label.py your_photo.jpg
   ```
3. Two new files appear in `backend/ocr/`:
   - `cleaned_label.jpg` - the straightened/enlarged/contrast-boosted
     photo PaddleOCR actually read
   - `ocr_result.json` - every line of text it found, with its position
     (`bbox: [x1, y1, x2, y2]`) and a confidence score (0-1)

## Where this fits into the bigger picture

This script is the first stage of the pipeline described earlier for the
hackathon build (OCR -> field extraction -> rule engine -> score ->
report). Right now it only does the OCR stage and writes a JSON file -
turning that into a live API the React frontend can call (a `POST /scan`
endpoint) is the next step, not yet wired up here.
