## Export Software Frontend

Built on top of [fe-zen-arch](git@github.com:shivamkj/fe-zen-arch.git) — the core shared architecture for B2B SaaS frontends.

### Libraries

- **React** [Docs](https://react.dev/reference/react)
- **Tailwind CSS** [Docs](https://tailwindcss.com/docs/installation)
- **React Query** [Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- **React Hook Form** [Docs](https://www.react-hook-form.com/get-started)
- **Zustand** [Docs](https://zustand.docs.pmnd.rs/)

### Setup

```bash
pnpm install   # fe-zen-arch is included as a git submodule, init it first if missing
pnpm dev       # dev server on port 5173
pnpm lint      # prettier + tsc + eslint (fe-zen-arch lint pipeline)
pnpm build     # production build
```

### Notes

- `core`, `ui`, `auth`, `icons` are fe-zen-arch workspace packages, aliased via tsconfig paths & vite aliases.
- Forms are built directly with `useForm` from `core/form` + `Form` / `SubmitButton` from `core/form/components` — no generic form templates.
- Routing uses fe-zen-arch's zustand router: routes defined in `src/shared/routes.tsx`, paths in `src/shared/route-paths.ts`.
- Auth uses the fe-zen-arch auth module (routes, interceptors, login pages) out of the box.
- API base URL comes from `PUBLIC_API_URL` (`.env`).
- Don't use react-query mutation for react-hook-form submit handler.
- For HMR (hot refresh), the file must export only react component, and not any other constant or object.
- While most input elements use `...register('name')`, custom elements like select require `<Select<T> name="name" />` instead.

## What I changed

The starter worked, but everything lived in one 1,600-line form file and the form read its data straight from a store. I kept the screens and features the same and reorganised how the code is built.

### How it's structured now

**Services.** All data goes through `src/shipping-bills/services/`. There are three of them: bills, parties (exporters, consignees and their branches) and reference data (ports, countries, document types, marks and numbers). Every function returns a Promise and waits a short, fake delay. Errors are a small `ServiceError` with a code (`NETWORK`, `NOT_FOUND` or `VALIDATION`) so the UI can say something useful. The localStorage store sits behind these services and nothing else imports it. To plug in a real API, you'd change the function bodies in that folder and the components wouldn't need to change.

**Loading and errors.** Reads use `useQuery` from `core/react-query`. The dashboard, the bill page and the party lookups all show loading, empty and error states, with a Retry button where it makes sense. The app's default `staleTime` is `Infinity`, so I set `staleTime: 0` on the dashboard and the bill page, and saving invalidates the bills query. Saving itself is a normal async function, not a mutation, because the notes above say not to use a mutation for the form submit. If a save fails, the user sees a toast. "Save & Next" saves a draft and won't move to the next tab if that fails.

**Validation.** The rules are small pure functions in `validation.ts`, hooked into the schema with `refine`. I checked `fe-zen-arch` first: `refine` gets the whole form as its second argument, which is what makes rules like "net weight can't be more than gross weight" possible.

**Splitting the code.** The form file is now about 800 lines. I pulled out the async select, the party fields, the invoice editor, the document row and the invoice charges. The four copy-pasted Freight/Insurance/Commission/Discount rows became one `ChargeRow` component. `model.ts` became a `model/` folder (types, reference data, factories, calculations and one payload mapper), and its `index.ts` re-exports everything so no imports had to change. Files that export components only export components, because the lint rule for hot refresh requires it.

**Removed.** The old API client had a hardcoded LAN IP and auth header and quietly fell back to fake data when the request failed, so errors never showed. I deleted it, along with the old party mock service.

### Bugs I found while doing this

- A line used `invoice.items[index]` where it should have been `itemIndex`.
- Loading port names never showed up, because the lookup only searched the non-Indian port list.
- Bills saved from the form had no exporter or consignee name, so the dashboard showed dashes.
- A failed save was only logged to the console, so the user always saw success.

### Validation rules and assumptions

I don't have a customs background, so I read up a little and made these assumptions:

- Net weight can't be more than gross weight.
- The port of loading must be an Indian port (code starts with `IN`), and the destination can't be the same port.
- An invoice date can't be after the job date.
- The RITC / HS code is 8 digits.
- A container number is 4 letters followed by 7 digits. I only check the format, not the check digit.
- If there's an RBI waiver number, the waiver date is required.
- In a packing range, "to" can't be lower than "from".
- Quantity and unit price must be above zero.

### Things that don't work yet

- Cross-field rules only run on submit. If you change the gross weight after the net weight, the net weight isn't re-checked until you save. That's down to how `fe-zen-arch` attaches rules to fields.
- I don't check that the invoice total matches the sum of the items.
- A charge row should have either a rate or an amount. The UI disables the other field, but the schema doesn't enforce it.
- The `.sb` flat file is a simplified version, not a certified ICEGATE format.
- The "Draft" badge on the dashboard is always "Draft".
- There's no test runner and I couldn't add dependencies, so `validation.ts` and `flat-file.ts` have no unit tests, even though they'd be easy to test.
- Lint still shows about 270 spell-check warnings for domain words like ROSCTL. They're warnings, not errors.

### Seeing the error states

Run this in the browser console and the mock services start failing:

    localStorage.setItem('mock:fail', '1')

The dashboard and the bill page then show an error with Retry, party dropdowns show an inline error, and Save shows a failure toast. Turn it off with:

    localStorage.removeItem('mock:fail')

### How I checked it

`pnpm lint-check` (prettier, tsc and eslint) and `pnpm build` both pass. I also used the app myself in the browser. I opened a new bill and an existing one, saved bills and reopened them, and tried the validation messages (for example net weight 50 with gross weight 34.6). To see the error states I turned on the failure switch from the section above.

## AI Usage & Approach

I used Claude in the browser chat. I pasted in the starter files and asked it to review them, and then we went through the refactor one step at a time: the services first, then the dashboard and form on `useQuery`, then the party dialogs, the validation, the lint fixes, and last the split of the form and the model. Claude wrote most of the code and I ran it and checked the result. Changes went in as small patch scripts that look for the exact lines they expect and stop without writing anything if one is missing. I committed after every step so I could go back if something broke.

I didn't want to just trust it, so before using its suggestions I read the parts of `fe-zen-arch` they depended on: `core/react-query`, `ui/form` and the schema builder. That is how I found out that `refine` receives the whole form as a second argument, and that the default `staleTime` is `Infinity`, which is why saving has to invalidate the bills query. I kept saving as a plain async function and not a mutation, because the notes in this README say not to use a mutation for the form submit. I also tried the validation rules myself in the browser to see them fire, instead of assuming they did.

Some things went wrong along the way:

- I ran `pnpm lint`, which auto-fixes, and it broke four files. The fix left a stray `=>` behind and eslint reported parse errors. I restored those files from git and rewrote the helpers by hand as normal functions.
- One patch left a literal `$1` in the form. `tsc` caught it as a syntax error and I fixed it.
- Another patch script crashed on its first run because its helper only accepted regular expressions. It wrote nothing, which is the reason for the checks.
- At one point I was told lint was probably clean because a filtered command printed nothing. The real exit code showed 57 errors. After that I only trusted the exit code and the error count.
- My first `ChargeRow` file exported a constant next to a component and broke the hot refresh lint rule, so the constant now lives in its own file.

What I took from this is that AI output has to be checked by tools and by actually using the app. A result that looks clean isn't proof that it is. It also helps to read how a framework really works before writing code against it.
