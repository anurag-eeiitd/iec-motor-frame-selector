# IEC motor frame and price selector

A responsive tool for line-operated induction motors: **10–50 HP**, **2/4/6 poles**, **IE3/IE4**. Select ABB, Innomotics or Crompton / CG individually, or compare all three. Select one efficiency class or compare both.

Live tool: https://anurag-eeiitd.github.io/iec-motor-frame-selector/

## Results and scope

Results show the normalized IEC frame from the supplied comparison, exact manufacturer frame, full ordering / catalogue reference, paired HP/kW, INR catalogue list price, product family, source page and ordering restrictions. All alternatives are retained. ABB document links remain available where present in the supplied PDF.

Prices are catalogue list prices, before discounts and applicable taxes. They are not quotations. Frame comparison does not establish dimensional interchangeability: check mounting, shaft dimensions and application conditions with each manufacturer. Speeds are synchronous speeds at 50 Hz, not loaded running speeds.

Supported HP ratings: 10, 12.5, 15, 20, 25, 30, 40 and 50. Exact ratings only, with no interpolation or automatic rounding. The data contains **143 listed motors** and **4 explicit unavailable Innomotics combinations**. A missing listing refers to the selected family, not every motor sold by the company.

## Sources

The user-supplied ABB_Innomotics_CG_IE3_IE4_10-50HP_Comparison.xlsx, Source Details sheet, supplies the comparison records. The source workbook and PDFs are not published. Derived records include source sheet and row references.

| Manufacturer | Selected family | Catalogue |
| --- | --- | --- |
| ABB | M2BAX Safe Area | FRSM69A, effective 1 September 2026; IE3 pp. 10–12, IE4 pp. 14–16 |
| Innomotics | 1LE7 Severe Duty, cast iron | LP-210, effective 14 August 2026; IE3 CE-compliant pp. 18–19, IE4 pp. 15–16 |
| Crompton / CG | Premium Efficiency IE3 Cast Iron; Super Premium IE4 | LTM27, effective 2 September 2026; printed pp. 15 and 14 |

CG 10 HP IE4 2- and 4-pole entries use AXELERA Process Performance on printed p. 13, as directed by the Super Premium table. CG PDF page numbers are one higher than printed page numbers. Starred special-order entries retain the catalogue's Indent note. ABB's smaller 12.5 HP / 4-pole IE3 option retains its Class F temperature-rise restriction.

The selected families cover foot-mounted, IP55, continuous / S1, 415 V, 50 Hz, 50°C ambient motors. Construction and ordering details differ between families. Innomotics and CG ordering codes and prices were verified against the supplied PDF pages. Original ABB records, prices, document URLs and restrictions were reconciled with the workbook. Remote document availability has not been verified.

## Run locally

Node.js 22 or newer. No external npm dependencies are required by the app.

```sh
npm start
```

Open http://127.0.0.1:4173. The server serves only site assets copied to public/. HTTP is required for JavaScript modules and JSON loading.

```sh
npm test
npm run build
```

The GitHub Actions workflow runs tests, builds static assets and deploys to GitHub Pages on pushes to main or master. Pages uses GitHub Actions as its publishing source. All asset paths are relative for repository subpaths.

## Maintain data

The current comparison is in data/motor-catalogues.json. The original ABB extraction and document links remain in data/abb-frsm69a.json.

To reproduce the import, install Python openpyxl, pypdf and pdfplumber. From the project root:

```sh
python scripts/import_comparison.py "path/to/ABB_Innomotics_CG_IE3_IE4_10-50HP_Comparison.xlsx" --pdf-dir "path/to/catalogue-folder"
```

The importer reads but does not change the workbook, reconciles ABB values and links, and optionally checks listed Innomotics/CG codes and prices against the supplied PDFs. Review source pages before publishing a new catalogue edition.

Tests check all 144 manufacturer/rating/pole/efficiency combinations, prices, original ABB codes and links, alternatives, special-order entries, missing ratings and invalid inputs.

This is an independent selection aid. Manufacturer catalogue content remains attributable to its respective manufacturer.
