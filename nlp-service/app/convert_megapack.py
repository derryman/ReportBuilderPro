"""
Convert the construction risk megapack into the simpler training format used by
the ReportBuilderPro NLP classifier.

This keeps the current four-label setup intact:
    none, delay, risk, material_shortage

The converter:
1. Maps richer megapack categories into the current labels.
2. Cleans generic synthetic prefixes that would otherwise bias the model.
3. Writes a fully converted megapack file.
4. Builds an augmented training file by merging the existing dataset with a
   balanced sample of the converted megapack examples.
"""
# Run this once when you want to expand the training dataset with megapack examples
from __future__ import annotations

import argparse
import json
import random
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

NLP_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = NLP_ROOT.parent

DEFAULT_MEGAPACK_PATH = (
    REPO_ROOT / "risk_dataset_construction_megapack" / "risk_training_examples.jsonl"
)
DEFAULT_EXISTING_PATH = NLP_ROOT / "data" / "training_data.json"
DEFAULT_CONVERTED_OUTPUT = NLP_ROOT / "data" / "training_data_megapack_converted.json"
DEFAULT_AUGMENTED_OUTPUT = NLP_ROOT / "data" / "training_data_augmented.json"
DEFAULT_REPORT_STYLE_OUTPUT = NLP_ROOT / "data" / "training_data_megapack_report_style.json"
DEFAULT_AUGMENTED_REPORT_STYLE_OUTPUT = (
    NLP_ROOT / "data" / "training_data_augmented_report_style.json"
)
DEFAULT_SUMMARY_OUTPUT = NLP_ROOT / "data" / "training_data_augmented_summary.json"

# Map megapack categories down to our 4 labels — safety/fire/weathertightness all become "risk"
CATEGORY_TO_LABEL = {
    "safety": "risk",
    "fire_safety": "risk",
    "weathertightness": "risk",
    "delay": "delay",
    "material_shortage": "material_shortage",
}

# Regex patterns that strip synthetic label prefixes like "Safety issue: " or "Delay driver: "
GENERIC_PREFIX_PATTERNS = [
    re.compile(
        r"^(Unsafe condition noted|Incident|Safety issue|Compliance concern|"
        r"Building safety issue|Fire protection defect|Envelope issue|"
        r"Potential leak path noted|External moisture concern|Schedule variance|"
        r"Constraint logged|Delay driver|Shortage identified|Material risk|"
        r"Delivery update):\s*",
        flags=re.IGNORECASE,
    ),
    re.compile(r"^Programme risk(?: at [^:]+)?:\s*", flags=re.IGNORECASE),
    re.compile(r"^Fire safety risk(?: at [^:]+)?:\s*", flags=re.IGNORECASE),
    re.compile(r"^Weathertightness risk(?: at [^:]+)?:\s*", flags=re.IGNORECASE),
]
GENERIC_PREFIX_HINTS = {
    "activity",
    "concern",
    "condition",
    "defect",
    "delay",
    "driver",
    "identified",
    "incident",
    "issue",
    "logged",
    "material",
    "near miss",
    "programme risk",
    "reported",
    "risk",
    "schedule",
    "shortage",
    "update",
}
# Clauses to drop from synthetic examples — they don't appear in real site reports
META_CLAUSE_PREFIXES = (
    "likely cause:",
    "potential impact:",
    "potential impact to following trades",
    "immediate control required",
    "requires verification and sign-off",
    "stock check required",
    "remediation detail required",
)
# Phrases to remove so examples read like real site reports rather than synthetic data
REPORT_STYLE_REPLACEMENTS = [
    (re.compile(r"\bidentified during inspection\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bnoted during inspection\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\brequires verification and sign-off\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bremediation detail required\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bstock check required\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bimmediate control required\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bpotential impact to following trades\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bmulti-employer warehouse environment\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bincident reporting requirements not met\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bunsafe ladder practice was reported as common on site\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\btraining on correct pin sequence and exclusion zone were inadequate\b", flags=re.IGNORECASE), ""),
    (re.compile(r"\bwithin minutes of arrival\b", flags=re.IGNORECASE), ""),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert megapack risk data into ReportBuilderPro training format."
    )
    parser.add_argument(
        "--megapack",
        type=Path,
        default=DEFAULT_MEGAPACK_PATH,
        help="Path to risk_training_examples.jsonl",
    )
    parser.add_argument(
        "--existing",
        type=Path,
        default=DEFAULT_EXISTING_PATH,
        help="Path to the current training_data.json file",
    )
    parser.add_argument(
        "--converted-output",
        type=Path,
        default=DEFAULT_CONVERTED_OUTPUT,
        help="Where to write the full converted megapack dataset",
    )
    parser.add_argument(
        "--augmented-output",
        type=Path,
        default=DEFAULT_AUGMENTED_OUTPUT,
        help="Where to write the merged training dataset",
    )
    parser.add_argument(
        "--report-style-output",
        type=Path,
        default=DEFAULT_REPORT_STYLE_OUTPUT,
        help="Where to write the report-style megapack dataset",
    )
    parser.add_argument(
        "--augmented-report-style-output",
        type=Path,
        default=DEFAULT_AUGMENTED_REPORT_STYLE_OUTPUT,
        help="Where to write the report-style merged training dataset",
    )
    parser.add_argument(
        "--summary-output",
        type=Path,
        default=DEFAULT_SUMMARY_OUTPUT,
        help="Where to write the conversion summary JSON",
    )
    parser.add_argument(
        "--max-synthetic-per-label",
        type=int,
        default=80,
        help="Cap synthetic additions per target label in the merged training set",
    )
    parser.add_argument(
        "--max-synthetic-per-subcategory",
        type=int,
        default=8,
        help="Cap synthetic additions per subcategory before label balancing",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic sampling",
    )
    return parser.parse_args()


