so # Risk Dataset (Construction: Safety, Delays, Material Shortages, Fire/Cladding, Weathertightness)

Generated: 2026-03-06T14:57:23.075913Z

## Contents
- **risk_catalog.json**: Unique risk taxonomy (risk types). Use this to build dropdowns, labels, or a controlled vocabulary.
- **risk_training_examples.jsonl**: Training examples (JSON Lines). Each line is a standalone example.
- **schema.json**: Field definitions.

## Provenance
- `source=synthetic_from_taxonomy`: Examples generated from a curated taxonomy to scale dataset size and cover varied terminology.
- `source=user_provided_osha_text`: A small set of incident examples derived from OSHA-style narratives pasted by the user in chat (no personal identifiers).
- `source=user_provided_building_safety_narrative`: A small set of examples derived from the user-provided narrative on cladding/fire safety and NZ weathertightness (not verbatim).

## Suggested training uses
1. **Text classification**: train a classifier to predict `labels.category` or `labels.risk_id`.
2. **Multi-label expansion**: treat each example as (category, subcategory, severity, likelihood).
3. **RAG / embeddings**: embed `text` and retrieve similar historic risks.

## Notes
- Severity/likelihood in synthetic examples are sampled for variety; you can re-score using your own risk matrix.
- You can grow this dataset by appending additional grounded examples from your own site reports (anonymised).
