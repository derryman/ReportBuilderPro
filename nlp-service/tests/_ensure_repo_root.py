"""Ensure nlp-service root is on sys.path so `from app import …` works from any cwd."""
import sys
from pathlib import Path

_root = str(Path(__file__).resolve().parent.parent)
if _root not in sys.path:
    sys.path.insert(0, _root)
