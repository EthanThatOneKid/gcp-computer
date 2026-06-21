# Google Cloud Platform (GCP) Deployment Guide

Legacy guide. The current deployment path is Vercel: [docs/vercel-deployment-guide.md](vercel-deployment-guide.md).

For production, keep `APP_MODE=prod` (the default) and reserve `APP_MODE=local-emulated` for localhost demos.

---

## Technical Overview

- **Hosting Platform:** Google Cloud Run (legacy path)
- **Container Registry:** Google Artifact Registry (Docker images)
- **CI/CD:** GitHub Actions (Builds and pushes the container on push to `main` branch)
- **Database:** Local SQLite (rebuilds ephemerally) or remote SQL (for persistent storage)

---

## Step 1: Initialize Google Cloud Project & APIs

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `gcp-computer-prod`) or select an existing one. Note down your **Project ID**.
3. Open the [Google API Library Console](https://console.cloud.google.com/apis/library) and enable the following APIs:
   - **Cloud Run API** (`run.googleapis.com`)
   - **Artifact Registry API** (`artifactregistry.googleapis.com`)
   - **Compute Engine API** (`compute.googleapis.com`) (required to spin up agent VM sandboxes)

---

## Step 2: Create Service Account for GitHub Actions

To allow GitHub Actions to build and deploy to your GCP project, create a service account with the narrowest required permissions.

1. Go to the [GCP IAM Service Accounts Console](https://console.cloud.google.com/iam-admin/serviceaccounts).
2. Click **Create Service Account** at the top:
   - **Service Account Name:** `github-actions-deployer`
   - **Description:** CI/CD pipeline deployer for gcp-computer.
3. Grant this service account the following roles:
   - **Cloud Run Developer** (or **Cloud Run Admin**): To deploy services to Cloud Run.
   - **Artifact Registry Writer**: To push built Docker images to the registry.
   - **Storage Admin**: Required under the hood to write container layers.
   - **Service Account User**: To deploy resources using the project's default runtime service account.
4. Click **Create** and then **Done**.
5. Click on the newly created service account, go to the **Keys** tab, click **Add Key** > **Create New Key**, select **JSON**, and click **Create**.
   - A JSON file will download to your machine. Keep this file secure; it represents root-like deploy permissions for your project.

---

## Step 3: Register Google OAuth Credentials (Login)

For secure login using Google accounts:

1. Open the [GCP Credentials Console](https://console.cloud.google.com/apis/credentials).
2. Go to the **OAuth Consent Screen** tab:
   - Choose **External** user type.
   - Fill in your app name, support email, and developer email.
   - Save and continue.
3. Go back to the **Credentials** tab, click **Create Credentials** > **OAuth Client ID**:
   - **Application Type:** Web Application
   - **Name:** `gcp-computer-prod`
   - **Authorized JavaScript Origins:** `https://<your-cloud-run-url-here>` (e.g., `https://gcp-computer-xxxxxx-uc.a.run.app`)
   - **Authorized Redirect URIs:** `https://<your-cloud-run-url-here>/api/auth/callback/google`
4. Click **Create**. Copy the **Client ID** and **Client Secret**.

---

## Step 4: Configure GitHub Actions Secrets

Add the secrets to your GitHub repository so the deployment workflow can access them securely.

1. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New Repository Secret** and add the following:

| Secret Name | Description | Example / Format |
| :--- | :--- | :--- |
| `GCP_SA_KEY` | The entire content of the downloaded service account JSON key file. | `{ "type": "service_account", ... }` |
| `GCP_PROJECT_ID` | Your GCP Project ID. | `gcp-computer-dev` |
| `NEXTAUTH_SECRET` | A secure random key for signing NextAuth JWT sessions. | A 32+ character random string |
| `NEXTAUTH_URL` | The URL of your deployed app. | `https://gcp-computer.vercel.app` |
| `GEMINI_API_KEY` | Your Google Gemini API Key. | `AIzaSy...` |

---

## Step 5: Deploy the Code

1. Push your code to the `main` branch:
   ```bash
   git push origin main
   ```
2. Navigate to the **Actions** tab in your GitHub repository.
3. You will see the **Deploy to Google Cloud Run** workflow starting. The workflow will:
   - Check out the repository.
   - Log in to your GCP account.
   - Automatically create the Artifact Registry repository (`gcp-computer-repo` in `us-central1`).
   - Build the container using the multi-stage [Dockerfile](file:///C:/Users/ethan/Documents/GitHub/gcp-computer/Dockerfile) optimized for Next.js standalone.
   - Push the image to the registry.
   - Deploy the container to Google Cloud Run.
4. When finished, the live app URL should be `https://gcp-computer.vercel.app/`.

---

## Step 6: Persisting the SQLite Database

Cloud Run is **stateless** and **serverless**. When no requests come in, your application containers scale to zero. When they scale up again, they spin up fresh instances, meaning any changes to the local `database.db` SQLite file are lost.

### Option A: Use a Cloud Database (Recommended)
Switch your database backend to a managed cloud service.
1. Create a serverless database on **Supabase**, **Neon**, **Vercel Postgres**, or **Google Cloud SQL (Postgres)**.
2. In [index.ts](file:///C:/Users/ethan/Documents/GitHub/gcp-computer/src/db/index.ts), replace the local `node:sqlite` connection with a Postgres client (e.g., `pg` or `postgres`).
3. Inject the connection string secret in your GitHub Actions env/variables config:
   `DATABASE_URL=postgres://user:password@host/db`

### Option B: Mount a Network Drive (GCS FUSE)
You can mount a **Google Cloud Storage (GCS)** bucket directly as a container volume:
1. Create a GCS bucket (e.g. `gcp-computer-db-bucket`) in the same region (`us-central1`).
2. Go to the Cloud Run console, select your service, click **Edit & Deploy New Revision**:
   - Go to **Volumes** > **Add Volume** > select **Cloud Storage Bucket**.
   - Name it `db-volume` and select your bucket.
   - Under **Container Mounts**, mount the volume to `/app/data`.
3. Update your local configuration so the SQLite client reads/writes to `/app/data/database.db` instead of the root folder.
