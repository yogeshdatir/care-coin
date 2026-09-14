# CloudFront + S3 Deployment Guide

Adds HTTPS, CDN, and a cleaner URL on top of the existing S3 static hosting setup. Assumes `s3-deployment-guide.md` (S3 + GitHub Actions) is already done.

## Prerequisites
- S3 bucket already deployed and working (see `s3-deployment-guide.md`)
- `dist/` contents uploaded to bucket root (confirm `index.html` sits at the root, not nested)

---

## 1. Certificate Decision

| Option | When |
|---|---|
| Use default `*.cloudfront.net` domain | No custom domain — free HTTPS included automatically, no ACM cert needed |
| Request ACM certificate | Only if using a custom domain (e.g. `yourname.dev`) |

For a portfolio without a custom domain: **skip ACM**, proceed to Step 2.

---

## 2. Create CloudFront Distribution

| Step | Action |
|---|---|
| 2.1 | AWS Console → **CloudFront** → **Create distribution** |
| 2.2 | **Origin domain** → select the S3 **bucket** option (not the website-endpoint URL), even if AWS suggests using the website endpoint |
| 2.3 | **Origin access** → **Origin access control settings (recommended)** → **Create new OAC** → accept defaults |
| 2.4 | **Viewer protocol policy** → **Redirect HTTP to HTTPS** |
| 2.5 | **Default root object** → `index.html` |
| 2.6 | Cache policy → `CachingOptimized` (default) |
| 2.7 | Web Application Firewall (WAF) → **Do not enable** (unnecessary cost for a static site) |
| 2.8 | Name/description → optional, for your own reference |
| 2.9 | **Create distribution** → wait for status to change from "Deploying" to **Enabled** (5–15 min) |

---

## 3. Update S3 Bucket Policy (OAC)

| Step | Action |
|---|---|
| 3.1 | Distribution → **Origins** tab → select your origin → **Edit** |
| 3.2 | Look for banner: *"The S3 bucket policy needs to be updated"* → click **Copy policy** |
| 3.3 | S3 bucket → **Permissions** → **Bucket Policy** → **replace entirely** (remove any old public `Principal: "*"` policy) → paste copied policy → **Save** |
| 3.4 | S3 bucket → **Permissions** → **Block public access** → re-enable **Block all public access** (bucket is now private, served only via CloudFront/OAC) |

Example of the correct policy shape (values differ per bucket/distribution):

```json
{
  "Version": "2008-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

> Note: `2008-10-17` is a valid, older IAM policy version — leave it as CloudFront generated it, don't change it to `2012-10-17`.

---

## 4. Disable S3 Static Website Hosting

No longer needed — CloudFront now serves the content via the S3 REST endpoint (OAC), not the website endpoint.

| Step | Action |
|---|---|
| 4.1 | S3 bucket → **Properties** tab |
| 4.2 | **Static website hosting** → **Edit** → **Disable** → **Save changes** |

---

## 5. Fix Client-Side Routing (React Router refresh/deep-link issue)

**Problem:** Refreshing a nested route (e.g. `/countries/AFG`) returns Access Denied/403, because S3 has no actual file at that path — only `index.html` + client-side routing knows about it.

| Step | Action |
|---|---|
| 5.1 | Distribution → **Error pages** tab → **Create custom error response** |
| 5.2 | HTTP error code: `403` → Customize error response: **Yes** → Response page path: `/index.html` → HTTP response code: `200` |
| 5.3 | Repeat for HTTP error code `404` → same settings (`/index.html`, response code `200`) |
| 5.4 | Save → wait a few minutes for propagation |

This must be done for both `403` and `404` — S3 returns different error codes depending on the bucket/policy configuration, and both need to fall back to `index.html`.

---

## 6. Verify

| Check | Expected |
|---|---|
| `https://xxxxxxxx.cloudfront.net/` (root) | Loads app |
| `https://xxxxxxxx.cloudfront.net/index.html` | Loads app |
| Refresh on a nested route (e.g. `/countries/AFG`) | Loads app correctly, not Access Denied |
| Browser address bar | Shows secure padlock (HTTPS) |

---

## 7. Cache Invalidation in GitHub Actions

CDN caches files at edge locations — without invalidation, users may see stale content after a new deploy.

**Add GitHub Secret:**

| Secret Name | Value |
|---|---|
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront console → your distribution → "ID" column |

**Update `.github/workflows/deploy.yml`** — add after the `s3 sync` step:

```yaml
      - run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET_NAME }} --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### Required IAM Permission

The deploy IAM user needs CloudFront invalidation permission, or this step fails with `AccessDenied`.

| Option | Action |
|---|---|
| Quick fix | IAM → Users → your deploy user → **Add permissions** → attach managed policy `CloudFrontFullAccess` |
| Scoped (more secure) | Attach a custom inline policy instead: |

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
    }
  ]
}
```

`--paths "/*"` invalidates everything — simplest for a small static site (free tier: 1,000 invalidation paths/month).

---

## Common Issues Encountered

| Issue | Cause | Fix |
|---|---|---|
| Access Denied on root/any path right after setup | Distribution still "Deploying", or OAC not linked on origin | Wait for **Enabled** status; confirm Origins tab shows OAC selected |
| Access Denied only on nested routes after refresh | S3 has no file at that path (client-side routing) | Custom error responses (Step 5) — 403 and 404 both → `/index.html`, code `200` |
| Access Denied even with correct OAC policy | Old public bucket policy statement (`Principal: "*"`) still present, or Block Public Access silently blocking it | Replace bucket policy entirely with only the CloudFront-generated statement |
| `cloudfront:CreateInvalidation` AccessDenied in GitHub Actions | Deploy IAM user has no CloudFront permissions | Attach `CloudFrontFullAccess` or scoped inline policy (Step 7) |
| MSW requests not visible in Network tab | DevTools/Service Worker session quirk | Check "All" filter instead of "Fetch/XHR"; confirm via Console logs and Application → Service Workers. If still not showing, close and reopen the browser tab — resolved it in practice |

---

## Production Hardening

See `s3-deployment-guide.md` — tracked there, not duplicated here.

---

## References
- [Video title](URL) — what it covers
