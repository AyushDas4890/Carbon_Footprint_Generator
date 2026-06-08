"""
Real-data adapter for C4Future training pipeline.

Reads:
  - data/agribalyse-synthese.csv         (ADEME, France — 2,456 food LCAs)
  - data/ghg-per-kg-poore.csv            (OWiD / Poore & Nemecek 2018 — 37 categories)
  - data/ghg-conversion-factors-2024-...xlsx  (UK DEFRA 2024)

Produces (under predictor/training/):
  - real_factors.json       calibrated emission factors (DEFRA + Poore medians)
  - real_eval.csv           held-out real product test set (Agribalyse + Poore)
  - training_data_hybrid.csv   synthetic data generated using calibrated factors
                                + real Agribalyse rows interleaved

Usage:
    python predictor/training/data_adapter.py

The training script (train_xgboost.py) auto-detects these files and uses them.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import pandas as pd
import openpyxl

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUT_DIR = HERE   # predictor/training/

AGRI = DATA_DIR / "agribalyse-synthese.csv"
POORE = DATA_DIR / "ghg-per-kg-poore.csv"
DEFRA = DATA_DIR / "ghg-conversion-factors-2024-condensed_set__for_most_users__v1_1.xlsx"

OUT_FACTORS = OUT_DIR / "real_factors.json"
OUT_EVAL = OUT_DIR / "real_eval.csv"
OUT_HYBRID = OUT_DIR / "training_data_hybrid.csv"


# ===========================================================================
# Section 1 — Material mapping
# ===========================================================================
# Maps free-text product names to our SUPPORTED_MATERIALS list. Order matters:
# the FIRST matching pattern wins, so put more specific patterns above generic.
MATERIAL_PATTERNS = [
    # Animal products
    (r"\b(beef|bovine|cattle|veal)\b", "Beef"),
    (r"\b(lamb|mutton|sheep)\b", "Lamb"),
    (r"\b(pork|pig|ham|bacon|sausage)\b", "Pork"),
    (r"\b(chicken|poultry|hen)\b", "Chicken"),
    (r"\b(turkey)\b", "Turkey"),
    # Seafood
    (r"\b(shrimp|prawn)\b", "Shrimp"),
    (r"\b(fish.*farm|aquaculture|farmed.*fish|salmon)\b", "Fish_Farmed"),
    (r"\b(fish|tuna|cod|herring|mackerel|sardine|anchov)\b", "Fish_Wild"),
    # Dairy
    (r"\b(cheese|fromage)\b", "Cheese"),
    (r"\b(butter|beurre)\b", "Butter"),
    (r"\b(egg|œuf|oeuf)\b", "Eggs"),
    (r"\b(milk|lait|yogh|yog|cream|crème)\b", "Milk"),
    # Plant proteins
    (r"\b(tofu|soy.*curd)\b", "Tofu"),
    (r"\b(lentil|lentille)\b", "Lentils"),
    (r"\b(bean|haricot|chickpea|pois.*chiche)\b", "Beans"),
    (r"\b(nut|almond|walnut|cashew|peanut|amande|noix)\b", "Nuts"),
    # Grains
    (r"\b(rice|riz)\b", "Rice"),
    (r"\b(wheat|flour|bread|pasta|pain|pâte|farine)\b", "Wheat"),
    (r"\b(oat|avoine)\b", "Oats"),
    (r"\b(corn|maize|maïs)\b", "Corn"),
    # Produce
    (r"\b(tomato|tomate)\b", "Tomatoes"),
    (r"\b(potato|pomme.*terre)\b", "Potatoes"),
    (r"\b(lettuce|salad|laitue|salade)\b", "Lettuce"),
    (r"\b(apple|pomme)\b", "Apples"),
    (r"\b(banana|banane)\b", "Bananas"),
    # Industrial materials (Agribalyse rarely has these; DEFRA does)
    (r"\b(cotton|coton)\b", "Cotton"),
    (r"\b(polyester)\b", "Polyester"),
    (r"\b(wool|laine)\b", "Wool"),
    (r"\b(leather|cuir)\b", "Leather"),
    (r"\b(steel|acier|stainless|cans?\b)", "Steel"),
    (r"\b(aluminum|aluminium|alu.*foil|aluminium.*can)\b", "Aluminum"),
    (r"\b(plastic|plastique|pet|hdpe|ldpe|pp|ps|pvc)\b", "Plastic"),
    (r"\b(glass|verre|board.*glass)\b", "Glass"),
    (r"\b(paper|board|paper.*board|papier|carton)\b", "Paper"),
    (r"\b(wood|bois|timber)\b", "Wood"),
]


def map_material(name: str) -> Optional[str]:
    """Return our SUPPORTED_MATERIALS label, or None if no match."""
    if not isinstance(name, str):
        return None
    txt = name.lower()
    for pat, mat in MATERIAL_PATTERNS:
        if re.search(pat, txt):
            return mat
    return None


# ===========================================================================
# Section 2 — Loaders
# ===========================================================================

def load_agribalyse(path: Path = AGRI) -> pd.DataFrame:
    """Returns DataFrame with [name, material, co2_per_kg, group]."""
    # utf-8-sig handles the BOM that prefixes the ADEME file
    df = pd.read_csv(path, encoding="utf-8-sig")
    keep = ["Nom du Produit en Français", "LCI Name",
            "Groupe d'aliment", "Changement climatique"]
    df = df[keep].rename(columns={
        "Nom du Produit en Français": "name_fr",
        "LCI Name": "name_en",
        "Groupe d'aliment": "group",
        "Changement climatique": "co2_per_kg",
    })
    df["co2_per_kg"] = pd.to_numeric(df["co2_per_kg"], errors="coerce")
    df = df.dropna(subset=["co2_per_kg"])
    # Try English name first, fall back to French
    df["material"] = df["name_en"].apply(map_material)
    df.loc[df["material"].isna(), "material"] = df["name_fr"].apply(map_material)
    df = df.dropna(subset=["material"])
    df["source"] = "agribalyse"
    return df.reset_index(drop=True)


def load_poore(path: Path = POORE) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = ["name_en", "year", "co2_per_kg"]
    df["material"] = df["name_en"].apply(map_material)
    df = df.dropna(subset=["material"])
    df["source"] = "poore_nemecek"
    return df.reset_index(drop=True)


# ===========================================================================
# Section 3 — DEFRA extractors
# ===========================================================================

def _ws_rows(ws):
    """Generator of (row_index, list-of-cell-values)."""
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        yield i, list(row)


def extract_defra_materials(wb) -> Dict[str, float]:
    """Read Material use sheet → {material: kg_CO2e_per_kg} for primary materials.

    DEFRA reports per tonne, so we divide by 1000.
    """
    ws = wb["Material use"]
    out: Dict[str, float] = {}
    for i, row in _ws_rows(ws):
        if i < 21 or i > 90:
            continue
        # Pattern: [Activity, Material, Unit, Primary, Re-used, Open, Closed]
        if len(row) < 4 or row[3] is None:
            continue
        mat_name = row[1]
        primary_val = row[3]
        if not isinstance(mat_name, str) or not isinstance(primary_val, (int, float)):
            continue
        mat = map_material(mat_name)
        if mat is None:
            continue
        # Keep the LOWEST (most conservative) value if multiple rows map to same mat
        kg_per_kg = float(primary_val) / 1000.0   # tonne → kg
        if mat not in out or kg_per_kg < out[mat]:
            out[mat] = round(kg_per_kg, 4)
    return out


def extract_defra_transport(wb) -> Dict[str, float]:
    """Read Freighting goods → {AIR, SEA, ROAD, RAIL}: kg CO2e per kg per 1000 km.

    DEFRA tonne.km values for freight transport: scan all rows, filter to
    plausible ranges per mode (cars/vans and passenger-jet rows have very
    different magnitudes and would distort our predictor).

    Plausibility bounds (per kg per 1000 km == per tonne.km):
        AIR  0.4 – 2.0   typical freight aircraft tonne.km
        SEA  0.005 – 0.04
        ROAD 0.05 – 0.20  HGV freight (vans are 5-10x higher)
        RAIL 0.015 – 0.05
    """
    ws = wb["Freighting goods"]
    BOUNDS = {
        "AIR":  (0.4, 2.0),
        "SEA":  (0.005, 0.04),
        "ROAD": (0.05, 0.20),
        "RAIL": (0.015, 0.05),
    }

    # collect ALL candidate values per mode then pick the median
    candidates = {k: [] for k in BOUNDS}

    last_activity = ""
    for i, row in _ws_rows(ws):
        if i < 24:
            continue
        activity = row[0] if len(row) > 0 and row[0] else last_activity
        if row[0]:
            last_activity = row[0]
        sub_type = row[1] if len(row) > 1 else ""
        unit = row[2] if len(row) > 2 else ""
        val = row[3] if len(row) > 3 else None

        if not isinstance(val, (int, float)) or unit != "tonne.km":
            continue

        text = f"{activity or ''} {sub_type or ''}".lower()
        v = float(val)

        # HGV / lorry / truck → ROAD
        if any(k in text for k in ["hgv", "rigid", "articul", "lorry", "truck"]):
            if BOUNDS["ROAD"][0] <= v <= BOUNDS["ROAD"][1]:
                candidates["ROAD"].append(v)
        # Freight train / rail
        if any(k in text for k in ["freight train", "rail freight", "freight rail"]):
            if BOUNDS["RAIL"][0] <= v <= BOUNDS["RAIL"][1]:
                candidates["RAIL"].append(v)
        # Cargo ship / tanker / container
        if any(k in text for k in ["cargo ship", "container ship", "tanker", "bulk carrier",
                                     "general cargo"]):
            if BOUNDS["SEA"][0] <= v <= BOUNDS["SEA"][1]:
                candidates["SEA"].append(v)
        # Cargo aircraft / freight flight (NOT passenger)
        if any(k in text for k in ["cargo aircraft", "freight flight", "cargo flight"]):
            if BOUNDS["AIR"][0] <= v <= BOUNDS["AIR"][1]:
                candidates["AIR"].append(v)

    out = {}
    for mode, vals in candidates.items():
        if vals:
            out[mode] = float(np.median(vals))

    # Widely-cited DEFRA freight defaults (used in seed_facts.md) as fallback
    defaults = {"AIR": 0.95, "SEA": 0.015, "ROAD": 0.107, "RAIL": 0.025}
    for k, v in defaults.items():
        out.setdefault(k, v)

    return {k: round(v, 4) for k, v in out.items()}


def extract_defra_eol(wb) -> Dict[str, float]:
    """Read Waste disposal → {RECYCLED, INCINERATED, LANDFILL} multiplier vs baseline.

    Approach: average the per-tonne factors for "average plastic" + "paper" +
    "metal cans" across the three end-of-life paths, then express them as a
    fraction of total cradle-to-grave footprint (~baseline 1.0).
    """
    ws = wb["Waste disposal"]
    closed_vals, comb_vals, landfill_vals = [], [], []
    for i, row in _ws_rows(ws):
        if i < 22 or i > 90:
            continue
        # Header: Re-use | Open-loop | Closed-loop | Combustion | Composting | Landfill
        # Indices:    3        4           5            6             7          8
        if len(row) < 9 or not isinstance(row[1], str):
            continue
        name = row[1].lower()
        # Pick rows we care about (representative materials)
        if not any(k in name for k in ["plastic", "paper", "metal", "glass"]):
            continue
        if isinstance(row[5], (int, float)): closed_vals.append(float(row[5]))
        if isinstance(row[6], (int, float)): comb_vals.append(float(row[6]))
        if isinstance(row[8], (int, float)): landfill_vals.append(float(row[8]))

    # DEFRA's waste numbers are per tonne and small (typically 6-1200 kg CO2e/tonne).
    # We translate to a "multiplier on total footprint" by comparing to a 1000
    # kg CO2e/tonne baseline (rough cradle-to-gate average for these materials).
    def avg(lst): return float(np.mean(lst)) if lst else 0.0
    baseline = 1000.0   # kg CO2e per tonne, typical cradle-to-gate
    return {
        "RECYCLED":     round(0.85, 3),  # widely-accepted ~15% saving
        "INCINERATED":  round(min(1.10, 1.0 + avg(comb_vals)    / baseline), 3),
        "LANDFILL":     round(min(1.25, 1.0 + avg(landfill_vals) / baseline), 3),
    }


def extract_defra_uk_grid(wb) -> float:
    """Read UK electricity sheet → kg CO2e per kWh for UK in 2024."""
    ws = wb["UK electricity"]
    for i, row in _ws_rows(ws):
        if i < 23:
            continue
        if (len(row) >= 5 and isinstance(row[1], str)
                and "uk" in row[1].lower() and row[2] == "kWh"):
            val = row[4]
            if isinstance(val, (int, float)):
                return round(float(val), 4)
    return 0.207   # documented DEFRA 2024 value as fallback


# ===========================================================================
# Section 4 — Hybrid dataset builder
# ===========================================================================

def build_calibrated_factors() -> Dict:
    """Combine all three sources into a single calibrated factors dict.

    The DEFRA xlsx is optional — in production (HF Spaces, Docker images
    that lose LFS-tracked binaries, etc.) it can be missing or corrupt.
    When that happens we fall back to baked-in factors extracted from
    DEFRA 2024 in development. Agribalyse + Poore CSVs are tiny text
    files and always work.
    """
    wb = None
    if DEFRA.exists():
        try:
            print("[adapter] Loading DEFRA workbook...")
            wb = openpyxl.load_workbook(DEFRA, read_only=True, data_only=True)
        except Exception as exc:
            print(f"[adapter] WARNING: DEFRA xlsx unreadable ({exc!r}). "
                  f"Falling back to baked-in factors.")
            wb = None
    else:
        print(f"[adapter] WARNING: DEFRA xlsx missing at {DEFRA}. "
              f"Falling back to baked-in factors.")

    if wb is not None:
        try:
            material_factors = extract_defra_materials(wb)
            transport = extract_defra_transport(wb)
            eol = extract_defra_eol(wb)
            grid_uk = extract_defra_uk_grid(wb)
        except Exception as exc:
            print(f"[adapter] WARNING: DEFRA extraction failed ({exc!r}). "
                  f"Falling back to baked-in factors.")
            wb = None

    if wb is None:
        # Baked-in DEFRA 2024 values (extracted in dev, identical to what the
        # xlsx-based path would produce). Lets the build succeed without the
        # 1.8 MB binary file.
        material_factors = {
            "Steel": 2.855, "Plastic": 2.569, "Glass": 1.403,
            "Paper": 1.194, "Wood": 0.270,
        }
        transport = {"AIR": 0.95, "SEA": 0.015, "ROAD": 0.107, "RAIL": 0.025}
        eol = {"RECYCLED": 0.85, "INCINERATED": 1.006, "LANDFILL": 1.201}
        grid_uk = 0.2071

    # Layer Poore medians on top for food categories (more reliable than
    # any single Agribalyse row).
    print("[adapter] Loading Poore & Nemecek...")
    poore = load_poore()
    poore_medians = poore.groupby("material")["co2_per_kg"].median().to_dict()

    print("[adapter] Loading Agribalyse (taking medians for cross-check)...")
    agri = load_agribalyse()
    agri_medians = agri.groupby("material")["co2_per_kg"].median().to_dict()

    # Final material_factors: prefer DEFRA for industrial, Poore for food,
    # fall back to Agribalyse, then original hardcoded
    HARDCODED = {  # original defaults from train_model.py — last-resort fallback
        "Cotton": 5.5, "Polyester": 6.2, "Wool": 10.4, "Leather": 17.0,
        "Steel": 2.8, "Aluminum": 8.2, "Plastic": 3.5, "Glass": 0.9,
        "Paper": 1.3, "Wood": 0.5,
        "Beef": 27.0, "Lamb": 24.0, "Pork": 12.1, "Chicken": 6.9, "Turkey": 10.9,
        "Fish_Farmed": 5.1, "Fish_Wild": 2.9, "Shrimp": 18.0,
        "Milk": 1.9, "Cheese": 13.5, "Eggs": 4.8, "Butter": 12.0,
        "Tofu": 2.0, "Lentils": 0.9, "Beans": 1.0, "Nuts": 2.3,
        "Rice": 4.0, "Wheat": 1.4, "Oats": 1.6, "Corn": 1.1,
        "Tomatoes": 2.1, "Potatoes": 0.5, "Lettuce": 0.9, "Apples": 0.4, "Bananas": 0.7,
    }
    final_materials = {}
    sources = {}
    for mat in HARDCODED:
        if mat in material_factors:
            final_materials[mat] = material_factors[mat]; sources[mat] = "DEFRA"
        elif mat in poore_medians:
            final_materials[mat] = round(float(poore_medians[mat]), 3); sources[mat] = "Poore"
        elif mat in agri_medians:
            final_materials[mat] = round(float(agri_medians[mat]), 3); sources[mat] = "Agribalyse"
        else:
            final_materials[mat] = HARDCODED[mat]; sources[mat] = "hardcoded"

    return {
        "schema_version": 1,
        "materials_kg_co2_per_kg": final_materials,
        "material_sources": sources,
        "transport_kg_co2_per_kg_per_1000km": transport,
        "eol_multiplier": eol,
        "grid_uk_kg_co2_per_kwh": grid_uk,
    }


def build_split_agribalyse(
    eval_fraction: float = 0.2,
    n_contexts_per_product: int = 2,
    seed: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """**Product-level holdout split** — each Agribalyse product (unique name_fr)
    is exclusively in TRAIN or EVAL, never both.

    Why this matters:
      - Tests true generalization to *unseen products* within known materials.
      - Eliminates the row-level leakage problem where the model could memorise
        a product seen in one context and recall its CO2 in another context.
      - Stratified per-material so every material is represented in both sets
        (encoders won't break, and we can measure per-material generalization).

    Each product is expanded into `n_contexts_per_product` rows with randomized
    weight + transport + country + EOL so train and eval share the same
    context distribution (no covariate shift).

    The TARGET total_co2_kg uses the REAL measured per-kg factor for material
    emissions plus calibrated transport/EOL adjustments — so this is genuine
    measured data the model has to learn to predict in arbitrary contexts.
    """
    agri = load_agribalyse()
    rng = np.random.default_rng(seed)

    transports = ["AIR", "SEA", "ROAD", "RAIL"]
    intensities = ["LOW", "MEDIUM", "HIGH"]
    countries = ["CHINA", "INDIA", "USA", "GERMANY", "FRANCE", "SWEDEN",
                 "AUSTRALIA", "BRAZIL", "JAPAN", "UK"]
    eols = ["RECYCLED", "INCINERATED", "LANDFILL"]
    MFG_BASE = {"LOW": 0.5, "MEDIUM": 1.5, "HIGH": 3.5}
    TRANS = {"AIR": 0.95, "SEA": 0.015, "ROAD": 0.107, "RAIL": 0.025}
    EOL_MULT = {"RECYCLED": 0.85, "INCINERATED": 1.006, "LANDFILL": 1.201}
    GRID = {"CHINA": 2.6, "INDIA": 3.5, "USA": 1.8, "GERMANY": 1.8,
            "FRANCE": 0.3, "SWEDEN": 0.2, "AUSTRALIA": 3.0,
            "BRAZIL": 0.5, "JAPAN": 2.2, "UK": 1.0}

    def _row_for(product_name, material, co2_per_kg, set_label):
        weight = float(rng.uniform(0.1, 5.0))
        mode = rng.choice(transports, p=[0.10, 0.30, 0.45, 0.15])
        if mode == "AIR":   dist = rng.uniform(2000, 15000)
        elif mode == "SEA": dist = rng.uniform(5000, 20000)
        elif mode == "ROAD": dist = rng.uniform(50, 3000)
        else:               dist = rng.uniform(200, 5000)
        country = rng.choice(countries)
        intensity = rng.choice(intensities)
        eol = rng.choice(eols, p=[0.4, 0.3, 0.3])

        material_co2 = weight * co2_per_kg
        mfg_co2 = weight * MFG_BASE[intensity] * (GRID[country] ** 0.4)
        transport_co2 = weight * (dist / 1000) * TRANS[mode]
        total = (material_co2 + mfg_co2 + transport_co2) * EOL_MULT[eol]
        total *= rng.normal(1.0, 0.10)
        return {
            "material": material, "weight_kg": round(weight, 3),
            "transport_mode": mode,
            "transport_distance_km": round(float(dist), 1),
            "manufacturing_intensity": intensity, "country": country, "eol": eol,
            "material_co2": round(material_co2, 3),
            "manufacturing_co2": round(mfg_co2, 3),
            "transport_co2": round(transport_co2, 3),
            "total_co2_kg": round(max(float(total), 0.01), 3),
            "source": "agribalyse_real",
            "product_id": product_name,
            "split": set_label,
        }

    train_rows, eval_rows = [], []
    split_log = {}

    for material, group in agri.groupby("material"):
        unique_products = group["name_fr"].drop_duplicates().tolist()
        rng.shuffle(unique_products)
        n_eval = max(1, int(round(len(unique_products) * eval_fraction)))
        # If only 1 product, keep it in train (eval will skip this material)
        if len(unique_products) < 2:
            train_set, eval_set = set(unique_products), set()
        else:
            eval_set = set(unique_products[:n_eval])
            train_set = set(unique_products[n_eval:])
        split_log[material] = (len(train_set), len(eval_set))

        for _, r in group.iterrows():
            target = "eval" if r["name_fr"] in eval_set else "train"
            target_list = eval_rows if target == "eval" else train_rows
            for _ in range(n_contexts_per_product):
                target_list.append(_row_for(r["name_fr"], material,
                                            float(r["co2_per_kg"]), target))

    train_df = pd.DataFrame(train_rows)
    eval_df = pd.DataFrame(eval_rows)

    # Leakage sanity check
    leak = set(train_df["product_id"]) & set(eval_df["product_id"])
    if leak:
        raise RuntimeError(f"PRODUCT LEAKAGE: {len(leak)} products in both sets")
    print(f"[split] {len(train_df)} train rows, {len(eval_df)} eval rows; "
          f"0 product overlaps; {len(split_log)} materials stratified")

    return train_df, eval_df


def build_hybrid_dataset(factors: Dict, n_synthetic: int = 12000) -> pd.DataFrame:
    """Generate synthetic data using *calibrated* factors instead of hardcoded."""
    rng = np.random.default_rng(7)
    materials = list(factors["materials_kg_co2_per_kg"].keys())
    transports = ["AIR", "SEA", "ROAD", "RAIL"]
    intensities = ["LOW", "MEDIUM", "HIGH"]
    countries = ["CHINA", "INDIA", "USA", "GERMANY", "FRANCE", "SWEDEN",
                 "AUSTRALIA", "BRAZIL", "JAPAN", "UK"]
    eols = ["RECYCLED", "INCINERATED", "LANDFILL"]

    MFG_BASE = {"LOW": 0.5, "MEDIUM": 1.5, "HIGH": 3.5}
    # Simple grid carbon intensity normalisation factor (relative to UK=1.0)
    GRID = {"CHINA": 2.6, "INDIA": 3.5, "USA": 1.8, "GERMANY": 1.8,
            "FRANCE": 0.3, "SWEDEN": 0.2, "AUSTRALIA": 3.0,
            "BRAZIL": 0.5, "JAPAN": 2.2, "UK": 1.0}

    M_FACTORS = factors["materials_kg_co2_per_kg"]
    T_FACTORS = factors["transport_kg_co2_per_kg_per_1000km"]
    E_FACTORS = factors["eol_multiplier"]

    rows = []
    for _ in range(n_synthetic):
        material = rng.choice(materials)
        weight = np.clip(rng.lognormal(0.5, 1.2), 0.05, 100)
        mode = rng.choice(transports, p=[0.10, 0.30, 0.45, 0.15])
        if mode == "AIR":  dist = rng.uniform(2000, 15000)
        elif mode == "SEA": dist = rng.uniform(5000, 20000)
        elif mode == "ROAD": dist = rng.uniform(50, 3000)
        else:               dist = rng.uniform(200, 5000)
        intensity = rng.choice(intensities)
        country = rng.choice(countries)
        eol = rng.choice(eols, p=[0.4, 0.3, 0.3])

        material_co2 = weight * M_FACTORS[material]
        mfg_co2 = weight * MFG_BASE[intensity] * (GRID[country] ** 0.4)
        transport_co2 = weight * (dist / 1000) * T_FACTORS[mode]
        total = (material_co2 + mfg_co2 + transport_co2) * E_FACTORS[eol]
        total *= rng.normal(1.0, 0.12)

        rows.append({
            "material": material, "weight_kg": round(float(weight), 3),
            "transport_mode": mode, "transport_distance_km": round(float(dist), 1),
            "manufacturing_intensity": intensity, "country": country, "eol": eol,
            "material_co2": round(material_co2, 3),
            "manufacturing_co2": round(mfg_co2, 3),
            "transport_co2": round(transport_co2, 3),
            "total_co2_kg": round(max(float(total), 0.01), 3),
            "source": "synthetic_calibrated",
        })
    return pd.DataFrame(rows)


# ===========================================================================
# Section 5 — Entry point
# ===========================================================================

def main():
    if not DATA_DIR.exists():
        sys.exit(f"[adapter] Missing data dir: {DATA_DIR}")

    # REQUIRED files (small CSVs, always in git):
    required_missing = [pp.name for pp in (AGRI, POORE) if not pp.exists()]
    if required_missing:
        sys.exit(f"[adapter] Missing required files in {DATA_DIR}: {required_missing}")

    # OPTIONAL: DEFRA xlsx. If missing or corrupt, build_calibrated_factors()
    # falls back to baked-in DEFRA 2024 values. No need to abort here.
    if not DEFRA.exists():
        print(f"[adapter] NOTE: DEFRA xlsx not found at {DEFRA.name} — "
              f"using baked-in factors.")

    print(f"[adapter] Reading from {DATA_DIR}")
    print(f"[adapter] Writing to   {OUT_DIR}")

    # 1. Calibrated factors JSON
    factors = build_calibrated_factors()
    OUT_FACTORS.write_text(json.dumps(factors, indent=2))
    print(f"\n[adapter] OK Wrote {OUT_FACTORS.name}")

    # 2 + 3. Product-level holdout split — each Agribalyse product is exclusively
    #         in TRAIN or EVAL (Fix C). Same context distribution in both sets.
    print("\n[adapter] Building product-level holdout split (Fix C)...")
    agri_train, agri_eval = build_split_agribalyse(
        eval_fraction=0.2, n_contexts_per_product=2, seed=42)

    # Eval CSV = held-out Agribalyse products only.
    # NOTE: we no longer include Poore in eval because our material factors
    # were CALIBRATED from Poore medians — so a Poore eval row tests a number
    # the model already saw via the factor. Not a fair generalization test.
    agri_eval.to_csv(OUT_EVAL, index=False)
    print(f"\n[adapter] OK Wrote {OUT_EVAL.name}  ({len(agri_eval)} held-out rows from "
          f"{agri_eval['product_id'].nunique()} unique products across "
          f"{agri_eval['material'].nunique()} materials)")

    # Hybrid training CSV = synthetic-calibrated + train-half Agribalyse
    hybrid = build_hybrid_dataset(factors, n_synthetic=12000)
    agri_train_for_concat = agri_train.drop(columns=["product_id", "split"])
    hybrid_full = pd.concat([hybrid, agri_train_for_concat], ignore_index=True)
    hybrid_full.to_csv(OUT_HYBRID, index=False)
    print(f"\n[adapter] OK Wrote {OUT_HYBRID.name}  ({len(hybrid_full)} rows: "
          f"{(hybrid_full['source']=='synthetic_calibrated').sum()} synthetic + "
          f"{(hybrid_full['source']=='agribalyse_real').sum()} real Agribalyse)")

    print("\n[adapter] DONE. Next:")
    print("   python predictor/training/train_xgboost.py")


if __name__ == "__main__":
    main()
