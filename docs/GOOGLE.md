# Google integration

Project: **`griffty`**. Store: Firestore when `GRIFFTY_STORE=firestore`.

## Auth

```bash
gcloud config set project griffty
gcloud auth application-default login
gcloud services enable firestore.googleapis.com secretmanager.googleapis.com googleads.googleapis.com cloudscheduler.googleapis.com
```

Do **not** commit service-account JSON. Put a key file path in `GOOGLE_APPLICATION_CREDENTIALS` locally only.

## Firestore

- Database: default, in project `griffty`
- Rules: `infra/firestore.rules` (client writes denied)
- Emulator: `firebase emulators:start --config infra/firebase.json`

```bash
GRIFFTY_STORE=firestore GCLOUD_PROJECT=griffty npm run sandbox
```

## Secret Manager

`loadGoogleSecret(NAME)` reads `process.env[NAME]` first, then `projects/griffty/secrets/NAME`.

Suggested secrets: `XAI_API_KEY`, `OPERATOR_TOKEN`, `GOOGLE_ADS_DEVELOPER_TOKEN`.

## Google Ads (read-only)

Flag `CONNECTOR_ADS_GOOGLE=true` plus:

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID` (optional; lists accessible customers if omitted)

`GET /api/google/status` probes the official Ads API. It does **not** raise budgets.

## Scheduler

15-minute cycles belong on **GCP Cloud Scheduler / Cloud Functions**, not Grok Build.

`grokBuildLoops` is frozen **false**.
