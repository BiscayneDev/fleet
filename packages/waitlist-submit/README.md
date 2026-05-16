# fleet-waitlist-submit

Server-side helper that commits waitlist signups as markdown to a developer's vault repo on GitHub. Part of the [Fleet](https://github.com/BiscayneDev/fleet) GTM toolkit.

## How it fits

```
Visitor's browser
  └─ <form> on your landing page
       └─ POST to YOUR API route
            └─ fleet-waitlist-submit (this package)
                 └─ GitHub commit → your vault repo
                      └─ Fleet (running locally) sees the file,
                         matches against your contacts, notifies you
```

The submission flow is **markdown-first**: the signup IS a file in your vault, not a row in a DB that maps to a file. No third-party form service required.

## Install

```bash
npm install fleet-waitlist-submit
```

## Use

```ts
// app/api/waitlist/route.ts (Next.js example)
import { submit } from 'fleet-waitlist-submit'

export async function POST(req: Request) {
  const body = await req.json()

  const result = await submit({
    githubToken: process.env.GITHUB_TOKEN!,    // PAT with contents:write
    vaultRepo: 'biscaynedev/halsey-vault',     // owner/repo
    product: 'inference',                       // your product slug
    email: body.email,
    name: body.name,
    context: body.context,
    source: 'web-form',
    honeypot: body.website,                     // see "Spam protection" below
  })

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }
  return Response.json({ ok: true })
}
```

## API

```ts
submit({
  githubToken: string,        // GitHub PAT with contents:write on the vault repo
  vaultRepo: string,          // "owner/repo"
  vaultBranch?: string,       // defaults to repo's default branch
  product: string,            // lowercase letters, numbers, dashes
  email: string,              // RFC-ish validated
  name?: string,
  context?: string,
  source?: string,
  honeypot?: string,          // if non-empty, silently discards
}) => Promise<SubmitResult>
```

Returns `{ ok: true, signupId, commitSha, path }` on success, `{ ok: true, discarded: true }` on honeypot hit, or `{ ok: false, error }` on validation/API failure.

## What it writes

A new file at `waitlists/<product>/signups/<timestamp-random>.md` in your vault repo:

```yaml
---
id: 2026-05-16T14-32-19-987Z-3f4a8c2d1e
product: inference
email: chris@usepod.ai
name: Chris G
source: web-form
createdAt: 2026-05-16T14:32:19.987Z
---

Building agent infra
```

Emails are normalized (lowercase, trimmed, `+alias` stripped) before storage to match Fleet's matcher convention.

## Spam protection

- **Honeypot:** Add a hidden form field (e.g. `<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px">`). Bots fill it; humans don't. Pass it as `honeypot`. Filled means silent discard — bots don't learn they're caught.
- **Rate limit at your API route**, not in this package. Helper has no opinion on that.
- For high-volume forms, add Turnstile/hCaptcha in your handler and only call `submit()` after verification.

## GitHub token scope

Create a fine-grained PAT at <https://github.com/settings/tokens?type=beta> with:
- Repository access: only the vault repo
- Permissions: **Contents: read and write**

Store it as `GITHUB_TOKEN` in your server's env. **Never expose it client-side.**

## Related

- [Fleet](https://github.com/BiscayneDev/fleet) — the local-first GTM brain that watches your vault and runs match logic
- [fleet-waitlist-widget](../waitlist-widget) — drop-in React form that posts to your handler

## License

MIT © Halsey Huth
