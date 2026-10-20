// AN EXPERIENCE PICKS A TIME. IT DOES NOT TYPE ONE.
//
// 116 services across 17 listings carry timeSlots, and the booking sheet
// asked for a time with a free text clock input. So a guest could type 03:00
// for a water park that runs 10am to 7pm, and nothing on the page would
// disagree until an operator read the request.
//
// 27 of those services also carry availableDays, which nothing has ever
// read either, so a Saturday-only experience accepted a Tuesday.
//
// THIS IS THE AVAILABILITY LAYER, not a second list of times. shop-window's
// slotsFor already gathers the operator's times for a chosen service and
// stays the only place that does; this takes that list and decides which of
// them can still be taken, which is the part nothing did.
//
// Pure and dependency free, and it deals in the operator's own strings.
// Slots arrive as "10:00 AM" and days as "monday". Reformatting them is how
// a slot stops matching what the operator sees in Studio.

export interface SlotRules {
  slots: string[];
  /** "monday".."sunday", lowercase, as Studio writes them. */
  availableDays?: string[];
  /** Hours of notice the operator needs. 7 services carry one. */
  leadTimeHours?: number;
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** The weekday name for a "YYYY-MM-DD" day, in the operator's spelling. */
export function weekdayOf(day: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day))) return null;
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(t.getTime())) return null;
  return DAYS[t.getUTCDay()];
}

/**
 * Does this service run on this day?
 *
 * No availableDays means every day, which is what 89 of the 116 say by
 * saying nothing. An empty array means the same: an operator who cleared
 * the field did not mean "never open".
 */
export function runsOn(day: string, rules: SlotRules): boolean {
  const allowed = (rules.availableDays || []).map((d) => String(d).trim().toLowerCase()).filter(Boolean);
  if (allowed.length === 0) return true;
  const w = weekdayOf(day);
  return w ? allowed.includes(w) : false;
}

/** "10:00 AM" to minutes since midnight, for comparing against now. */
export function minutesOf(slot: string): number | null {
  const m = String(slot).trim().match(/^(\d{1,2})[:.](\d{2})\s*([AaPp])\.?[Mm]\.?$/);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3].toLowerCase() === "p") h += 12;
    return h * 60 + Number(m[2]);
  }
  // 24 hour, which some operators type instead.
  const m24 = String(slot).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m24) return null;
  const h = Number(m24[1]);
  const mins = Number(m24[2]);
  if (h > 23 || mins > 59) return null;
  return h * 60 + mins;
}

export interface SlotChoice {
  slot: string;
  available: boolean;
  /** Why not, in words a guest can act on. */
  reason: string | null;
}

/**
 * The slots for a chosen day, each with whether it can still be taken.
 *
 * A past slot is SHOWN and disabled rather than hidden. A list that silently
 * shortens as the day goes on reads as a service that is losing its times,
 * where a greyed row reads as a time that has gone.
 */
export function slotChoices(day: string, rules: SlotRules, now: Date = new Date()): SlotChoice[] {
  const slots = (rules.slots || []).map((s) => String(s).trim()).filter(Boolean);
  if (slots.length === 0) return [];
  if (!runsOn(day, rules)) {
    return slots.map((slot) => ({ slot, available: false, reason: "Not on this day" }));
  }

  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = day === todayISO;
  const lead = Number(rules.leadTimeHours) > 0 ? Number(rules.leadTimeHours) : 0;
  const cutoff = now.getHours() * 60 + now.getMinutes() + lead * 60;

  return slots.map((slot) => {
    if (!isToday) return { slot, available: true, reason: null };
    const mins = minutesOf(slot);
    if (mins === null) return { slot, available: true, reason: null };
    if (mins < cutoff) {
      return { slot, available: false, reason: lead > 0 ? `Needs ${lead}h notice` : "Already gone" };
    }
    return { slot, available: true, reason: null };
  });
}

/** True when a service is booked by picking a time rather than typing one. */
export function hasSlots(rules: Pick<SlotRules, "slots">): boolean {
  return (rules.slots || []).some((s) => String(s).trim());
}

/** The next day this service actually runs, for a sensible default. */
export function nextRunningDay(from: string, rules: SlotRules, limit = 14): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return null;
  const [y, m, d] = from.split("-").map(Number);
  for (let i = 0; i < limit; i++) {
    const t = new Date(Date.UTC(y, m - 1, d + i));
    const iso = t.toISOString().slice(0, 10);
    if (runsOn(iso, rules)) return iso;
  }
  return null;
}
