import type { Metadata } from "next";
import Link from "next/link";
import { cardClass } from "@/lib/ui-recipes";

/**
 * THE ONE POST, AND THE REASON THERE IS ONLY ONE.
 *
 * A blog is a promise to keep publishing, and a blog that goes stale costs
 * more than no blog at all. This route existed as a "Coming Soon" card for
 * months, which is the same promise with nothing behind it.
 *
 * So: one post, and it is the only thing Sabię knows that nobody else does.
 * Everything else a travel company could blog about, destination guides and
 * packing lists, is already written better elsewhere by people with more time.
 *
 * EVERY FIGURE HERE WAS COUNTED, NOT ESTIMATED, on 15 November 2026, against
 * the live catalogue: the ads collections under the six operator roles, with
 * the same visibility filter the app's own grids use (no test listings, no
 * hidden, no inactive, no deleted). 91 live listings, 23 of them stays.
 *
 * WHAT THE CLAIM WAS NARROWED TO, AND WHY. The deck says these businesses
 * "cannot be listed on a global platform at all". For a barber or a shooting
 * range that is true. For the 34 restaurants and cafés it is not: TripAdvisor
 * and Google Maps will happily carry a restaurant. What no global platform
 * does is let you BOOK and PAY for one from London, and that is the claim the
 * numbers actually support, so it is the claim this post makes. The narrower
 * version is also the stronger one, because it is the thing a traveller needs
 * and cannot get.
 */

export const metadata: Metadata = {
  title: "We knocked on 88 doors in Lagos | Sabię",
  description:
    "Of 91 live businesses on Sabię, 23 are places to stay. The other 68 have no category on any global booking platform. Here is the full count.",
  alternates: { canonical: "https://www.sabieapp.com/blog/nowhere-to-list" },
  openGraph: {
    title: "We knocked on 88 doors in Lagos",
    description:
      "23 of 91 are places to stay. The other 68 cannot be booked on any global platform. The full count, and what it means.",
    url: "https://www.sabieapp.com/blog/nowhere-to-list",
    type: "article",
  },
};

const DISPLAY = "font-[family-name:var(--font-display)]";

/**
 * The count, exactly as it came out of the catalogue. Grouped, because
 * twenty-six rows of ones is a list nobody reads, and the grouping is stated
 * so anybody can regroup it differently.
 */
const NOT_A_STAY = [
  { group: "Food and drink", n: 38, detail: "23 restaurants, 11 cafés, 3 bars, a fast food counter" },
  { group: "Salons, spas and grooming", n: 9, detail: "skin and facials, massage, two barbers, lashes and brows, nails" },
  { group: "Things to do outdoors", n: 6, detail: "kayaking, surfing, beach and water activities, adventure and outdoor" },
  { group: "Art and culture", n: 2, detail: "museum art tours, gallery tours" },
  { group: "Sport and recreation", n: 4, detail: "archery, a shooting range, fitness and wellness, entertainment and recreation" },
  { group: "Nightlife and events", n: 2, detail: "club nights, wellness and mindfulness events" },
  { group: "Not yet categorised", n: 7, detail: "captured in person, category still being set" },
];

