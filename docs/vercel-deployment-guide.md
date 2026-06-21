# Vercel Deployment Guide

This is the current deployment path for `gcp-computer`.

Live demo: `https://gcp-computer.vercel.app/`

## What You Need
- A Vercel account
- A Neon Postgres database
- These environment variables:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `GEMINI_API_KEY`
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if you want Google login

## Step 1: Create the Vercel Project
1. Open `https://vercel.com/new`.
2. Import the GitHub repo `gcp-computer`.
3. Keep the default build settings.

## Step 2: Add Environment Variables
1. Open your Vercel project.
2. Go to `Settings` > `Environment Variables`.
3. Add the variables listed above.
4. Set `NEXTAUTH_URL` to `https://gcp-computer.vercel.app/`.

## Step 3: Connect Neon
1. Open Neon and create a Postgres database.
2. Copy the connection string.
3. Paste it into Vercel as `DATABASE_URL`.

## Step 4: Deploy
1. Trigger a deploy from Vercel or push to `main`.
2. Wait for the build to finish.
3. Open `https://gcp-computer.vercel.app/`.

## Local Dev
For localhost demos, use `APP_MODE=local-emulated` in `.env`.
