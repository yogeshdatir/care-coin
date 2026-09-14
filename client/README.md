# Project Name

One-line description of what it does.

🔗 **Live demo:** https://YOUR-CLOUDFRONT-URL.cloudfront.net
📦 **Repo:** this repo

![screenshot](./docs/screenshot.png)

## Stack

Vite · React · TypeScript · Tailwind CSS · shadcn/ui · MSW · Vitest/RTL · React Router · GitHub Actions · AWS S3 · CloudFront

<!-- Add/remove per project, e.g. backend framework if full-stack -->

## Concepts & Patterns Used

| Pattern | Skills Demonstrated | Where |
| ------- | ------------------- | ----- |
|         |                     |       |

<!--
Fill one row per pattern actually used in this project.
Only list what's real — don't carry over patterns from other projects.
Full pattern write-ups (what/when/tradeoff) go in this project's own PATTERNS.md, not here.
-->

## Key Features

-
-
-

## Tradeoffs

- **Decision:** why this approach was chosen over an alternative, and what it costs.

## Known Limitations

<!-- e.g. free-tier backend cold start, no auth, etc. Only include if genuinely relevant. -->

## Deployment

- **CI/CD:** GitHub Actions builds on every push to `main` and syncs to S3
- **Hosting:** AWS S3 (private, OAC-secured) behind CloudFront for HTTPS + CDN
- **Routing fix:** CloudFront custom error responses (403/404 → `index.html`) support client-side routing on refresh/deep-link
- **Cache invalidation:** CloudFront cache invalidated automatically on each deploy
<!-- Add backend deployment details here if full-stack -->

## Running Locally

```bash
yarn install
yarn dev
```

## Testing

```bash
yarn test
```

Covers: <!-- list what's tested -->. Skipped: <!-- list what's intentionally not tested, and why -->.