export default function NowhereToListPost() {
  return (
    <article className="bg-surface">
      <div className="mx-auto max-w-[720px] px-5 py-16 sm:px-6 sm:py-20">
        <Link
          href="/blog"
          className="text-small text-text-muted underline underline-offset-4 hover:text-ink"
        >
          Back to writing
        </Link>

        <header className="mt-8">
          <p className="text-caption uppercase tracking-[0.2em] text-text-muted">
            15 November 2026 · Field notes
          </p>
          <h1 className={`${DISPLAY} mt-4 text-hero font-bold leading-[1.08] text-balance text-ink`}>
            We knocked on 88 doors in Lagos
          </h1>
          <p className="mt-5 text-heading leading-[1.6] text-text-muted">
            Twenty-three of our businesses are places to stay. Booking.com and Airbnb have a
            category for those. For the other sixty-eight, they have nothing at all.
          </p>
        </header>

        <div className="mt-12 flex flex-col gap-6 text-body leading-[1.7] text-ink">
          <p>
            Every business on Sabię was registered in person. A named member of our team went
            to the address, met the owner, filmed the place and recorded the date. That is
            slow and it is the only way we know to put something on the internet that a
            traveller in London can actually trust.
          </p>

          <p>
            It costs us about £6 a business in transport. We expected the interesting finding
            to be the cost. It was not. The interesting finding was what we were looking at
            once we had a hundred of them in one list.
          </p>

          <h2 className={`${DISPLAY} mt-6 text-title font-bold text-ink`}>
            Most of a city is not a hotel
          </h2>

          <p>
            There are 91 live businesses on Sabię today. Twenty-three of them are a hotel, an
            apartment, a resort or a vacation rental. Those are the ones the global platforms
            were built for, and eight of them are already listed on one.
          </p>

          <p>The other sixty-eight are these:</p>

          <div className={cardClass({ pad: "lg" })}>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {NOT_A_STAY.map((row) => (
                <li key={row.group} className="flex items-baseline gap-4">
                  <span
                    className={`${DISPLAY} w-9 shrink-0 text-right text-title font-bold tabular-nums text-primary`}
                  >
                    {row.n}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold text-ink">{row.group}</span>
                    <span className="block text-small text-text-muted">{row.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p>
            A barbing salon. A shooting range. An archery field. Kayaking tours. Eleven cafés.
            Ask yourself which global platform you would use to book any of them from London,
            three weeks before you fly, and pay for it.
          </p>

          <p>
            There is not one. TripAdvisor will carry a restaurant and Google will put a pin on
            a café, so it is not quite right to say these places are invisible. What is true,
            and what matters to somebody planning a trip, is that <b>no global platform lets
            you book and pay for any of them</b>. They can be found. They cannot be reserved.
          </p>

          <h2 className={`${DISPLAY} mt-6 text-title font-bold text-ink`}>
            Which is why it happens on Instagram
          </h2>

          <p>
            If the only way to hold a table, a tour or a barber&apos;s chair is to message an
            account and send a transfer, then that is what people do. It works most of the
            time. When it does not, there is no platform in the middle, no card to charge
            back, and a transfer that cannot be reversed.
          </p>

          <p>
            UK police logged £12.3m lost to travel booking fraud in a single year, an average
            of £1,851 a person, and they have twice named flights to Africa and the visiting
            friends and family market among the most targeted. That is not a Nigerian problem.
            It is what happens anywhere the supply is real and the rails are missing.
          </p>

          <h2 className={`${DISPLAY} mt-6 text-title font-bold text-ink`}>
            The part we did not expect
          </h2>

          <p>
            We went out assuming the job was competing with the platforms on the stays. It is
            not. On the stays we are one more option. On the other sixty-eight there is no
            option, which means the catalogue is not a worse version of something that exists.
            It is the only version.
          </p>

          <p>
            That is also why we go in person. For a hotel there is a register, a licence and a
            brand to check. For a barber in Surulere there is nothing to look up, so somebody
            has to go and look. Ninety-three per cent of Nigerian employment is informal.
            There is no list to query, and we have stopped treating that as an obstacle. It is
            the reason the work has value.
          </p>

          <div className={`${cardClass({ tone: "sunken", pad: "lg" })} mt-4`}>
            <p className="m-0 text-small leading-[1.7] text-text-muted">
              <b className="text-ink">How these numbers were counted.</b> Taken from the live
              Sabię catalogue on 15 November 2026, using the same visibility filter the app
              uses: no test listings, nothing hidden from discovery, nothing inactive or
              deleted. 91 live businesses, 23 of them stays. &quot;No global platform&quot;
              means no platform that lets a traveller book and pay, which is a narrower and
              more useful claim than no platform at all. Every other figure on this page is
              sourced on our{" "}
              <Link
                href="/sources"
                className="text-primary underline underline-offset-[3px]"
              >
                evidence page
              </Link>
              . If something here looks wrong, tell us at{" "}
              <a
                href="mailto:hello@sabieapp.com"
                className="text-primary underline underline-offset-[3px]"
              >
                hello@sabieapp.com
              </a>{" "}
              and we will correct it.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
