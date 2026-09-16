import { formatBookingDate, type TravellerBooking } from "@/lib/bookings";

/**
 * The four fields, in the one order.
 *
 * House rule: every booking shows name, code, package and date, in that order,
 * everywhere. No surface reorders them, drops one, or adds a fifth between
 * them.
 *
 * This is the first implementation of that rule anywhere on the platform.
 * `publicCode` existed only in Cloud Functions and in the operator's statement
 * PDF, which lists the fields in its own order and is a financial document
 * rather than a booking. So there was nothing to copy, and the next surface
 * that shows a booking should copy THIS rather than decide again.
 *
 * The rule is about the four fields and their order. It does not forbid other
 * content on the page, so a price or a status chip may sit outside this block.
 * It may not sit inside it.
 */
export default function BookingFields({ booking }: { booking: TravellerBooking }) {
  const rows: { label: string; value: string; mono?: boolean; missing?: string }[] = [
    { label: "Name", value: booking.name },
    {
      label: "Code",
      value: booking.code || "",
      mono: true,
      // Absent is a real state, not a gap to paper over: the code is minted
      // when payment lands, so an unpaid booking genuinely has not got one.
      missing: "Issued once payment clears",
    },
    {
      label: "Package",
      value: booking.packageName || "",
      missing: "Not specified",
    },
    {
      label: "Date",
      value: formatBookingDate(booking.date),
      missing: "To be confirmed",
    },
  ];

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-text-muted">{row.label}</dt>
          <dd
            className={`m-0 text-right font-semibold ${
              row.value ? "text-ink" : "text-ink-faint font-normal"
            } ${row.mono && row.value ? "font-mono tracking-wide" : ""}`}
          >
            {row.value || row.missing}
          </dd>
        </div>
      ))}
    </dl>
  );
}
