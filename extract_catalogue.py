"""Extract only the requested ABB rows; requires pypdf and pdfplumber."""
import argparse
import json
import re
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

PAGE_SCOPE = {10: ("IE3", 2), 11: ("IE3", 4), 12: ("IE3", 6),
              14: ("IE4", 2), 15: ("IE4", 4), 16: ("IE4", 6)}
ROW = re.compile(r"^(\d+\.\d+)(\S*)\s+(\d+\.\d+)\s+(M2BAX\w+)\s+([\d,]+)$")


def extract(source):
    reader = PdfReader(source)
    entries = []
    with pdfplumber.open(source) as pdf:
        for page_number, (efficiency, poles) in PAGE_SCOPE.items():
            page = reader.pages[page_number - 1]
            words = pdf.pages[page_number - 1].extract_words()
            links = []
            for annotation in page.get("/Annots", []):
                annotation = annotation.get_object()
                uri = annotation.get("/A", {}).get("/URI")
                rect = annotation.get("/Rect")
                if uri and rect and str(uri).startswith("https://search.abb.com/"):
                    links.append({"x": (float(rect[0]) + float(rect[2])) / 2,
                                  "y": (float(rect[1]) + float(rect[3])) / 2,
                                  "url": str(uri)})
            for line in page.extract_text().splitlines():
                match = ROW.match(line.strip())
                if not match:
                    continue
                kw, marker, hp, model, price = match.groups()
                if not 10 <= float(hp) <= 50:
                    continue
                model_word = next(w for w in words if w["text"] == model)
                y = float(page.mediabox.height) - (model_word["top"] + model_word["bottom"]) / 2
                row_links = [link for link in links if abs(link["y"] - y) < 7]
                documents = {}
                for key, left, right in [("datasheet", 380, 430), ("drawing", 430, 490),
                                         ("terminalBox", 490, 540)]:
                    candidates = [link for link in row_links if left <= link["x"] < right]
                    if candidates:
                        documents[key] = min(candidates, key=lambda link: abs(link["y"] - y))["url"]
                designation = re.fullmatch(r"M2BAX(\d+[A-Z]+?)[A-Z][246]", model).group(1)
                entries.append({"manufacturer": "ABB", "series": "M2BAX", "efficiency": efficiency,
                                "poles": poles, "hp": float(hp), "kw": float(kw), "model": model,
                                "frame": designation, "priceInr": int(price.replace(",", "")),
                                "sourcePage": page_number,
                                "notes": ["Suitable for Class F temperature rise only (catalogue * footnote)."] if "*" in marker else [],
                                "documents": documents})
    assert len(entries) == 50, f"Expected 50 entries, extracted {len(entries)}"
    return {"source": {"title": "ABB IEC LV Motors, India Price List", "edition": "FRSM69A",
                       "effectiveDate": "2026-09-01", "pages": list(PAGE_SCOPE),
                       "scope": "10–50 HP; 2, 4 and 6 poles; IE3 and IE4"}, "motors": entries}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("--output", default="data/abb-frsm69a.json")
    args = parser.parse_args()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(extract(args.source), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Extracted 50 catalogue entries to {output}")
