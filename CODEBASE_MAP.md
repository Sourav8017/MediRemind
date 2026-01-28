# Codebase Map

This document catalogues all API endpoints, their required input payloads, and the source files where they are defined.

## Backend (FastAPI)

### Medication OCR
**Endpoint**: `POST /process-medication`
**Handler File**: [backend/main.py](file:///d:/Medication%20Reminder%20+%20Health%20Risk%20Predictor%20app/backend/main.py)
**Description**: Accepts a base64 encoded image string and uses Gemini Vision to extract medication details (name, dosage, frequency, instructions).
**Request Body**:
```json
{
  "image": "string (base64 encoded)"
}
```
**Response**:
```json
{
  "name": "string",
  "dosage": "string",
  "frequency": "string",
  "instructions": "string"
}
```

### Health Risk Prediction
**Endpoint**: `POST /predict-risk`
**Handler File**: [backend/main.py](file:///d:/Medication%20Reminder%20+%20Health%20Risk%20Predictor%20app/backend/main.py)
**Description**: Analyzes comprehensive health data to predict risk scores and provide recommendations.
**Request Body**:
```json
{
  "age": "integer",
  "gender": "string",
  "systolicBP": "integer",
  "diastolicBP": "integer",
  "heartRate": "integer",
  "weight": "number",
  "height": "number",
  "smokingStatus": "string (Never, Former, Current)",
  "diabetesStatus": "string (No, Pre-diabetic, Type 1, Type 2)",
  "familyHistory": ["string"],
  "currentMedications": ["string"],
  "recentSymptoms": ["string"]
}
```
**Response**:
```json
{
  "riskScore": "number (0-100)",
  "riskCategory": "string (LOW, MODERATE, HIGH)",
  "contributingFactors": ["string"],
  "recommendations": ["string"]
}
```

### Medication Management
**Endpoint**: `POST /medications`
**Handler File**: [backend/main.py](file:///d:/Medication%20Reminder%20+%20Health%20Risk%20Predictor%20app/backend/main.py)
**Description**: Creates a new medication and schedules its reminders.
**Request Body**:
```json
{
  "name": "string",
  "dosage": "string",
  "frequency": "string",
  "instructions": "string",
  "start_date": "string (ISO)",
  "reminders": ["string (HH:MM)"]
}
```

**Endpoint**: `POST /medications/test-trigger`
**Handler File**: [backend/main.py](file:///d:/Medication%20Reminder%20+%20Health%20Risk%20Predictor%20app/backend/main.py)
**Description**: Creates a dummy medication with a reminder set for `minutes` from now (default 1).
**Query Param**: `minutes` (integer)

### Notifications
**Endpoint**: `GET /notifications/stream`
**Handler File**: [backend/main.py](file:///d:/Medication%20Reminder%20+%20Health%20Risk%20Predictor%20app/backend/main.py)
**Description**: Server-Sent Events (SSE) stream for real-time medication reminders.

**Endpoint**: `POST /subscribe`
**Handler File**: [backend/main.py](file:///d:/Medication%20Reminder%20+%20Health%20Risk%20Predictor%20app/backend/main.py)
**Description**: Placeholder for Web Push API subscription.

---
*Last Updated: 2026-01-27*
