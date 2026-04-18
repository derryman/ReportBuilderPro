import unittest
from unittest.mock import patch

import _ensure_repo_root  # noqa: F401

from app import pipeline


class TestPipeline(unittest.TestCase):
    def test_analyze_text_returns_empty_result_for_blank_input(self) -> None:
        with patch.object(pipeline, "CLASSIFIER_MODE", "ml"):
            result = pipeline.analyze_text("   ")

        self.assertEqual(result["flags"], [])
        self.assertEqual(result["metadata"]["text_length"], 0)
        self.assertEqual(result["metadata"]["sentence_count"], 0)
        self.assertEqual(result["metadata"]["processing_time_ms"], 0)
        self.assertEqual(result["metadata"]["classifier_mode"], "ml")

    def test_analyze_text_creates_flag_for_high_confidence_issue(self) -> None:
        mocked_sentences = [("Scaffolding is unsafe", ["scaffolding", "unsafe"])]

        with (
            patch.object(pipeline, "CLASSIFIER_MODE", "ml"),
            patch.object(pipeline, "sentence_split_and_lemmatize", return_value=mocked_sentences),
            patch.object(pipeline, "_classify_sentence_ml", return_value=("risk", 0.88)),
        ):
            result = pipeline.analyze_text("Scaffolding is unsafe")

        self.assertEqual(len(result["flags"]), 1)
        self.assertEqual(result["flags"][0]["label"], "risk")
        self.assertEqual(result["flags"][0]["confidence"], 0.88)
        self.assertEqual(result["flags"][0]["snippet"], "Scaffolding is unsafe")
        self.assertEqual(
            result["flags"][0]["suggested_action"],
            "Log in issues register. Schedule follow-up inspection.",
        )
        self.assertEqual(result["flags"][0]["sentence_index"], 0)
        self.assertEqual(result["metadata"]["sentence_count"], 1)

    def test_analyze_text_ignores_low_confidence_predictions(self) -> None:
        mocked_sentences = [("Minor concern noted", ["minor", "concern", "noted"])]

        with (
            patch.object(pipeline, "CLASSIFIER_MODE", "ml"),
            patch.object(pipeline, "sentence_split_and_lemmatize", return_value=mocked_sentences),
            patch.object(pipeline, "_classify_sentence_ml", return_value=("risk", 0.30)),
        ):
            result = pipeline.analyze_text("Minor concern noted")

        self.assertEqual(result["flags"], [])
        self.assertEqual(result["metadata"]["sentence_count"], 1)


if __name__ == "__main__":
    unittest.main()
