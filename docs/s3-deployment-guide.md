# S3 + GitHub Actions Deployment Guide

Reference guide for deploying a Vite + React app to an S3 bucket via GitHub Actions CI/CD.

## Prerequisites
- Vite + React app with `yarn build` producing a `dist/` folder
- An S3 bucket already created
- AWS account access

---

## 1. Configure S3 Bucket for Static Hosting

| Step | Action |
|---|---|
| 1.1 | S3 bucket → **Properties** → enable **Static website hosting** |
| 1.2 | Set index document to `index.html` |
| 1.3 | S3 bucket → **Permissions** → **Block public access** → uncheck all 4 boxes → save (required before a public bucket policy can take effect) |
| 1.4 | S3 bucket → **Permissions** → **Bucket Policy** → paste policy below |

### Bucket Policy

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `Version: 2012-10-17` | Fixed IAM policy language version — not a real-world date, always use this exact string |
| `Principal: "*"` | Public access |
| `Action: s3:GetObject` | Read-only — visitors can view files, not upload/delete |
| `Resource: .../*` | Applies to all objects in the bucket |

---

## 2. Create an IAM User for GitHub Actions

| Step | Action |
|---|---|
| 2.1 | AWS Console → **IAM** → **Users** → **Create user** |
| 2.2 | Name it (e.g. `github-actions-deploy`) → **Next** |
| 2.3 | Permissions options → **Attach policies directly** |
| 2.4 | Search and check `AmazonS3FullAccess` → **Next** → **Create user** |
| 2.5 | Open the new user → **Security credentials** tab |
| 2.6 | **Access keys** → **Create access key** |
| 2.7 | Use case: **Application running outside AWS** (or CLI) → **Next** → **Create access key** |
| 2.8 | Copy/download the **Access Key ID** and **Secret Access Key** (secret shown only once) |

> **Note:** `AmazonS3FullAccess` grants access to *all* buckets on the account. For tighter security later, replace with a custom policy scoped to just this bucket's ARN.

> Delete the downloaded credentials CSV locally once secrets are added to GitHub (step 3).

---

## 3. Add GitHub Repository Secrets

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | From IAM access key |
| `AWS_SECRET_ACCESS_KEY` | From IAM access key |
| `AWS_REGION` | Your bucket's region (e.g. `us-east-1`) |
| `S3_BUCKET_NAME` | Your actual bucket name |
| `VITE_API_BASE_URL` | Your deployed backend's URL (e.g. Render API URL) — only needed if the app calls a real API at build time |

> **Note:** Vite only exposes env vars prefixed `VITE_` to client code. Any env var read via `import.meta.env` in the app must use this prefix, both locally (`.env`) and as a GitHub Secret.

---

## 4. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to S3

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: yarn install --frozen-lockfile
      - run: yarn build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET_NAME }} --delete
```

| Detail | Note |
|---|---|
| `node-version: 22` | Required if any dependency (e.g. `react-router@8+`) has a Node engine requirement above 20 |
| `dist/` | Vite's default build output folder |
| `--delete` | Removes stale files in the bucket that no longer exist in the latest build |

---

## 5. Deploy

Push to `main` → GitHub **Actions** tab shows the workflow running → verify files appear in the S3 bucket → visit the S3 static website endpoint to confirm.

---

## Known Limitations of This Setup

| Limitation | Detail |
|---|---|
| HTTP only | S3 static website hosting does not support HTTPS — browsers will flag the site as "Not Secure" |
| URL format | `bucket-name.s3-website-region.amazonaws.com` — not a clean/custom URL |

### Planned Next Step: CloudFront (for HTTPS + cleaner URL)

| Step | Action |
|---|---|
| 1 | CloudFront → Create distribution → Origin: S3 bucket (use S3 origin type, not the website endpoint) |
| 2 | Enable **Origin Access Control (OAC)** |
| 3 | Update S3 bucket policy to allow only CloudFront (OAC) instead of public `*` |
| 4 | Set default root object to `index.html` |
| 5 | (Optional) Attach a custom domain + free ACM certificate |

| Cost | Free tier: 1TB data transfer/month, 10M requests — sufficient for a portfolio site. Default `*.cloudfront.net` URL is free with HTTPS included; a custom domain requires separate registration (~$10–15/yr). |
|---|---|

---

## Production Hardening — Not Yet Implemented

| Item | Current | Enterprise-grade equivalent | Status |
|---|---|---|---|
| IAM auth | Static access keys in GitHub Secrets | OIDC federation (no stored keys) | Planned — next |
| IAM permissions | `AmazonS3FullAccess` / `CloudFrontFullAccess` | Least-privilege, resource-scoped policy | Not scheduled |
| Hosting | ~~S3 static website (HTTP)~~ Done via CloudFront | S3 + CloudFront (HTTPS, CDN) | ✅ Complete (see `cloudfront-deployment-guide.md`) |
| Environments | Single bucket/distribution/branch | Separate dev/staging/prod | Planned — next |
| Cache invalidation | ~~N/A~~ Implemented | CloudFront invalidation on deploy | ✅ Complete (see `cloudfront-deployment-guide.md`) |
| Monitoring | None | CloudWatch alarms, access logs, WAF | Not scheduled |
| Secrets management | GitHub Secrets (manual) | Secrets manager / vault | Not scheduled |

---

## Troubleshooting Notes

| Issue | Cause / Fix |
|---|---|
| `engine "node" is incompatible` in CI | Bump `node-version` in workflow to match the dependency's required Node version |
| `Workspaces can only be enabled in private projects` warning | Non-blocking; check for a stray `workspaces` field in any `package.json` (including nested ones) via `grep -r "\"workspaces\"" --include=package.json .` — safe to ignore if build/deploy succeeds and none is found |
| CORS error calling the deployed API from the CloudFront URL | Backend's allowed-origins list doesn't include the CloudFront domain, has a trailing-slash mismatch, or the CORS code change hasn't been redeployed yet. Add the exact CloudFront domain (no trailing slash) to the backend's CORS allowlist and confirm the deploy went through |
