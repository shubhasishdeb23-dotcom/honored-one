"""Generate realistic, category-specific sample product labels (with a real QR
code) so the Templates flow can produce a genuine scan through the real OCR +
compliance pipeline without needing an external image."""

from __future__ import annotations

from PIL import Image, ImageDraw, ImageFont

W, H = 900, 1000

_PRODUCTS = {
    "food": {
        "color": (249, 115, 22),
        "header": "SUNRISE FOODS",
        "product": "CRUNCHY OAT COOKIES / 24 PACK",
        "manufacturer": "Made by: Sunrise Foods Pvt Ltd",
        "address": "Industrial Area Phase-II, Indore - 452010, Madhya Pradesh",
        "net_qty": "NET WT 500 g",
        "mrp": "MRP Rs. 120.00",
        "dates": [("Mfd: 06/2026", 28), ("Best Before: 9 months", 30)],
        "extra": [("Country of Origin: India", 26), ("FSSAI Lic. No. 10012042000456", 22)],
        "consumer_care": "Consumer Care: 1800-419-3200 / care@sunrise.in",
        "qr": "SUNRISE OAT COOKIES 500g MRP120 BBD 9m",
    },
    "beverage": {
        "color": (6, 182, 212),
        "header": "AQUAPURE BEVERAGES",
        "product": "MANGO PULP JUICE / 1 LTR",
        "manufacturer": "Bottled by: AquaPure Beverages Ltd",
        "address": "Plot 22, MIDC Kurkumbh, Pune - 412219, Maharashtra",
        "net_qty": "NET CONTENT 1 L",
        "mrp": "MRP Rs. 140.00",
        "dates": [("Mfd: 07/2026", 28), ("Best Before: 6 months", 30)],
        "extra": [("Country of Origin: India", 26), ("Add sugar and preservatives as per FSSAI", 20)],
        "consumer_care": "Consumer Care: 1800-425-1100 / help@aquapure.in",
        "qr": "AQUAPURE MANGO JUICE 1L MRP140 BBD 6m",
    },
    "cosmetic": {
        "color": (219, 39, 119),
        "header": "BLOOM NATURALS",
        "product": "HYDRATING LOTION 200 ml",
        "manufacturer": "Marketed by: Bloom Naturals Pvt Ltd",
        "address": "B-102, Udyog Vihar, Gurugram - 122016, Haryana",
        "net_qty": "NET QTY 200 ml",
        "mrp": "MRP Rs. 349.00",
        "dates": [("Mfg: 05/2026", 28), ("Best Before: 24 months from MFG", 26)],
        "extra": [("Country of Origin: India", 26), ("Batch No: BN-2605-0042", 24)],
        "consumer_care": "Consumer Care: 1800-266-7788 / care@bloomnaturals.in",
        "qr": "BLOOM LOTION 200ml MRP349 EXP 24m",
    },
    "pharma": {
        "color": (16, 185, 129),
        "header": "MEDICORP INDIA",
        "product": "PARACETAMOL 500 mg TABLETS",
        "manufacturer": "Mfd by: Medicorp Laboratories Ltd",
        "address": "Sector 18, Okhla Ind. Estate, New Delhi - 110020",
        "net_qty": "NET QTY 20 TABLETS",
        "mrp": "MRP Rs. 45.00",
        "dates": [("Mfg: 04/2026", 28), ("Exp: 03/2029", 30)],
        "extra": [("Country of Origin: India", 26), ("Batch: MCL-5920 | Schedule H", 22)],
        "consumer_care": "Consumer Care: 1800-200-4477 / info@medicorp.in",
        "qr": "MEDICORP PARACETAMOL 500mg x20 MRP45 EXP 03/2029",
    },
    "electronics": {
        "color": (139, 92, 246),
        "header": "VOLTECH APPLIANCES",
        "product": "BLUETOOTH SPEAKER 12W",
        "manufacturer": "Imported by: Voltech Appliances Pvt Ltd",
        "address": "90 Feet Road, Andheri East, Mumbai - 400069",
        "net_qty": "NET QTY 1 UNIT",
        "mrp": "MRP Rs. 1999.00",
        "dates": [("Mfg: 03/2026", 28), ("Warranty: 1 Year", 28)],
        "extra": [("Country of Origin: China", 26), ("Model: VT-SPK12", 24)],
        "consumer_care": "Consumer Care: 1800-212-3300 / support@voltech.in",
        "qr": "VOLTECH SPEAKER VT-SPK12 MRP1999 COO CHINA",
    },
    "custom": {
        "color": (107, 114, 128),
        "header": "GENERIC PACKAGED GOODS",
        "product": "PREMIUM PACKAGED PRODUCT",
        "manufacturer": "Made by: Sample Mfg. Company",
        "address": "123, Market Road, Bengaluru - 560001, Karnataka",
        "net_qty": "NET WT 250 g",
        "mrp": "MRP Rs. 99.00",
        "dates": [("Mfd: 05/2026", 28), ("Best Before: 12 months", 28)],
        "extra": [("Country of Origin: India", 26)],
        "consumer_care": "Consumer Care: 1800-999-0000 / care@sample.in",
        "qr": "SAMPLE PRODUCT 250g MRP99 BBD 12m",
    },
}


def _font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _build_qr(payload: str) -> Image.Image:
    import qrcode
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGBA")


def build(category: str = "food") -> Image.Image:
    data = _PRODUCTS.get(category, _PRODUCTS["food"])
    img = Image.new("RGB", (W, H), (252, 250, 246))
    d = ImageDraw.Draw(img)
    color = data["color"]

    d.rectangle([0, 0, W, 110], fill=color)
    d.text((60, 30), data["header"], fill="white", font=_font(46, bold=True))

    d.rectangle([0, 150, W, 232], fill=(240, 253, 250))
    d.text((50, 162), data["product"], fill=(20, 30, 40), font=_font(34, bold=True))

    d.text((50, 256), data["manufacturer"], fill=(30, 30, 30), font=_font(26))
    d.text((50, 296), data["address"], fill=(60, 60, 60), font=_font(22))

    d.rectangle([50, 350, 470, 402], outline=color, width=3)
    d.text((66, 356), data["net_qty"], fill=(20, 60, 80), font=_font(28, bold=True))

    d.rectangle([50, 420, 500, 476], outline=(245, 158, 11), width=3)
    d.text((66, 428), data["mrp"], fill=(180, 83, 9), font=_font(30, bold=True))
    d.text((66, 470), "INCLUSIVE OF ALL TAXES", fill=(160, 160, 160), font=_font(16))

    y = 356
    for line, size in data["dates"]:
        d.text((520, y), line, fill=(40, 40, 40), font=_font(size))
        y += size + 18

    y = 510
    for line, size in data["extra"]:
        d.text((50, y), line, fill=(40, 40, 40), font=_font(size))
        y += size + 14

    d.text((50, y + 8), data["consumer_care"], fill=(30, 30, 30), font=_font(24))

    # real QR code
    qr_img = _build_qr(data["qr"])
    qr_img = qr_img.resize((220, 220), Image.Resampling.NEAREST)
    img.paste(qr_img, (620, 600))

    d.rectangle([0, H - 70, W, H], fill=(10, 25, 25))
    d.text((40, H - 52), "Sample label for demo. Legal Metrology compliance demo.", fill=(255, 255, 255), font=_font(18))

    return img
