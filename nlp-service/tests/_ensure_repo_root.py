# Makes sure the nlp-service root is on the Python path so tests can import from app/
import sys
from pathlib import Path

_root = str(Path(__file__).resolve().parent.parent)
if _root not in sys.path:
    sys.path.insert(0, _root)
