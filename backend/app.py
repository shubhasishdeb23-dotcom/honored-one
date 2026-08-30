"""
LabelGuard AI - real scan API for the React frontend.

Exposes:
    POST /api/scan            -> upload an image, get real OCR + AI results
    GET  /health              -> readiness probe

Flow (per scanned image):
    1. OCR every line with PaddleOCR (OpenCV cleanup first) -> [{text,bbox,confidence}].
    2. Extract the 10 label fields with a local Ollama model (structured JSON).
    3. Apply the Legal Metrology rule engine -> PASS / FAIL / REVIEW + score + risk.
    4. Return JSON shaped exactly like the React app's ScanResult.

Run:
    python app.py          (then point the frontend at http://localhost:8000)
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import time
from pathlib import Path

from fastapi import FastAPI, File, Response, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR.parent))          # honored-one/
sys.path.insert(0, r"C:\Users\Lenovo\Downloads\labelguard-app")  # reuse rule engine

from labelguard import checker_adapter, extractor, ocr as lab_ocr  # noqa: E402
from labelguard.vision import preprocess  # noqa: E402  (OpenCV cleanup)

import numpy as np  # noqa: E402
import cv2  # noqa: E402

app = FastAPI(title="LabelGuard AI Backend", version="1.0.0")

# Let the Vite dev server (localhost:5173) call us during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# OCR (Member 2)
# --------------------------------------------------------------------------

_LIBRARY: dict = {}


def _paddle_reader():
    if "reader" in _LIBRARY:
        return _LIBRARY["reader"]
    from paddleocr import PaddleOCR

    reader = PaddleOCR(
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=True,
        lang="en",
        enable_mkldnn=False,  # avoid a known oneDNN/PIR bug on some machines
    )
    _LIBRARY["reader"] = reader
    return reader


def _ocr_lines(img_bgr: np.ndarray) -> list[dict]:
    """Run OCR over a BGR image; return [{text, bbox:[x1,y1,x2,y2], confidence}]."""
    variants = preprocess(img_bgr, ["enhanced"])
    source = variants["enhanced"]
    raw = _paddle_reader().predict(source)
    items: list[dict] = []
    for page in raw:
        d = getattr(page, "json", None)
        if isinstance(d, dict):
            res = d.get("res", {})
            texts = res.get("rec_texts") or []
            scores = res.get("rec_scores") or []
            boxes = res.get("rec_boxes") or []
        elif isinstance(page, dict):
            texts = page.get("rec_texts") or page.get("rec_res") or []
            scores = page.get("rec_scores") or []
            boxes = page.get("rec_boxes") or []
        else:
            continue
        for text, score, box in zip(texts, scores, boxes):
            flat = np.asarray(box).reshape(-1, 2)
            x1, y1 = int(flat[:, 0].min()), int(flat[:, 1].min())
            x2, y2 = int(flat[:, 0].max()), int(flat[:, 1].max())
            items.append({
                "text": str(text).strip(),
                "bbox": [x1, y1, x2, y2],
                "confidence": round(float(score), 3),
            })
    return items


# --------------------------------------------------------------------------
# Field extraction (Member 3) - reuse labelguard's deterministic + Ollama path
# --------------------------------------------------------------------------

def _extract_fields(items: list[dict]) -> tuple[dict, dict]:
    """Return (field -> {value, confidence}, and raw OCR text joined)."""
    from labelguard.ocr import OCRItem

    ocr_items = [
        OCRItem(text=it["text"], bbox=tuple(it["bbox"]), confidence=it["confidence"])
        for it in items
    ]
    joined = " ".join(it["text"] for it in items if it.get("text"))
    fields = extractor.extract_fields(joined, ocr_items, use_llm=True)
    fields_dict = extractor.fields_to_dict(fields)
    return fields_dict, joined


# --------------------------------------------------------------------------
# Compliance rule engine (Member 5) - reuse labelguard's checker adapter
# --------------------------------------------------------------------------

# Map each label field -> the specific Legal Metrology provision that
# mandates the declaration, shown verbatim to the user.
_LAW_MAP = {
    "mrp": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6",
        "requirement": "The Maximum Retail Price (MRP) inclusive of all taxes must be declared on the package in the prescribed form.",
        "violation": "The label is non-compliant for retail sale until a valid Maximum Retail Price (MRP), inclusive of all taxes, is declared.",
    },
    "net_quantity": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6",
        "requirement": "The net quantity in terms of a standard unit of weight or measure (e.g. g, kg, ml, l) must be declared.",
        "violation": "The label is non-compliant until the net quantity in a standard unit of weight or measure is declared.",
    },
    "manufacturer": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6",
        "requirement": "The name of the manufacturer, packer or importer must be declared.",
        "violation": "The label is non-compliant until the name of the manufacturer, packer or importer is declared.",
    },
    "manufacturer_address": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6",
        "requirement": "The address of the manufacturer, packer or importer must be declared.",
        "violation": "The label is non-compliant until the address of the manufacturer, packer or importer is declared.",
    },
    "manufacturing_date": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6",
        "requirement": "The month and year in which the commodity is manufactured or pre-packed (or a best-before / use-by date) must be declared.",
        "violation": "The label is non-compliant until a manufacturing / pre-packing date or a best-before / use-by date is declared.",
    },
    "best_before": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6",
        "requirement": "The best-before or use-by date must be declared where applicable.",
        "violation": "The label is non-compliant until a best-before or use-by date is declared (where applicable).",
    },
    "consumer_care": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6",
        "requirement": "The name, address, telephone number or e-mail of the consumer-care contact for complaints must be declared.",
        "violation": "The label is non-compliant until a consumer-care contact (phone or e-mail) is declared.",
    },
    "country_of_origin": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6",
        "requirement": "The country of origin must be declared where the commodity is imported and its origin is claimed.",
        "violation": "The label is non-compliant until the country of origin is declared (for imports claiming a local origin).",
    },
    "unit_sale_price": {
        "law": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "requirement": "The unit sale price (price per standard unit) must be declared where mandated.",
        "violation": "The label is non-compliant until the unit sale price is declared (where mandated).",
    },
}


def _reason_for(c: dict, val) -> str:
    """Build a clear human-readable 'why' for a check."""
    status = c["status"]
    label = (c.get("field") or "").replace("_", " ").title()
    if status == "PASS":
        return f"Compliant: '{val}' was detected and satisfies the declaration requirement for {label}."
    if status == "FAIL":
        return f"Violation: the required declaration for {label} is missing on the label."
    if status == "REVIEW":
        side = c.get("message", "")
        if "format" in side or "Format" in side:
            return f"Needs review: a value for {label} was detected but its format does not clearly match what the law requires, so it cannot be confirmed automatically."
        pct = round(float(c.get("confidence") or 0) * 100)
        return f"Needs review: the reading for {label} had low OCR confidence ({pct}%) and should be confirmed against the physical label by a human."
    return f"{label} could not be assessed automatically."


def _compliance(fields_dict: dict) -> dict:
    """Run the rule engine and return {checks, score, risk_level, note}."""
    from labelguard.extractor import FieldVal

    fields = {
        k: FieldVal(value=v["value"], confidence=v["confidence"], source=v["source"])
        for k, v in fields_dict.items()
    }
    evaluation = checker_adapter.evaluate(fields, rag_on=True)
    checks = []
    for c in evaluation["checks"]:
        # The rule engine keeps the extracted value in c["message"]; expose it
        # as "value" too so the React UI can render each field's reading.
        val = fields.get(c["field"]).value if fields.get(c["field"]) else c.get("value")
        law_ref = _LAW_MAP.get(c["field"], {})
        checks.append({
            "field": c["field"],
            "status": c["status"],
            "value": val if val is not None else c.get("value"),
            "confidence": round(c.get("confidence", 0.0), 3),
            "rule_citation": c.get("citation", ""),
            "law": law_ref.get("law", "Legal Metrology (Packaged Commodities) Rules, 2011"),
            "requirement": law_ref.get("requirement", c.get("requirement", "")),
            "violation": law_ref.get("violation", ""),
            "reason": _reason_for(c, val),
            "explanation": c.get("message", ""),
        })
    score = int(round(evaluation["score"]))
    risk = evaluation["risk_level"]
    note = evaluation.get("summary", "")
    return {"checks": checks, "score": score, "risk_level": risk, "note": note}


_FIELD_ORDER = [
    "product_name", "manufacturer", "manufacturer_address", "net_quantity",
    "mrp", "country_of_origin", "manufacturing_date", "best_before",
    "consumer_care", "unit_sale_price",
]


def _products(fields_dict: dict) -> dict:
    return {
        f: (fields_dict.get(f) or {}).get("value")
        for f in _FIELD_ORDER
    }


def _readability(items: list, img_h: int = 0) -> dict:
    """Estimate declaration legibility from OCR line heights.

    Each OCR line's bounding-box height (px) is converted to an approximate
    millimetre font height (nominal 96 DPI -> 0.2646 mm/px, x-height roughly
    0.65x the line box). Legal Metrology (Packaged Commodities) Rules, 2011
    require mandatory declarations to be legibly printed at a minimum size, so
    tiny text is flagged as a readability risk.

    Returns a block shaped for the React UI:
      { min_font_mm, avg_font_mm, lines, status, note }
    """
    if not items:
        return {
            "min_font_mm": 0.0,
            "avg_font_mm": 0.0,
            "lines": [],
            "status": "FAIL",
            "note": "No text detected, so legibility could not be verified.",
        }

    MM_PER_PX = 0.264583
    X_HEIGHT_FACTOR = 0.65
    THRESHOLD_MM = 1.5  # conservative minimum for readable declaration text

    lines = []
    heights = []
    for it in items:
        text = it.get("text", "")
        bbox = it.get("bbox") or [0, 0, 0, 0]
        h_px = max(0.0, float(bbox[3] - bbox[1]))
        font_mm = round(h_px * MM_PER_PX * X_HEIGHT_FACTOR, 2)
        heights.append(font_mm)
        lines.append({
            "text": text,
            "font_mm": font_mm,
            "readable": font_mm >= THRESHOLD_MM,
        })

    min_mm = round(min(heights), 2)
    avg_mm = round(sum(heights) / len(heights), 2)
    small = [l for l in lines if not l["readable"]]

    if small:
        status = "REVIEW"
        note = (
            f"{len(small)} text line(s) appear smaller than the ~{THRESHOLD_MM} mm "
            "legibility guideline. Confirm the mandatory declarations are clearly legible "
            "on the physical label."
        )
    else:
        status = "PASS"
        note = "Detected text is printed at a legible size."

    return {
        "min_font_mm": min_mm,
        "avg_font_mm": avg_mm,
        "lines": lines[:50],
        "status": status,
        "note": note,
    }


def _build_response(items: list, fields_dict: dict, extra: dict | None = None,
                    img: "np.ndarray | None" = None) -> dict:
    """Collapse the per-endpoint pipeline into the JSON shape the React app expects."""
    resp = {
        "id": "",
        "image_path": "",
        "ocr_raw": items,
        "product": _products(fields_dict),
        "readability": _readability(items, img.shape[0] if img is not None else 0),
        "compliance": _compliance(fields_dict),
        "timestamp": "",
        "scan_type": "upload",
    }
    if extra:
        resp.update(extra)
    return resp


def _decode_qr(img_bgr: np.ndarray) -> str:
    """Try to decode any QR code(s) in the image with OpenCV. Returns '' if none."""
    try:
        detector = cv2.QRCodeDetector()
        data, _points, _straight = detector.detectAndDecode(img_bgr)
        if data and data.strip():
            return data.strip()
    except Exception:  # noqa: BLE001 - QR decoding must never break a scan
        pass
    return ""


def _extract_with_extra_text(items: list, extra_text: str = "") -> tuple[dict, str]:
    """Run extraction on the OCR lines, injecting any decoded QR text first."""
    from labelguard.ocr import OCRItem

    ocr_items = [
        OCRItem(text=it["text"], bbox=tuple(it["bbox"]), confidence=it["confidence"])
        for it in items
    ]
    joined = " ".join(it["text"] for it in items if it.get("text"))
    if extra_text:
        joined = f"{extra_text} {joined}".strip()
    fields = extractor.extract_fields(joined, ocr_items, use_llm=True)
    fields_dict = extractor.fields_to_dict(fields)
    return fields_dict, joined


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@app.get("/health")
def health() -> dict:
    from labelguard import llm
    return {
        "status": "ok",
        "ollama": llm.ollama_available(),
        "models": list_models(),
    }


def list_models() -> list[str]:
    try:
        from labelguard import llm
        req = __import__("urllib.request", fromlist=["request"])
        import json as _json
        data = _json.loads(req.urlopen("http://localhost:11434/api/tags", timeout=10).read())
        return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


@app.post("/api/scan")
async def scan(file: UploadFile = File(...)) -> dict:
    data = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        img = cv2.imread(tmp_path)
        if img is None:
            from PIL import Image
            pil = Image.open(tmp_path).convert("RGB")
            im_arr = np.array(pil)[:, :, ::-1]  # RGB -> BGR
            img = im_arr.copy()
        items = _ocr_lines(img)
        fields_dict, joined = _extract_fields(items)
        compliance = _compliance(fields_dict)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return {
        "id": "",
        "image_path": "",
        "ocr_raw": items,
        "product": _products(fields_dict),
        "readability": _readability(items, img.shape[0] if img is not None else 0),
        "compliance": compliance,
        "timestamp": "",
        "scan_type": "upload",
    }


@app.post("/api/scan/url")
async def scan_url(payload: dict) -> dict:
    """Scan an image given by URL. Downloads it then defers to /api/scan logic."""
    import asyncio
    import urllib.request

    url = payload.get("url", "")
    if not url:
        return {"error": "url required"}
    try:
        loop = asyncio.get_running_loop()
        req = urllib.request.Request(url, headers={"User-Agent": "LabelGuard"})
        data = await loop.run_in_executor(None, lambda: urllib.request.urlopen(req, timeout=30).read())
    except Exception as exc:
        return JSONResponse(status_code=400, content={"error": f"Could not download image from URL: {exc}"})

    with tempfile.NamedTemporaryFile(suffix=".img", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        img = cv2.imread(tmp_path)
        if img is None:
            from PIL import Image
            try:
                pil = Image.open(tmp_path).convert("RGB")
            except Exception as exc:
                return JSONResponse(
                    status_code=400,
                    content={"error": "URL did not return a readable image. It may be SVG, HTML, or a broken link."},
                )
            img = np.array(pil)[:, :, ::-1].copy()
        if img is None:
            return JSONResponse(status_code=400, content={"error": "URL did not return a readable image."})
        items = _ocr_lines(img)
        fields_dict, joined = _extract_fields(items)
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    return _build_response(items, fields_dict, {"source_url": url}, img=img)


@app.post("/api/scan/qr")
async def scan_qr(file: UploadFile = File(...)) -> dict:
    """Scan an image that contains a QR code: decode the QR, then run the full
    OCR + extraction + compliance pipeline with the decoded payload injected as
    label text. Returns the barcode string in the payload too."""
    data = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        img = cv2.imread(tmp_path)
        if img is None:
            from PIL import Image
            pil = Image.open(tmp_path).convert("RGB")
            img = np.array(pil)[:, :, ::-1].copy()
        qr_text = _decode_qr(img)
        items = _ocr_lines(img)
        fields_dict, joined = _extract_with_extra_text(items, qr_text)
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    return _build_response(items, fields_dict, {"scan_type": "qr", "barcode": qr_text}, img=img)


@app.post("/api/analyze")
async def analyze(payload: dict) -> dict:
    """Analyze plain text (e.g. clipboard / manual barcode content) with the
    extraction + compliance pipeline. No image / OCR involved."""
    text = (payload.get("text") or "").strip()
    if not text:
        return {"error": "text required"}
    from labelguard.ocr import OCRItem
    ocr_items = [
        OCRItem(text=text, bbox=(0, 0, 0, 0), confidence=1.0),
    ]
    fields = extractor.extract_fields(text, ocr_items, use_llm=True)
    fields_dict = extractor.fields_to_dict(fields)
    return _build_response([], fields_dict, {"scan_type": "qr", "barcode": text})


@app.get("/api/sample/{category}")
async def sample_label(category: str) -> Response:
    """Generate a realistic, category-specific sample product label (PNG) that
    carries a real QR code and the Legal Metrology fields. The frontend feeds
    this straight into /api/scan so Templates produce a genuine, real-time scan.
    """
    from sample_labels import build

    try:
        img = build(category)
    except Exception:  # noqa: BLE001 - fall back to the default category
        img = build("food")

    import io
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png",
                    headers={"Content-Disposition": f'inline; filename="{category}-sample.png"'})


@app.post("/api/report")
async def report(payload: dict) -> dict:
    """Have the local Ollama model write the compliance report text.

    The model receives the real scan result and returns clean, line-oriented
    plain text. We render it verbatim in the browser with automatic word-wrap,
    so layout (line breaks, where each value goes) is decided intelligently and
    long values never collide. Falls back to a built-in builder if offline.
    """
    from labelguard import llm, config

    scan = payload.get("scan") or {}
    compliance = scan.get("compliance") or {}
    product = scan.get("product") or {}
    checks = compliance.get("checks") or []

    checks_text = "\n".join(
        f"- [{c.get('status','?')}] {c.get('field','').replace('_',' ')}: "
        f"{c.get('value') or 'NOT FOUND'} (confidence {round((c.get('confidence') or 0)*100)}%)"
        f"{(' | ' + c.get('reason','')) if c.get('reason') else ''}"
        for c in checks
    )

    product_text = "\n".join(
        f"- {k.replace('_',' ').title()}: {v if v else 'Not detected'}"
        for k, v in product.items()
    )

    prompt = f"""You are the report writer for LabelGuard AI, a Legal Metrology label-compliance tool.

