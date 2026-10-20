// OPENING A SCREEN, WHEN IT IS NOT A NAVIGATION.
//
// Next wraps page navigations in a view transition, which is what makes a
// listing come out of the card you tapped. A room does not navigate: it is
// a state change that puts an overlay up, so nothing wraps it and it
// appears instantly with no relation to the thing you touched.
//
// document.startViewTransition is the same API, called by hand. The photo
// in the row and the photo at the top of the room screen share a name, so
// the browser moves one element instead of swapping two.
//
// Pure except for the document call, and it degrades by DOING THE WORK
// ANYWAY: a browser without the API just runs the callback, which is the
// state change, so the screen opens exactly as it did before.

type StartViewTransition = (cb: () => void) => { finished: Promise<void> };

/**
 * Run a state change as a view transition where the browser has one.
 *
 * `name` is put on `el` for the duration and taken off after, because a
 * view-transition-name must be unique in the document and a list of rooms
 * would otherwise have several elements claiming the same one.
 */
export function openAsScreen(el: HTMLElement | null, name: string, change: () => void): void {
  const doc = typeof document === "undefined" ? null : (document as Document & { startViewTransition?: StartViewTransition });

  if (!doc?.startViewTransition) {
    change();
    return;
  }

  if (el) el.style.viewTransitionName = name;
  const t = doc.startViewTransition(change);
  // Always released, including when the transition is skipped or rejected,
  // or the next room tapped collides with a name this one still holds.
  t.finished
    .catch(() => {})
    .finally(() => { if (el) el.style.viewTransitionName = ""; });
}

/** The one name a room's photo travels under. */
export const ROOM_HERO = "room-hero";
