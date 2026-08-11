# Stone Crafters Project Intake Form

Custom customer-facing project intake form for Stone Crafters.

## Architecture

- Front end: `public/index.html`
- Secure API: `src/index.js`
- Hosting/runtime: Cloudflare Workers with static assets
- CRM destination: monday.com Leads & Sales → New Leads

## Secret

Create a Cloudflare Worker secret named `MONDAY_API_TOKEN`. Never put the Monday token in this repository or in `public/index.html`.

## Deploy

Cloudflare build command:

```text
exit 0
```

Deploy command:

```text
npx wrangler deploy
```
