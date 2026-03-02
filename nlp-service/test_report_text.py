"""
Run this AFTER training to verify the model spots risks in your report text.
Usage: from nlp-service folder:  python test_report_text.py
"""
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.pipeline import analyze_text, is_model_available
from app.preprocess import sentence_split_and_lemmatize

# Exact text as extracted from your PDF (so we test the same thing the API sees)
REPORT_TEXT = """Very Real Site Report for testing 
 
 
 
House A is progressing well 
Roof is up. 
Walls are Ready for external render. 
Windows are installed. 
Current access to the house is unsafe. 
A new safer ramp should be installed. 
ScaƯolding is not tied properly in in some parts. 
Missing some windowsills need more."""

def main():
    print("1. Model loaded?", is_model_available())
    if not is_model_available():
        print("   Run: python -m app.train")
        return

    print("\n2. How the text is split into sentences:")
    sentences = sentence_split_and_lemmatize(REPORT_TEXT)
    for i, (sent_str, _) in enumerate(sentences):
        print(f"   [{i}] {repr(sent_str)}")

    print("\n3. Full analysis (what the API returns):")
    result = analyze_text(REPORT_TEXT)
    print(f"   Flags found: {len(result['flags'])}")
    for f in result["flags"]:
        print(f"   - {f['label']} ({f['confidence']}): {repr(f['snippet'][:60])}...")

    if not result["flags"]:
        print("\n   No flags! So the model is not scoring these sentences above threshold.")
        print("   Make sure you ran:  python -m app.train   and restarted the NLP service.")
    else:
        print("\n   Model is working. Restart the NLP service and try the PDF again.")

if __name__ == "__main__":
    main()
