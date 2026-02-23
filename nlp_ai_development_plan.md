# NLP & AI Development Plan -- ReportBuilderPro

## 1. Project Overview

This document outlines the development plan for the NLP and AI
components of ReportBuilderPro. The goal is to automatically analyze
construction reports and identify risks, delays, and material shortages.

------------------------------------------------------------------------

## 2. Objectives

-   Automatically analyze report text
-   Detect risks, delays, and shortages
-   Provide confidence scores
-   Suggest actions
-   Store results in the database
-   Support iterative model improvement

------------------------------------------------------------------------

## 3. System Architecture

Frontend (React) \| Backend (Node.js API) \| FastAPI NLP Service \|
Cosmos DB (MongoDB)

------------------------------------------------------------------------

## 4. Input and Output Specification

### Input

-   Report free-text fields
-   Notes, comments, observations

### Output

-   Label (risk, delay, material_shortage)
-   Triggered text snippet
-   Confidence score (0--1)
-   Suggested action
-   Processing metadata

------------------------------------------------------------------------

## 5. Dataset Development

### 5.1 Data Collection

-   Export historical reports
-   Generate synthetic examples if needed

### 5.2 Annotation

-   Label each sentence
-   Categories: risk, delay, material_shortage, none

### 5.3 Target Size

-   Minimum 300--600 labeled samples
-   Balanced class distribution

------------------------------------------------------------------------

## 6. NLP Processing Pipeline

### Stage 1: Preprocessing (spaCy)

-   Lowercasing
-   Tokenization
-   Sentence splitting
-   Lemmatization

### Stage 2: Feature Extraction

-   TF-IDF (word + bigram)
-   Character n-grams (optional)

### Stage 3: Classification

-   Logistic Regression / Linear SVM
-   Probability output for confidence

### Stage 4: Flag Generation

-   Threshold-based detection (≥ 0.65)
-   Structured flag creation

------------------------------------------------------------------------

## 7. Machine Learning Model

### Baseline

-   TF-IDF + Logistic Regression

### Evaluation Metrics

-   Accuracy
-   Precision / Recall / F1-score
-   Confusion Matrix

### Performance Targets

-   Accuracy ≥ 85%
-   Runtime ≤ 3 seconds

------------------------------------------------------------------------

## 8. FastAPI Service Design

### Endpoints

POST /nlp/analyze - Input: report_id / text - Output: analysis results

POST /nlp/feedback - Input: user corrections - Purpose: retraining data

### Execution Flow

1.  Fetch report
2.  Process text
3.  Run model
4.  Store results
5.  Return response

------------------------------------------------------------------------

## 9. Database Integration

### AI Analysis Schema

ai_analysis: - status - model_version - processed_at - flags\[\]

Each flag contains: - label - confidence - snippet - suggested_action

------------------------------------------------------------------------

## 10. User Interface Integration

### Dashboard

-   Show flagged issues
-   Display confidence
-   Provide feedback button

### PDF Reports

-   Include AI summary section

------------------------------------------------------------------------

## 11. Retraining Strategy

### Phase 1

-   Initial training (v1.0)

### Phase 2

-   Collect feedback
-   Retrain (v1.1)
-   Compare metrics

------------------------------------------------------------------------

## 12. Security and Ethics

-   No raw text in logs
-   Role-based access
-   Explainable flags
-   User override option
-   GDPR compliance

------------------------------------------------------------------------

## 13. Development Timeline

  Phase   Task               Duration
  ------- ------------------ ----------
  1       Dataset creation   2 weeks
  2       Model training     2 weeks
  3       API integration    2 weeks
  4       UI integration     1 week
  5       Testing            1 week
  6       Documentation      1 week

------------------------------------------------------------------------

## 14. Deliverables

-   Labeled dataset
-   Trained ML model
-   FastAPI service
-   Backend integration
-   Dashboard UI
-   Evaluation report

------------------------------------------------------------------------

## 15. Success Criteria

-   Stable API
-   Accuracy ≥ 85%
-   User-validated results
-   Deployment-ready pipeline

------------------------------------------------------------------------

End of Document
