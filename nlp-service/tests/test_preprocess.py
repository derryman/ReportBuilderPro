import unittest
from unittest.mock import patch

import _ensure_repo_root  # noqa: F401

from app import preprocess


class TestPreprocess(unittest.TestCase):
    def test_sentence_split_and_lemmatize_returns_empty_list_for_blank_input(self) -> None:
        self.assertEqual(preprocess.sentence_split_and_lemmatize(""), [])
        self.assertEqual(preprocess.sentence_split_and_lemmatize("   "), [])

    def test_sentence_split_and_lemmatize_uses_fallback_when_spacy_unavailable(self) -> None:
        sample_text = "Unsafe access detected. Materials delayed."

        with patch.object(preprocess, "nlp", None):
            result = preprocess.sentence_split_and_lemmatize(sample_text)

        self.assertEqual(
            result,
            [
                ("Unsafe access detected", ["unsafe", "access", "detected"]),
                ("Materials delayed", ["materials", "delayed"]),
            ],
        )


if __name__ == "__main__":
    unittest.main()
