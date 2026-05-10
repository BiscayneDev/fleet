# Fleet

Local-first GTM intelligence for founders. Capture research links and notes, let an LLM enrich them into a structured wiki, and use a chat agent to turn that intelligence into go-to-market deliverables (positioning, competitive analysis, launch plans).

Everything runs on your own machine — projects, wikis, and network data live on disk under `./data/`. There's no database, no hosted backend, and no account to create.

## Quick start

```bash
git clone https://github.com/biscaynedev/fleet.git
cd fleet
nvm use            # optional, picks up the Node version from .nvmrc
npm install
npm run dev
```

Open <http://localhost:3000>.

That's it. With no `.env.local` file the app uses a built-in mock LLM adapter so you can click through the full UI — create a project, capture a link, watch it land in the wiki — without configuring any API keys.

## Enable real LLM enrichment

When you're ready for live enrichment from a real model, copy the example env file and fill in an API key:

```bash
cp .env.local.example .env.local
# edit .env.local, set LLM_WIKI_API_KEY
npm run dev
```

Fleet talks to any OpenAI-compatible chat completions endpoint. The default points at [Nous Research](https://inference-api.nousresearch.com); change `LLM_WIKI_BASE_URL` to use OpenAI, OpenRouter, a local Ollama server, or anything else that speaks the same protocol.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `LLM_WIKI_ADAPTER` | no | `mock` | `mock` for offline/demo, `real` for live enrichment |
| `LLM_WIKI_API_KEY` | when adapter is `real` | — | API key for the LLM provider |
| `LLM_WIKI_BASE_URL` | no | Nous Research endpoint | OpenAI-compatible base URL |
| `LLM_WIKI_MODEL` | no | `deepseek-v3` | Model name to send to the provider |
| `FLEET_DATA_ROOT` | no | `./data` | Where Fleet stores projects, wikis, inbox, and network data |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000 with hot reload |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint, fails on any warning |
| `npm test` | Vitest unit suite (`tests/unit/`) |
| `npm run test:e2e` | Playwright end-to-end suite (`tests/e2e/`), boots its own dev server on port 3100 |

## Where your data lives

Fleet writes everything under `./data/` (gitignored). The layout:

```
data/
├── Projects/
│   └── <slug>/
│       ├── brief.md                # project frontmatter + body
│       ├── wiki/<page-slug>.md     # enriched research pages
│       └── artifacts/              # generated GTM deliverables
├── Inbox/<id>.json                 # captured links/notes
└── Network/                        # imported LinkedIn / Twitter data
```

Directories are created on demand, so a fresh checkout has no `data/` until you start using the app. To reset to a clean slate, delete `./data/`. To store data elsewhere — e.g. on an external drive or in a synced folder — set `FLEET_DATA_ROOT` to an absolute path.

## Project structure

```
src/
├── app/
│   ├── (fleet)/         # Authenticated app routes (home, projects, wiki, network, inbox)
│   ├── api/             # Next.js route handlers
│   ├── layout.tsx
│   └── page.tsx         # Landing page
└── lib/
    ├── fs/              # On-disk stores (projects, wiki, inbox, artifacts, network)
    ├── llm-wiki/        # LLM enrichment: scraper, prompts, mock + real adapters
    ├── gtm/             # GTM domain logic
    ├── network/         # LinkedIn / Twitter parsers
    ├── autoresearch/    # Background research pipeline
    └── fleet/           # Shared types and schemas
tests/
├── unit/                # Vitest
└── e2e/                 # Playwright
docs/                    # Implementation plans
```

## Requirements

- Node.js **20.9+** (Next.js 16 baseline)
- npm 10+

A `.nvmrc` is included — `nvm use` from the repo root picks the right version.

## License

[MIT](./LICENSE)
