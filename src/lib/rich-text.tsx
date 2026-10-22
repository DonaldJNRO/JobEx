// BIE'S BOLD, WITHOUT THE ASTERISKS.
//
// The Cloud Function tells Bie "NEVER use markdown. No **bold**, no
// *italic*, no # headers. This is a mobile chat", and Bie does it anyway:
// "Card is up for **Sabię UI/UX Design Team** — just a heads up, it has
// **560 messages & 83 photos**". The app has the same problem and the same
// instruction; the difference is only that nobody had looked at the web.
//
// NOT A MARKDOWN RENDERER. Pulling one in to clean up output a prompt
// already forbids would be a library for a punctuation problem, and it
// would start rendering headers and lists in a chat bubble the first time
// Bie wrote one. This handles the one thing Bie actually emits, **bold**,
// and leaves every other character alone.

import type { ReactNode } from "react";

/** Split on **bold** and render the inside as bold, the rest verbatim. */
export function withBold(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  // Non-greedy, so "**a** and **b**" is two spans and not one that eats the
  // middle. No newlines inside a run: an unclosed ** at the end of a line is
  // somebody typing, not emphasis.
  const re = /\*\*([^*\n]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<strong key={`b${m.index}`} className="font-semibold">{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  // An empty array renders nothing where a message used to be, so a string
  // with no bold in it comes back whole.
  return out.length ? out : [text];
}
