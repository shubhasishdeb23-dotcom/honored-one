"""Blind-sample accuracy evaluation for the LabelGuard OCR + compliance
pipeline (reuses the real functions from app.py, not a mock).

Two kinds of ground-truth cases are evaluated:

1. IMAGE cases   - rendered sample labels (food, beverage, cosmetic, pharma,
                   electronics, custom) whose expected field values and
                   compliance outcome are known (all are fully compliant).
2. TEXT cases    - hand-written OCR transcripts containing deliberate
                   compliance VIOLATIONS (a mandatory declaration missing),
                   used to measure the pipeline's ability to DETECT
                   missing / non-compliant declarations.

The report computes, per field, precision / recall / F1 over the labelled
extraction and an overall compliance-detection accuracy.

Run standalone:
    python -m uvicorn --help   (n/a)
    python evaluate.py          (prints the report)

Or import and call run_evaluation().
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent

_APP = None  # injected pipeline module (real backend app.py)


def set_app(app_mod):
    """Inject the backend app module whose functions we run the real pipeline
    with. Called either by __main__ (loads backend/app.py by path) or by the
    FastAPI /api/evaluate endpoint (passes the already-running app module)."""
    global _APP
    _APP = app_mod


def _ocr_lines(*a, **k):
    return _APP._ocr_lines(*a, **k)


def _extract_fields(*a, **k):
    return _APP._extract_fields(*a, **k)


def _compliance(*a, **k):
    return _APP._compliance(*a, **k)


def _extract_with_extra_text(*a, **k):
    return _APP._extract_with_extra_text(*a, **k)


sys.path.insert(0, str(BACKEND_DIR.parent))
sys.path.insert(0, r"C:\Users\Lenovo\Downloads\labelguard-app")
import sample_labels  # noqa: E402

FIELDS = [
    "product_name", "manufacturer", "manufacturer_address", "net_quantity",
    "mrp", "country_of_origin", "manufacturing_date", "best_before",
    "consumer_care", "unit_sale_price",
]

# ---------------------------------------------------------------------------
# Ground truth derived from the sample-label generator (all fully compliant)
# ---------------------------------------------------------------------------

def _gt_from_products(spec: dict) -> dict:
    """Map a sample_labels._PRODUCTS spec onto the 10 legal-metrology fields."""
    mrp = re.sub(r"[^0-9.]", "", spec["mrp"])
    return {
        "product_name": spec["product"],
        "manufacturer": spec["manufacturer"].split(":", 1)[-1].strip(),
        "manufacturer_address": spec["address"],
        "net_quantity": spec["net_qty"].split(":", 1)[-1].strip(),
        "mrp": mrp,
        "country_of_origin": "India",
        "manufacturing_date": spec["dates"][0][0].split(":", 1)[-1].strip(),
        "best_before": spec["dates"][1][0].split(":", 1)[-1].strip(),
        "consumer_care": spec["consumer_care"].split(":", 1)[-1].strip(),
        "unit_sale_price": None,  # not printed on the sample labels
    }


IMAGE_CASES = []
for cat in ["food", "beverage", "cosmetic", "pharma", "electronics", "custom"]:
    spec = sample_labels._PRODUCTS[cat]
    IMAGE_CASES.append({
        "id": f"img-{cat}",
        "kind": "image",
        "category": cat,
        "expected": _gt_from_products(spec),
        "expected_compliance": "PASS",
    })

# ---------------------------------------------------------------------------
# Hand-written non-compliant OCR cases to test missing-declaration detection
# ---------------------------------------------------------------------------

def _txt(pid: str, name: str, body: str, missing: list[str]) -> dict:
    expected = {
        "product_name": name.split(",", 1)[0].strip(),
        "manufacturer": name.split(",", 1)[-1].strip(),
        "manufacturer_address": "Nagar Road, Pune - 411001, Maharashtra",
        "net_quantity": "500 g",
        "mrp": "120",
        "country_of_origin": "India",
        "manufacturing_date": "08/2026",
        "best_before": "6 months",
        "consumer_care": "1800-123-4567",
        "unit_sale_price": None,
    }
    for f in missing:
        expected[f] = None
    return {
        "id": pid,
        "kind": "text",
        "text": body,
        "expected": expected,
        # overall expected compliance: non-compliant iff any field missing
        "expected_compliance": "FAIL" if missing else "PASS",
        "expected_missing": missing,
    }


TEXT_CASES = [
    _txt("txt-compliant",
         "Crispy Corn Flakes, Healthy Foods Pvt Ltd, Nagar Road, Pune - 411001, Maharashtra",
         "CRISPY CORN FLAKES Made by: Healthy Foods Pvt Ltd, Nagar Road, Pune - 411001, "
         "Maharashtra NET WT 500 g MRP Rs. 120.00 Mfd: 08/2026 Best Before: 6 months "
         "Country of Origin: India Consumer Care: 1800-123-4567",
         missing=[]),
    _txt("txt-missing-mrp",
         "Crispy Corn Flakes, Healthy Foods Pvt Ltd, Nagar Road, Pune - 411001, Maharashtra",
         "CRISPY CORN FLAKES Made by: Healthy Foods Pvt Ltd, Nagar Road, Pune - 411001, "
         "Maharashtra NET WT 500 g Mfd: 08/2026 Best Before: 6 months "
         "Country of Origin: India Consumer Care: 1800-123-4567",
         missing=["mrp"]),
    _txt("txt-missing-care",
         "Crispy Corn Flakes, Healthy Foods Pvt Ltd, Nagar Road, Pune - 411001, Maharashtra",
         "CRISPY CORN FLAKES Made by: Healthy Foods Pvt Ltd, Nagar Road, Pune - 411001, "
         "Maharashtra NET WT 500 g MRP Rs. 120.00 Mfd: 08/2026 Best Before: 6 months "
         "Country of Origin: India",
         missing=["consumer_care"]),
    _txt("txt-missing-netqty",
         "Crispy Corn Flakes, Healthy Foods Pvt Ltd, Nagar Road, Pune - 411001, Maharashtra",
         "CRISPY CORN FLAKES Made by: Healthy Foods Pvt Ltd, Nagar Road, Pune - 411001, "
         "Maharashtra MRP Rs. 120.00 Mfd: 08/2026 Best Before: 6 months "
         "Country of Origin: India Consumer Care: 1800-123-4567",
         missing=["net_quantity"]),
]

ALL_CASES = IMAGE_CASES + TEXT_CASES


def run_case(case: dict, use_llm: bool = True) -> dict:
    """Run the real app pipeline for an image or text case and return the
    extracted fields_dict + compliance dict."""
    if case["kind"] == "image":
        img = sample_labels.build(case["category"])
        img_bgr = _APP.np.array(img)[:, :, ::-1].copy()  # PIL RGB -> BGR array
        items = _ocr_lines(img_bgr)
        fields_dict, _joined = _extract_fields(items)
    else:
        # Text case: feed the transcript straight into the extractor.
        fields_dict, _joined = _extract_with_extra_text([], case["text"])
    compliance = _compliance(fields_dict)
    return {
        "case": case["id"],
        "kind": case["kind"],
        "fields": fields_dict,
        "compliance": compliance,
        "checks": {c["field"]: c["status"] for c in compliance["checks"]},
        "score": compliance["score"],
        "risk": compliance["risk_level"],
    }


# ---------------------------------------------------------------------------
# Tolerant value matching
# ---------------------------------------------------------------------------

def _norm(v: str) -> str:
    if v is None:
        return ""
    v = v.lower().replace("₹", "rs ").replace("mrp rs", "mrp")
    v = re.sub(r"[^a-z0-9]", " ", v)
    return re.sub(r"\s+", " ", v).strip()


def _is_number_pair(a: str, b: str) -> bool:
    try:
        return abs(float(re.sub(r"[^0-9.]", "", a)) - float(re.sub(r"[^0-9.]", "", b))) < 0.01
    except Exception:
        return False


def values_match(pred, truth) -> bool:
    if truth is None:
        return not pred  # neither should be present
    if not pred:
        return False
    p, t = _norm(str(pred)), _norm(str(truth))
    if not p or not t:
        return False
    if p == t:
        return True
    if _is_number_pair(str(pred), str(truth)):
        return True
    # containment both ways (handles OCR truncation / trailing bits)
    return p in t or t in p


def _field_statuses(fields_dict: dict) -> dict:
    return {f: bool((fields_dict.get(f) or {}).get("value")) for f in FIELDS}


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def _summary(name: str, tp: int, fp: int, fn: int, tn: int,
             kind: str = "extraction") -> dict:
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    accuracy = (tp + tn) / (tp + fp + fn + tn) if (tp + fp + fn + tn) else 0.0
    return {
        "name": name,
        "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
        "accuracy": round(accuracy, 3),
        "samples": tp + fp + fn + tn,
    }


def run_evaluation(use_llm: bool = True) -> dict:
    results = [run_case(c, use_llm) for c in ALL_CASES]

    # --- per-field extraction metrics (value present/absent) ---
    field_conf = {f: {"tp": 0, "fp": 0, "fn": 0, "tn": 0} for f in FIELDS}
    # field_breakdown: field -> {"TP":[ids], "FP":[ids], "FN":[ids], "TN":[ids]}
    field_breakdown = {f: {"TP": [], "FP": [], "FN": [], "TN": []} for f in FIELDS}
    per_case = []
    for case, res in zip(ALL_CASES, results):
        truth_present = {f: bool(v is not None) for f, v in case["expected"].items()}
        pred_present = _field_statuses(res["fields"])
        entry = {"id": res["case"], "kind": res["kind"],
                 "predicted": {}, "truth": {}, "field_results": {}}
        for f in FIELDS:
            pred = res["fields"].get(f, {}).get("value")
            truth = case["expected"].get(f)
            correct = values_match(pred, truth)
            entry["predicted"][f] = bool(pred)
            entry["truth"][f] = truth is not None
            if pred is not None and truth is not None and correct:
                outcome = "TP"
            elif pred is not None and truth is None:
                outcome = "FP"
            elif pred is None and truth is not None:
                outcome = "FN"
            else:
                outcome = "TN"
            field_conf[f][outcome.lower()] += 1
            field_breakdown[f][outcome].append(res["case"])
            entry["field_results"][f] = outcome
        per_case.append(entry)

    # --- compliance detection ---
    # Two views:
    #  - "fail"     : only a definite determination that a mandatory
    #                 declaration is missing (FAIL). Measures detection of
    #                 actual violations.
    #  - "flags"    : any FAIL or REVIEW (human must check). Higher-sensitivity.
    comp = {
        "fail": {"tp": 0, "fp": 0, "fn": 0, "tn": 0},
        "flags": {"tp": 0, "fp": 0, "fn": 0, "tn": 0},
    }
    for i, (case, res) in enumerate(zip(ALL_CASES, results)):
        expected_missing = set(case.get("expected_missing", []))
        flagged_fields = [f for f, s in res["checks"].items() if s in ("FAIL", "REVIEW")]
        for key, pred_is_viol in (("fail", lambda s: s == "FAIL"),
                                   ("flags", lambda s: s in ("FAIL", "REVIEW"))):
            for f, status in res["checks"].items():
                truth_viol = f in expected_missing
                pred_viol = pred_is_viol(status)
                if truth_viol and pred_viol:
                    comp[key]["tp"] += 1
                elif truth_viol and not pred_viol:
                    comp[key]["fn"] += 1
                elif not truth_viol and pred_viol:
                    comp[key]["fp"] += 1
                else:
                    comp[key]["tn"] += 1
        # attach per-case detail for transparency
        entry = per_case[i]
        entry["flagged"] = flagged_fields
        entry["expected_missing"] = list(expected_missing)
        entry["compliance"] = res["compliance"]

    overall_tp = sum(field_conf[f]["tp"] for f in FIELDS)
    overall_fp = sum(field_conf[f]["fp"] for f in FIELDS)
    overall_fn = sum(field_conf[f]["fn"] for f in FIELDS)
    overall_tn = sum(field_conf[f]["tn"] for f in FIELDS)

    return {
        "dataset": {
            "image_cases": [c["id"] for c in IMAGE_CASES],
            "text_cases": [c["id"] for c in TEXT_CASES],
            "total_cases": len(ALL_CASES),
            "llm_mode": "on" if use_llm else "off",
        },
        "per_field": [_summary(f, **field_conf[f]) for f in FIELDS],
        "field_breakdown": field_breakdown,
        "overall_extraction": _summary("overall", overall_tp, overall_fp,
                                        overall_fn, overall_tn),
        "compliance_fail": _summary("compliance(FAIL)", **comp["fail"]),
        "compliance_flags": _summary("compliance(ANY-FLAG)", **comp["flags"]),
        "per_case": per_case,
        "scores": [
            {"id": r["case"], "score": r["score"], "risk": r["risk"],
             "kind": r["kind"]}
            for r in results
        ],
    }


def _print_report(report: dict) -> None:
    print("\n=== LABELGUARD ACCURACY REPORT ===\n")
    print(f"Dataset: {report['dataset']['total_cases']} cases "
          f"({len(report['dataset']['image_cases'])} image, "
          f"{len(report['dataset']['text_cases'])} text) | LLM mode: "
          f"{report['dataset']['llm_mode']}\n")
    print(f"{'Field':<22}{'Prec':>7}{'Rec':>7}{'F1':>7}{'Acc':>7}  TP FP FN TN")
    for f in report["per_field"]:
        print(f"{f['name']:<22}{f['precision']:>7.2f}{f['recall']:>7.2f}{f['f1']:>7.2f}"
              f"{f['accuracy']:>7.2f}  {f['tp']:>2} {f['fp']:>2} {f['fn']:>2} {f['tn']:>2}")
    o = report["overall_extraction"]
    print(f"\nOVERALL EXTRACTION  prec={o['precision']:.3f} rec={o['recall']:.3f} "
          f"F1={o['f1']:.3f} acc={o['accuracy']:.3f}")
    for key, label in (("compliance_fail", "VIOLATION DETECTION (FAIL)"),
                       ("compliance_flags", "ANY FLAG (FAIL or REVIEW)")):
        c = report[key]
        print(f"{label:<31} prec={c['precision']:.3f} rec={c['recall']:.3f} "
              f"F1={c['f1']:.3f} acc={c['accuracy']:.3f}  "
              f"(TP {c['tp']} FP {c['fp']} FN {c['fn']} TN {c['tn']})")
    print("\nScores + flagged fields per case:")
    for s in report["scores"]:
        print(f"  [{s['kind']:<5}] {s['id']:<20} score={s['score']} risk={s['risk']}")
    print("\nFlagged fields per case (fields the engine marked FAIL/REVIEW):")
    for pc in report["per_case"]:
        flagged = pc["flagged"] or []
        missing = pc["expected_missing"] or []
        mark = "OK" if not flagged else "~"
        print(f"  [{pc['kind']:<5}] {pc['id']:<20} {mark} flagged={flagged} "
              f"expected_missing={missing}")


if __name__ == "__main__":
    import importlib.util

    argv = sys.argv[1:]
    as_json = "--json" in argv
    use_llm = "norules" not in argv and "--norules" not in argv

    _spec = importlib.util.spec_from_file_location("_lg_backend_app", str(BACKEND_DIR / "app.py"))
    _m = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_m)
    set_app(_m)
    report = run_evaluation(use_llm=use_llm)
    if as_json:
        # Strip non-JSON model-load chatter by writing to stderr only; print
        # nothing else. Emit the report as the sole stdout line.
        import json as _json
        print(_json.dumps(report, ensure_ascii=False, default=str))
    else:
        _print_report(report)
