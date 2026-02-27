# ReportBuilderPro NLP Service - production image
FROM python:3.11-slim

WORKDIR /app

# Install system deps for spaCy
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model (required for preprocessing)
RUN python -m spacy download en_core_web_sm || true

# Copy app and data
COPY app/ ./app/
COPY data/ ./data/

# Train model at build time so image is self-contained (uses data/training_data.json)
RUN python -m app.train

# Azure and most clouds set PORT
ENV PORT=8000
EXPOSE 8000

# Run with uvicorn; Azure/Container Apps set PORT at runtime
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
