# fleet-waitlist-widget

Drop-in React waitlist form for [Fleet](https://github.com/BiscayneDev/fleet). Posts to your server, which calls [`fleet-waitlist-submit`](../waitlist-submit) and commits the signup to your vault repo.

## Install

```bash
npm install fleet-waitlist-widget
```

## Use

```tsx
import { FleetWaitlist } from 'fleet-waitlist-widget'

<FleetWaitlist
  submitTo="/api/waitlist"
  product="inference"
/>
```

That's the minimum. The form renders an email input, a submit button, and a hidden honeypot field. On success it swaps to "You're on the list."

## What your server needs to do

The widget POSTs `{ product, email, name?, context?, source, honeypot }` to `submitTo`. Your route should call `fleet-waitlist-submit`:

```ts
// app/api/waitlist/route.ts (Next.js example)
import { submit } from 'fleet-waitlist-submit'

export async function POST(req: Request) {
  const body = await req.json()
  const result = await submit({
    githubToken: process.env.GITHUB_TOKEN!,
    vaultRepo: 'biscaynedev/halsey-vault',
    product: body.product,
    email: body.email,
    name: body.name,
    context: body.context,
    source: body.source,
    honeypot: body.honeypot,
  })
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 })
  }
  return Response.json({ ok: true })
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `submitTo` | `string` | — | Your endpoint path. Required. |
| `product` | `string` | — | Product slug. Required. |
| `buttonLabel` | `string` | `"Join waitlist"` | |
| `placeholder` | `string` | `"you@company.com"` | |
| `successMessage` | `string` | `"You're on the list."` | |
| `showNameField` | `boolean` | `false` | |
| `showContextField` | `boolean` | `false` | |
| `source` | `string` | `"widget"` | Stored in the signup file's frontmatter. |
| `className` | `string` | — | Applied to form root (and success state if no `successClassName`). |
| `inputClassName` | `string` | — | Applied to each input/textarea. |
| `buttonClassName` | `string` | — | Applied to submit button. |
| `successClassName` | `string` | — | Applied to the success message div. |
| `errorClassName` | `string` | — | Applied to the error alert. |
| `style` | `CSSProperties` | — | Inline style on the form root. |
| `onSuccess` | `(email) => void` | — | Fires after successful submit. |
| `onError` | `(error) => void` | — | Fires on validation/network error. |

## Styling

The widget ships **unstyled by default** — it works with any design system. Use the `className` props to slot in Tailwind, CSS modules, or whatever you have:

```tsx
<FleetWaitlist
  submitTo="/api/waitlist"
  product="inference"
  className="flex gap-3 items-center"
  inputClassName="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
  buttonClassName="rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 font-semibold text-zinc-900"
  successClassName="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-emerald-300"
  errorClassName="text-rose-400 text-sm mt-2"
/>
```

## Honeypot

The widget includes a hidden `website` field positioned off-screen and `aria-hidden`. Bots fill it; humans don't. Your server forwards it to `fleet-waitlist-submit` as `honeypot`, which silently drops the submission if it's non-empty.

For higher-stakes forms, layer your own Turnstile/hCaptcha on top in the API route.

## Related

- [Fleet](https://github.com/BiscayneDev/fleet) — local-first GTM brain
- [fleet-waitlist-submit](../waitlist-submit) — the server-side helper this widget targets

## License

MIT © Halsey Huth
