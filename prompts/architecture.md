I found the source of the runtime error.

File:
`app/dashboard/page.tsx`

Around line 269 there is:

```tsx
<div className="mt-2" onClick={e => e.preventDefault()}>
```

This is inside a Server Component, which is why Next.js throws:

```
Event handlers cannot be passed to Client Component props.
```

Please fix this correctly.

Requirements:

* Remove the `onClick` from `app/dashboard/page.tsx`.
* If that interaction is actually needed, move that section into a dedicated Client Component with `"use client"`.
* Do **not** convert the entire dashboard page into a Client Component.
* If the `onClick` only exists to stop navigation or prevent default behavior, replace it with a non-JavaScript solution instead.
* After fixing, verify that `npm run dev` loads `/dashboard` without any runtime errors.
* Explain why the `onClick` was there and what you changed.
