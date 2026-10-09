/**
 * /b/<id> — the short business link the apps already claim.
 *
 * It 404'd. The mobile app's intent filters and the deep-link parser both
 * route /b/<id> to a business, so the app has been claiming an address the
 * website did not serve: a guest without the app installed, tapping a link
 * the app generated, landed on a dead page.
 *
 * Redirects to the canonical /listing/<slug> rather than rendering a second
 * copy of the page. One address per business is the rule the slug work exists
 * to protect, and two pages rendering the same listing is how a shared link
 * and a Google result end up disagreeing.
 *
 * Permanent, because the slug is the address we want people to keep.
 */
import { redirect, notFound } from "next/navigation";
import { resolveListing } from "@/lib/listings";

export const revalidate = 3600;

export default async function ShortBusinessLink(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let resolved: Awaited<ReturnType<typeof resolveListing>> = null;
  try {
    resolved = await resolveListing(id);
  } catch {
    // A lookup failure is not a missing business. Falling through to the
    // listing page lets it try again client-side rather than telling somebody
    // their link is dead because Firestore blinked.
    resolved = null;
  }
  if (!resolved) notFound();
  redirect(`/listing/${resolved.slug || id}`);
}
