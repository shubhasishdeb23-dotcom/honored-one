"""
extract_fields_ollama.py
------------------------
Sends the raw OCR text from ocr_result.json (produced by read_label.py)
to a local Ollama model (llama3.2) and extracts the 10 mandatory label
fields into a structured JSON file.

The exact 10-field shape is described with Pydantic so the model can't
return something malformed.

HOW TO USE
1. Run read_label.py first so ocr_result.json exists in this folder.
2. Run:
       python extract_fields_ollama.py
3. The structured result is saved to structured_label_ollama.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import ollama
from pydantic import BaseModel, Field

# ---------- 1. SETTINGS ----------

# Where read_label.py saved its OCR output, and where we save the result.
OCR_PATH = Path(__file__).with_name("ocr_result.json")
OUTPUT_PATH = Path(__file__).with_name("structured_label_ollama.json")

# The local model to use. Change if you pulled a different one.
MODEL = "llama3.2"


# ---------- 2. THE EXACT 10-FIELD SHAPE (Pydantic) ----------
# Describing the shape here means the model response has to match it,
# and anything it hallucinates that doesn't fit is rejected.

class LabelFields(BaseModel):
    product_name: str | None = Field(None, description="Name or trade name of the commodity")
    manufacturer: str | None = Field(None, description="Name of the manufacturer / packer")
    manufacturer_address: str | None = Field(None, description="Address of the manufacturer / packer")
    net_quantity: str | None = Field(None, description='Net quantity, e.g. "500 g" or "250 ml"')
    mrp: str | None = Field(None, description="Maximum Retail Price (plain number, no currency symbol)")
    country_of_origin: str | None = Field(None, description="Country of origin (for imported goods)")
    manufacturing_date: str | None = Field(None, description="Month and year of manufacture")
    best_before: str | None = Field(None, description="Best before / use by / expiry date or duration")
    consumer_care: str | None = Field(None, description="Consumer care / complaint contact, incl. phone or toll-free number")
    unit_sale_price: str | None = Field(None, description="Unit sale price, e.g. '240/g' or '12/100g'")


_EXTRACT_PROMPT = """You are an AI extraction specialist for Indian food-label
compliance (Legal Metrology Act 2009). Given the raw OCR text from a product
label below, extract the fields into a flat JSON object with EXACTLY these
keys: product_name, manufacturer, manufacturer_address, net_quantity, mrp,
country_of_origin, manufacturing_date, best_before, consumer_care,
unit_sale_price.

Rules:
- Use null when a field is absent from the label.
- mrp is a plain number, no currency symbol.
- net_quantity looks like "500 g" or "250 ml".
- consumer_care must include a phone / toll-free number; null if missing.
- Clean obvious OCR typos only where you are certain.
- Return ONLY JSON. No extra text, no markdown fences.

OCR TEXT:
{ocr_text}"""


# ---------- 3. LOAD THE OCR OUTPUT ----------

def load_ocr(path: Path) -> list[dict]:
    """Return the lines PaddleOCR found from read_label.py's ocr_result.json."""
    if not path.exists():
        raise FileNotFoundError(
            f"Couldn't find '{path.name}'. Run read_label.py first so it exists."
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def join_ocr_text(lines: list[dict]) -> str:
    """Join every OCR line's text into one block the model can read."""
    return "\n".join(str(item["text"]) for item in lines if item.get("text"))


# ---------- 4. CALL THE LOCAL MODEL ----------

def extract_fields(ocr_text: str) -> LabelFields:
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": _EXTRACT_PROMPT.format(ocr_text=ocr_text)}],
        format=LabelFields.model_json_schema(),
        stream=False,
    )
    content = response["message"]["content"]
    data = json.loads(content)
    return LabelFields(**data)


# ---------- 5. MAIN ----------

def main() -> None:
    lines = load_ocr(OCR_PATH)
    ocr_text = join_ocr_text(lines)
    print(f"Loaded {len(lines)} OCR line(s) from {OCR_PATH.name}.")

    if not ocr_text.strip():
        print("No text found in the OCR result - nothing to extract.")
        sys.exit(1)

    print(f"Sending label text to local model '{MODEL}'...")
    fields = extract_fields(ocr_text)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(fields.model_dump(), f, indent=2, ensure_ascii=False)

    print(f"Done! Structured fields saved to: {OUTPUT_PATH.name}")


if __name__ == "__main__":
    main()
