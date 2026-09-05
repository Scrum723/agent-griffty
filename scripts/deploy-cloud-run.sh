#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Griffty — Cloud Run & Firebase Deployment Script
# Project: griffty (Google Cloud & Firebase)
# ==============================================================================

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-griffty}"
REGION="us-central1"
SERVICE_NAME="agent-griffty"

echo "Deploying Agent Griffty to Google Cloud Run (Project: $PROJECT_ID, Region: $REGION)..."

# 1. Ensure GCP project is set
gcloud config set project "$PROJECT_ID"

# 2. Enable necessary APIs
echo "Enabling Cloud APIs (Cloud Run, Cloud Build, Secret Manager, Cloud Scheduler)..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  firestore.googleapis.com

# 3. Build & Deploy to Cloud Run
echo "Building container image and deploying service..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production,GRIFFTY_STORE=firestore,GCLOUD_PROJECT=$PROJECT_ID,OPERATOR_TOKEN=dev-operator-token"

# 4. Get Cloud Run Service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format 'value(status.url)')
echo "✅ Cloud Run Service deployed at: $SERVICE_URL"

# 5. Set up Cloud Scheduler to run autonomous cycles every 15 minutes
echo "Configuring Cloud Scheduler 15-minute autonomous heartbeat..."
gcloud scheduler jobs create http griffty-cycle-trigger \
  --schedule="*/15 * * * *" \
  --uri="${SERVICE_URL}/api/cycle" \
  --http-method=POST \
  --headers="Authorization=Bearer dev-operator-token" \
  --location="$REGION" || \
gcloud scheduler jobs update http griffty-cycle-trigger \
  --schedule="*/15 * * * *" \
  --uri="${SERVICE_URL}/api/cycle" \
  --http-method=POST \
  --headers="Authorization=Bearer dev-operator-token" \
  --location="$REGION"

echo "✅ Deployment complete! Griffty is now operating 24/7 on Cloud Run."