Write a clear, professional plain-text compliance report for the scanned product below.
Rules:
- Use ONLY the data provided. Never invent facts, values, or legal references.
- Keep every item on its own single line (no long paragraphs). Short, scannable lines only.
- Structure with these EXACT section headers on their own lines, in order:
  COMPLIANCE SUMMARY
  PRODUCT DETAILS
  COMPLIANCE CHECKS
- In COMPLIANCE SUMMARY state the score, the risk level, and one sentence on whether
  the label is compliant. If any check FAILED, explicitly state which law requirement
  is violated and what must be fixed. If any check is REVIEW, say a human must confirm it.
- In COMPLIANCE CHECKS, for each check write: "- [STATUS] Field name: value (confidence X%)"
  then on the next indented line write the reason, and if it FAILED add "  Violation: <what the law requires and what to fix>".
- Wrap long values such as addresses or manufacturer details at natural word boundaries
  so nothing overflows. Do NOT use markdown, astricks, or any special symbols.

SCORE: {compliance.get('score')}/100
RISK: {compliance.get('risk_level')}
NOTE: {compliance.get('note','')}

PRODUCT DETAILS DATA:
{product_text}

COMPLIANCE CHECKS DATA:
{checks_text}

Write the report now."""

    try:
        model = config.OLLAMA_EXPLAIN_MODEL  # currently qwen2.5:7b (local)
        text = llm.chat([{"role": "user", "content": prompt}], model=model)
        return {"text": text.strip(), "llm": True, "model": model}
    except Exception as e:  # noqa: BLE001
        # Offline / no model -> hand the frontend a clean local build instead.
        local = [
            "COMPLIANCE SUMMARY",
            f"Score: {compliance.get('score')}/100   |   Risk: {compliance.get('risk_level')}",
            compliance.get('note', ''),
            "",
            "PRODUCT DETAILS",
        ]
        for k, v in product.items():
            local.append(f"- {k.replace('_', ' ').title()}: {v if v else 'Not detected'}")
        local.append("")
        local.append("COMPLIANCE CHECKS")
        for c in checks:
            local.append(
                f"- [{c.get('status','?')}] {c.get('field','').replace('_',' ')}: "
                f"{c.get('value') or 'NOT FOUND'} (confidence {round((c.get('confidence') or 0)*100)}%)"
            )
            if c.get('reason'):
                local.append(f"    {c['reason']}")
            if c.get('status') == 'FAIL' and c.get('violation'):
                local.append(f"    Violation: {c['violation']}")
        return {"text": "\n".join(local), "llm": False}


# In-memory cache for the (slow, subprocess-based) evaluation report so page
# reloads are instant; only a manual refresh recomputes it.
_EVAL_CACHE: dict = {"report": None, "ts": None}


@app.get("/api/evaluate")
def api_evaluate(norules: bool = False, refresh: bool = False) -> dict:
    """Return the blind-sample accuracy evaluation report (per-field
    precision/recall/F1, where-accuracy-drops FP/FN breakdown, per-case).

    The evaluation re-runs PaddleOCR over the sample dataset, so it is executed
    in a SEPARATE subprocess (never inline inside the serving process, which
    already holds OCR model state) and within a worker thread (so this call
    never blocks the event loop / other endpoints).

    Results are cached: a plain GET returns the last computed report instantly.
    Pass ?refresh=true to force a fresh run (~30s+), or `norules=true` to use
    only the deterministic rule engine.
    """
    import subprocess

    if _EVAL_CACHE["report"] is not None and not refresh:
        return _EVAL_CACHE["report"]

    args = [sys.executable, "evaluate.py"]
    if norules:
        args.append("--norules")
    args.append("--json")

    proc = subprocess.run(
        args,
        cwd=Path(__file__).resolve().parent,
        capture_output=True,
        text=True,
        timeout=900,
        env={"PYTHONIOENCODING": "utf-8", **os.environ},
    )

    # PaddleOCR sometimes prints model-load chatter to stdout despite our
    # json.dumps being the intended final line; take the trailing JSON line.
    out = (proc.stdout or "").strip()
    lines = [ln for ln in out.splitlines() if ln.strip()]
    payload = lines[-1] if lines else ""
    try:
        report = json.loads(payload)
    except Exception:
        return {
            "error": "evaluation subprocess returned no JSON payload",
            "returncode": proc.returncode,
            "stderr": (proc.stderr or "")[-3000:],
            "stdout_tail": out[-3000:],
        }

    if "error" not in report:
        _EVAL_CACHE["report"] = report
        _EVAL_CACHE["ts"] = time.time()
    return report


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
