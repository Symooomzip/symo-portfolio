# Mohammed Fakir — Portfolio

Personal portfolio showcasing my work in Data Science, AI, and Full Stack Development.

## Live website

[View the live portfolio](https://symo-portfolio.pages.dev/)

## Built with

- React and TypeScript
- Vite
- Tailwind CSS
- GSAP and Motion
- Three.js

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Deployed on Cloudflare Pages with automatic deployments from the `main` branch.

## Portfolio assistant (chatbot)

A floating assistant answers questions about Mohammed, grounded only in
`functions/_kb.ts`. It runs on Cloudflare Workers AI through a Pages Function at
`functions/api/chat.ts` — there is no API key anywhere in the repo or the client.

To edit what the bot knows, edit `functions/_kb.ts`. Facts that are not in there
are deliberately answered with "I don't have that — email Mohammed".

### Running it locally

```bash
npm run dev        # UI only — /api/chat 404s, the widget shows its offline card
npm run dev:full   # UI + Functions on http://localhost:8788
```

`npm run dev:full` reads `.dev.vars` (gitignored). Set `CHAT_MOCK=1` there to get
canned replies without spending Workers AI neurons, or `CHAT_MOCK=error_timeout`
/ `error_rate_limited` / `error_ai_unavailable` to exercise each failure path.
Comment it out to hit the real model (needs `wrangler login`).

### Two dependencies that live in the Cloudflare dashboard, not in this repo

Neither is visible in the code, and the bot silently falls back to its offline
card if the first one is missing:

1. **Workers AI binding** — Pages project → Settings → Functions → Bindings → add
   a Workers AI binding named `AI`. Add it to **Production and Preview
   separately**, then redeploy: bindings only apply to deployments created after
   they were added.
2. **Rate-limiting rule** — a WAF rule on `http.request.uri.path eq "/api/chat"`,
   8 requests / 60s per IP. The free plan includes one rule.
