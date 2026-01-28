$ErrorActionPreference = "Stop"

function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

Write-Color "🚀 Starting GCP Setup for Medication Reminder App..." "Cyan"

# 1. Project Setup
$PROJECT_ID = Read-Host "Enter your existing GCP Project ID (or press Enter to create a new one 'med-remind-XXX')"
if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) {
    $RANDOM_SUFFIX = Get-Random -Minimum 1000 -Maximum 9999
    $PROJECT_ID = "med-remind-$RANDOM_SUFFIX"
    Write-Color "Creating new project: $PROJECT_ID" "Yellow"
    gcloud projects create $PROJECT_ID
    gcloud config set project $PROJECT_ID
} else {
    Write-Color "Using project: $PROJECT_ID" "Yellow"
    gcloud config set project $PROJECT_ID
}

# 2. Enable APIs
Write-Color "Enabling required APIs..." "Yellow"
gcloud services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 3. Create Artifact Registry
$REGION = "us-central1"
$REPO_NAME = "med-repo"
Write-Color "Creating Artifact Registry ($REPO_NAME) in $REGION..." "Yellow"
try {
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repository"
} catch {
    Write-Color "Repository might already exist, continuing..." "Gray"
}

# 4. Cloud SQL Setup
$DB_INSTANCE = "med-db-instance"
$DB_PASSWORD = Read-Host "Enter a strong password for the DB User 'postgres'" -AsSecureString
$DB_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

Write-Color "Creating Cloud SQL Instance (this takes 5-10 minutes)..." "Yellow"
# Using micro instance for cost/dev
gcloud sql instances create $DB_INSTANCE --database-version=POSTGRES_15 --cpu=1 --memory=3840MB --region=$REGION --root-password=$DB_PASSWORD_PLAIN

Write-Color "Creating database 'med_app'..." "Yellow"
gcloud sql databases create med_app --instance=$DB_INSTANCE

# Get Connection Name
$CONNECTION_NAME = gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)"
Write-Color "DB Connection Name: $CONNECTION_NAME" "Green"

# 5. Secrets Management
Write-Color "Creating Secrets..." "Yellow"

# Database URL
# Format: postgresql://postgres:PASSWORD@localhost/med_app?host=/cloudsql/CONNECTION_NAME
$DATABASE_URL = "postgresql://postgres:$($DB_PASSWORD_PLAIN)@localhost/med_app?host=/cloudsql/$CONNECTION_NAME"
echo $DATABASE_URL | gcloud secrets create database-url --data-file=-
# Allow Cloud Run to access
# Note: We need the Service Account for Cloud Run. We'll grant access later or default compute SA.

# Gemini API Key
$GEMINI_KEY = Read-Host "Enter your Gemini API Key"
echo $GEMINI_KEY | gcloud secrets create gemini-api-key --data-file=-

Write-Color "✅ Setup Complete!" "Green"
Write-Color "Your configuration:" "Cyan"
Write-Color " - Project ID: $PROJECT_ID" "Cyan"
Write-Color " - Region: $REGION" "Cyan"
Write-Color " - DB Connection: $CONNECTION_NAME" "Cyan"
Write-Color " - Registry: $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME" "Cyan"
Write-Color "" "Cyan"
Write-Color "Next Steps:" "Cyan"
Write-Color "1. Run: gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend ./backend" "Cyan"
Write-Color "2. Run: gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/frontend ./frontend" "Cyan"
Write-Color "3. Deploy to Cloud Run using the commands in DEPLOYMENT.md" "Cyan"
