# Deployment Guide

This guide details how to deploy the **Medication Reminder + Health Risk Predictor** application to Google Cloud Platform (GCP).

## Prerequisites

1.  **Google Cloud SDK**: Install and initialize the `gcloud` CLI.
    ```powershell
    gcloud auth login
    gcloud config set project [YOUR_PROJECT_ID]
    ```
2.  **Docker**: Ensure Docker Desktop is running.

## 1. Infrastructure Setup

Run the automated setup script to provision Cloud SQL, Secrets, and Artifact Registry.

```powershell
./scripts/setup_gcp.ps1
```

Follow the interactive prompts to enter your database password and Gemini API Key.

## 2. Build & Push Containers

Replace `[REGION]`, `[PROJECT_ID]`, and `[REPO_NAME]` with values output by the setup script (default: `us-central1`, `med-remind-XXX`, `med-repo`).

### Backend
```powershell
gcloud builds submit --tag us-central1-docker.pkg.dev/[PROJECT_ID]/med-repo/backend ./backend
```

### Frontend
```powershell
gcloud builds submit --tag us-central1-docker.pkg.dev/[PROJECT_ID]/med-repo/frontend ./frontend
```

## 3. Deploy to Cloud Run

### Backend Service
Deploy the backend first as it creates the database schema.

```powershell
gcloud run deploy med-backend `
  --image us-central1-docker.pkg.dev/[PROJECT_ID]/med-repo/backend `
  --region us-central1 `
  --allow-unauthenticated `
  --set-secrets="DATABASE_URL=database-url:latest,GOOGLE_API_KEY=gemini-api-key:latest" `
  --add-cloudsql-instances [CONNECTION_NAME]
```

*Replace `[CONNECTION_NAME]` with the value from the setup script (e.g., `project:region:instance`).*

### Frontend Service
Get the URL of the deployed backend service (e.g., `https://med-backend-xyz.run.app`).

```powershell
gcloud run deploy med-frontend `
  --image us-central1-docker.pkg.dev/[PROJECT_ID]/med-repo/frontend `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars "NEXT_PUBLIC_API_URL=[YOUR_BACKEND_URL]"
```
