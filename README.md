# IEC motor frame selector

A static, responsive ABB frame selector for line-operated induction motors. Scope: **10–50 HP**, **2/4/6 poles**, **IE3/IE4**.

Source: the user-supplied **ABB IEC LV Motors, India Price List, FRSM69A, effective 1 September 2026**, pages **10–12 and 14–16**. Page 13 contains 8-pole motors and is excluded. The source PDF is not published in this repository.

## Use the tool

Enter HP, choose poles or the equivalent 50 Hz synchronous speed, select IE3, IE4 or both, and select **Find frame**. The result includes the ABB frame designation, complete motor type, paired catalogue kW, catalogue INR list price, source page and available ABB document links. Unsupported HP values show nearby catalogue ratings without automatic rounding or interpolation.

The supported HP values are 10, 12.5, 15, 20, 25, 30, 40 and 50. The catalogue contains **50 rows** for the 48 rating/class/pole combinations because IE3 has alternate types at 12.5 HP for 2 and 4 poles. The IE3 12.5 HP / 4-pole M2BAX132SMB4 entry retains the catalogue’s Class F temperature-rise restriction.

Frame designations such as `160ML` are derived from ABB motor types by removing the series prefix, winding variant letter and pole digit. They retain ABB's notation; they do not establish dimensional interchangeability. The complete type remains visible. Confirm mounting and shaft dimensions using the GA drawing. Running speed is lower than synchronous speed; the supplied tables do not specify rated loaded RPM.

The source configuration is 415 V ±10%, 50 Hz ±5%, horizontal foot mounting, TEFC, IP55, continuous duty, Class F insulation, 50°C ambient and altitude below 1000 m above mean sea level. The catalogue states IEC 60034-1 and IS 12615:2018. Document URLs are extracted from PDF annotations; missing links are omitted rather than invented. Remote ABB document availability has not been verified.

## Run locally

Node.js 22 or newer, with no external npm dependencies:

```sh
npm start
```

Open `http://127.0.0.1:4173`. The server serves only the copied website assets in `public/`, not the repository or source documents. JavaScript modules and JSON loading require HTTP; do not open `index.html` using `file://`.

```sh
npm test
npm run build
```

## Publish to GitHub Pages

Suggested repository: `anurag-eeiitd/iec-motor-frame-selector`.

1. Create that repository and push this project's source files to its `main` or `master` branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Run the **Deploy GitHub Pages** workflow, or push a change to trigger it.
4. The expected URL after successful deployment is `https://anurag-eeiitd.github.io/iec-motor-frame-selector/`.

The workflow checks the selector, prepares only the website assets, and deploys them. All asset paths are relative so project subpaths work. `public/` is generated and ignored. No account credentials or backend are needed by the website.

## Maintain catalogue data

The auditable data lives in `data/abb-frsm69a.json`. Each row records the source page and original document links. To reproduce extraction, install `pypdf` and `pdfplumber`, then run:

```sh
python scripts/extract_catalogue.py "path/to/FRSM 69A w.e.f. 01.09.2026.pdf"
```

Review any replacement catalogue visually before changing the data. Tests independently check all 50 motor codes against the six supplied screenshots, scope, paired kW values, page references, alternate entries, the special footnote, invalid inputs and non-interpolation.

This is an independent selection aid, not an ABB product. ABB catalogue content remains attributable to ABB. Only ABB is included in this initial version.