def load_json(path: Path) -> List[Dict]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON array in {path}")
    return data


def load_jsonl(path: Path) -> List[Dict]:
    records: List[Dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            line = raw_line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSONL at {path}:{line_number}") from exc
    if not records:
        raise ValueError(f"No records found in {path}")
    return records


# Strip the generic prefixes that synthetic examples have but real reports don't
def clean_synthetic_text(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text.strip())
    for pattern in GENERIC_PREFIX_PATTERNS:
        updated = pattern.sub("", cleaned)
        if updated != cleaned:
            cleaned = updated.strip()
            break

    prefix_match = re.match(r"^([^:]{3,120}):\s*(.+)$", cleaned)
    if prefix_match:
        prefix = prefix_match.group(1).strip().lower()
        if any(hint in prefix for hint in GENERIC_PREFIX_HINTS):
            cleaned = prefix_match.group(2).strip()

    return cleaned


# Make sure the text starts with a capital and ends with a full stop
def ensure_sentence(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text.strip(" .;,:"))
    if not cleaned:
        return ""
    cleaned = cleaned[0].upper() + cleaned[1:]
    if cleaned[-1] not in ".!?":
        cleaned += "."
    return cleaned


# Rewrite synthetic examples into report-style language — drops meta clauses and adds location context
def build_report_style_text(text: str, synthetic: bool) -> str:
    if not synthetic:
        return ensure_sentence(text)

    cleaned = clean_synthetic_text(text).replace(";", ". ")
    clauses = [part.strip(" .;,:") for part in re.split(r"\.\s*", cleaned) if part.strip()]
    location = ""
    kept: List[str] = []

    for clause in clauses:
        lower_clause = clause.lower()
        if lower_clause.startswith(META_CLAUSE_PREFIXES):
            continue

        if lower_clause.startswith("location:"):
            location = clause.split(":", 1)[1].strip()
            continue

        rewritten = clause
        for pattern, replacement in REPORT_STYLE_REPLACEMENTS:
            rewritten = pattern.sub(replacement, rewritten)
        rewritten = re.sub(r"\s+", " ", rewritten).strip(" .;,:")
        if rewritten:
            kept.append(rewritten)

    if not kept:
        return ensure_sentence(cleaned)

    main = kept[0]
    if location and not re.search(r"\b(at|in|on|near)\b", main, flags=re.IGNORECASE):
        main = f"{main} at {location}"

    return ensure_sentence(main)


# Loop through every megapack record, map it to our label, clean the text, skip anything unusable
def convert_megapack(records: Iterable[Dict]) -> Tuple[List[Dict], Counter]:
    converted: List[Dict] = []
    skipped = Counter()

    for record in records:
        labels = record.get("labels") or {}
        category = str(labels.get("category") or "").strip().lower()
        target_label = CATEGORY_TO_LABEL.get(category)
        if not target_label:
            skipped["unknown_category"] += 1
            continue

        text = str(record.get("text") or "").strip()
        if not text:
            skipped["missing_text"] += 1
            continue

        source = str(record.get("source") or "").strip().lower()
        synthetic = source == "synthetic_from_taxonomy"
        if synthetic:
            text = clean_synthetic_text(text)
        if not text:
            skipped["empty_after_cleaning"] += 1
            continue
        report_style_text = build_report_style_text(text, synthetic)

        converted.append(
            {
                "text": text,
                "report_style_text": report_style_text,
                "label": target_label,
                "source": source,
                "synthetic": synthetic,
                "original_category": category,
                "original_risk_id": labels.get("risk_id"),
                "subcategory": labels.get("subcategory"),
                "severity": labels.get("severity"),
                "likelihood": labels.get("likelihood"),
            }
        )

    return converted, skipped


# Pick a balanced sample of synthetic examples — capped per label and per subcategory to avoid bias
# AI helped here as I needed the model to not have an overload to one type of risk example
def select_synthetic_examples(
    converted: Iterable[Dict],
    max_per_label: int,
    max_per_subcategory: int,
    seed: int,
) -> List[Dict]:
    rng = random.Random(seed)
    grouped: Dict[str, Dict[str, List[Dict]]] = defaultdict(lambda: defaultdict(list))

    for entry in converted:
        if not entry.get("synthetic"):
            continue
        label = entry["label"]
        subcategory = str(entry.get("subcategory") or "unknown")
        grouped[label][subcategory].append(entry)

    selected: List[Dict] = []
    for label, subcategory_buckets in grouped.items():
        buckets: List[List[Dict]] = []
        for entries in subcategory_buckets.values():
            shuffled = entries[:]
            rng.shuffle(shuffled)
            buckets.append(shuffled[:max_per_subcategory])

        rng.shuffle(buckets)
        label_selected = 0
        while buckets and label_selected < max_per_label:
            next_round: List[List[Dict]] = []
            for bucket in buckets:
                if label_selected >= max_per_label:
                    break
                if bucket:
                    selected.append(bucket.pop())
                    label_selected += 1
                if bucket:
                    next_round.append(bucket)
            buckets = next_round

    return selected


def label_counts(records: Iterable[Dict]) -> Dict[str, int]:
    return dict(Counter(str(item.get("label") or "none").strip().lower() for item in records))


def to_training_record(entry: Dict, use_report_style: bool) -> Dict:
    record = dict(entry)
    if use_report_style and record.get("report_style_text"):
        record["text"] = record["report_style_text"]
    return record


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def main() -> None:
    args = parse_args()
    existing = load_json(args.existing)
    megapack_records = load_jsonl(args.megapack)
    converted, skipped = convert_megapack(megapack_records)

    # Grounded = real-world examples from the megapack (not synthetic)
    grounded = [entry for entry in converted if not entry["synthetic"]]
    synthetic_sample = select_synthetic_examples(
        converted,
        max_per_label=args.max_synthetic_per_label,
        max_per_subcategory=args.max_synthetic_per_subcategory,
        seed=args.seed,
    )
    # Final training set = your original data + real megapack examples + sampled synthetic ones
    augmented = existing + grounded + synthetic_sample
    report_style_converted = [to_training_record(entry, use_report_style=True) for entry in converted]
    grounded_report_style = [to_training_record(entry, use_report_style=True) for entry in grounded]
    synthetic_sample_report_style = [
        to_training_record(entry, use_report_style=True) for entry in synthetic_sample
    ]
    augmented_report_style = existing + grounded_report_style + synthetic_sample_report_style

    write_json(args.converted_output, converted)
    write_json(args.augmented_output, augmented)
    write_json(args.report_style_output, report_style_converted)
    write_json(args.augmented_report_style_output, augmented_report_style)

    summary = {
        "input": {
            "megapack_path": str(args.megapack),
            "existing_path": str(args.existing),
            "megapack_records": len(megapack_records),
            "existing_records": len(existing),
        },
        "mapping": CATEGORY_TO_LABEL,
        "selection": {
            "max_synthetic_per_label": args.max_synthetic_per_label,
            "max_synthetic_per_subcategory": args.max_synthetic_per_subcategory,
            "seed": args.seed,
        },
        "outputs": {
            "converted_output": str(args.converted_output),
            "augmented_output": str(args.augmented_output),
            "report_style_output": str(args.report_style_output),
            "augmented_report_style_output": str(args.augmented_report_style_output),
        },
        "skipped_records": dict(skipped),
        "converted_counts": {
            "all_converted": len(converted),
            "grounded": len(grounded),
            "synthetic": len([entry for entry in converted if entry["synthetic"]]),
            "by_label": label_counts(converted),
        },
        "augmented_counts": {
            "added_grounded": len(grounded),
            "added_synthetic": len(synthetic_sample),
            "final_records": len(augmented),
            "by_label": label_counts(augmented),
        },
        "augmented_report_style_counts": {
            "added_grounded": len(grounded_report_style),
            "added_synthetic": len(synthetic_sample_report_style),
            "final_records": len(augmented_report_style),
            "by_label": label_counts(augmented_report_style),
        },
    }
    write_json(args.summary_output, summary)

    print("Megapack conversion complete.")
    print(f"Converted megapack file: {args.converted_output}")
    print(f"Augmented training file: {args.augmented_output}")
    print(f"Report-style megapack file: {args.report_style_output}")
    print(f"Report-style augmented file: {args.augmented_report_style_output}")
    print(f"Summary file: {args.summary_output}")
    print("Final label counts:", summary["augmented_counts"]["by_label"])
    print("Report-style label counts:", summary["augmented_report_style_counts"]["by_label"])


if __name__ == "__main__":
    main()
