# Making the model understand and reason with report text

Reports created on the site are scanned to find risks, delays, and material shortages. For the system to **understand or reason with what’s written** (different phrasings, real wording), you can improve the current model and optionally add an LLM.

---

## How it works today

- **Input:** Full report text (from all captured fields).
- **Process:** Text is split into **sentences** (spaCy). Each sentence is **classified** (TF-IDF + Logistic Regression) as one of: `risk`, `delay`, `material_shortage`, `none`.
- **Output:** Sentences above a confidence threshold are returned as “flags” with a suggested action.

The current model learns from **examples** in `data/training_data.json`. It generalizes by recognising words and phrases similar to those it was trained on. It does **not** do deep semantic reasoning; it correlates wording with labels.

---

## Making it “understand” better (current pipeline)

To get the model to handle **real report language** and feel like it “reasons” with the text:

1. **Train on real sentences from your domain**  
   When users write reports, copy sentences that clearly represent risk / delay / material_shortage (and “none”) into `training_data.json` with the correct label. The more the training set looks like what people actually write, the better the model will behave on uploads.

2. **Cover many ways of saying the same thing**  
   Add paraphrases and variants: e.g. “Delivery delayed”, “We’re behind on delivery”, “Supplier failed to deliver on time”, “Delivery was pushed back”. Same label, different wording. That reduces over-reliance on a few keywords.

3. **Keep labels balanced**  
   Aim for a similar number of examples per label (risk, delay, material_shortage, none). Skewed data makes the model biased toward the majority class.

4. **Retrain after adding data**  
   Run `python -m app.train` and restart the service so the new model is used. The pipeline does not “learn” from uploads at runtime; it only uses the last trained model.

5. **Tune confidence if needed**  
   In `app/pipeline.py`, `CONFIDENCE_THRESHOLD = 0.65`. If you get too many false positives, raise it; if the model is too cautious, lower it slightly.

---

## Optional: LLM for deeper reasoning

If you need the system to **reason** over arbitrary wording (e.g. implied risks, indirect phrasing, new vocabulary), you can add an **LLM-based classifier** that:

- Takes each sentence (or short paragraph).
- Asks the LLM: “Classify this construction report sentence as exactly one of: risk, delay, material_shortage, none. Reply with only that word.”
- Uses the LLM reply as the label.

That would run alongside or instead of the current TF-IDF model (e.g. behind an env flag or config). Implementation would call an API (e.g. Azure OpenAI) with the sentence and a small prompt; no change to the rest of the app (Risk Detection page, Home dashboard, or how reports are uploaded and scanned). Tradeoffs: better understanding and flexibility vs. cost and latency.

---

## Summary

| Goal | Approach |
|------|----------|
| Better understanding with **current** model | Add lots of **real report sentences** and **paraphrases** to `training_data.json`, keep labels balanced, **retrain** and restart. |
| True “reasoning” over any wording | Add an optional **LLM classifier** (e.g. Azure OpenAI) for the classification step; keep existing upload → scan → dashboard flow. |

The plan remains: people upload reports they make on the site → we scan them with this pipeline → we surface underlying issues (risk, delays, material shortages). Improving training data (and optionally adding an LLM) is how we make the system understand and reason with what’s being written.
