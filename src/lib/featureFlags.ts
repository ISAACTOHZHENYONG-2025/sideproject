import { notFound } from "next/navigation";

// Group mode works, but is not part of the public site yet: its page, API routes and nav tab are
// all off unless NEXT_PUBLIC_ENABLE_GROUP=true. Set it in .env.local to work on the feature.
// NEXT_PUBLIC_* is inlined at build time, so a production build without it has no group route
// at all rather than a hidden one.
export const groupEnabled = process.env.NEXT_PUBLIC_ENABLE_GROUP === "true";

// Call at the top of a group page or route handler: 404s when the feature is off.
export function requireGroupEnabled(): void {
  if (!groupEnabled) notFound();
}
