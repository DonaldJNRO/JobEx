import type { Metadata } from "next";
import Link from "next/link";
import { cardClass } from "@/lib/ui-recipes";

/**
 * THE EVIDENCE BEHIND THE COMPETITION SLIDE.
 *
 * Linked from slide 09 of the investor deck, which makes one claim in five
 * rows and one statistic. Before this page existed a reader who wanted to
 * check any of it had nowhere to go, and the slide's own link pointed at
 * /sources, which carries figures rather than a comparison.
 *
 * THE RULE THIS PAGE IS BUILT ON: every mark against another company links to
 * something THAT COMPANY published. Not our characterisation of them. The page
 * has to survive being read by somebody who works at one of them, which rules
 * out the two things a competition slide usually does, namely flattering the
 * marks and leaving the awkward row off.
 *
 * SO TWO MARKS GO AGAINST US ON PURPOSE.
 *
 * Row 04 is the big one. Airbnb says a host's money is typically released
 * within one business day after check-in, so "payment held until the guest
 * arrives" is NOT something only Sabie does, and the row says so in those
 * words. Booking.com is Partly for the same honest reason: where it collects,
 * its own page says payouts go 24 hours after checkout. An investor who checks
 * one row will check that one, and finding it already conceded is worth more
 * than the row was.
 *
 * Row 01 and row 05 are where the actual difference is, and they are the only
 * place the page is allowed to sound confident.
 *
 * FOUR CELLS SAY WE COULD NOT VERIFY THEM, all four of them Wakanow, which
 * publishes less about how it sources supply than the other three. An empty
 * cell with a reason is stronger than a confident mark with nothing behind it,
 * and a reader who works at Wakanow will know immediately whether we looked.
 *
 * THE STATISTIC WAS RE-RUN, NOT COPIED. The slide's seven in ten had no
 * recorded method anywhere in any of the five repos. It now has one, including
 * the part that weakens it: roughly two thirds of the number is businesses
 * these platforms have no category for, which is a fact about catalogues
 * rather than about anyone being careless. On stays alone it is nearer one in
 * two, and /blog/nowhere-to-list already said eight of ours are listed on a
 * global platform. The two pages have to agree, and they do.
 *
 * TONE RULES THAT ARE NOT STYLE PREFERENCES. Incumbents OVERLOOKED these
 * places: their model cannot see them, they were not careless. Nothing on this
 * page is against Booking or Airbnb, which are good products solving a
 * different problem for a different supplier. And nowhere does it say these
 * businesses are not online: most are on Instagram, many take transfers today.
 * The accurate claim is that they cannot clear the bar a form sets.
 *
 * WHAT IS DELIBERATELY NOT HERE, same as /how-it-works: the payment provider's
 * name, the release mechanism, the timing windows. "A licensed payment company"
 * is the whole description.
 */

export const metadata: Metadata = {
  title: "Why we go in person",
  description:
    "The detail behind one slide of the Sabię deck: how every other way of getting supply decides from a form, what we could and could not evidence about each of them, and the method behind the seven in ten.",
  // Same treatment as /sources and /model. It is deck detail for people who
  // already have the deck, and a page that names four other companies is not
  // what a search for Sabię should return. src/app/sitemap.ts is an allowlist,
  // so leaving /why out of it is the rest of the exclusion.
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.sabieapp.com/why" },
};

const DISPLAY = "font-[family-name:var(--font-display)]";

const UPDATED = "22 November 2026";

/** The five companies, in the slide's order. Short label for the chip row. */
const COMPANIES = ["Wakanow", "Booking.com", "Airbnb", "Instagram", "Sabię"] as const;
const SHORT = ["Wakanow", "Booking", "Airbnb", "Instagram", "Sabię"] as const;

type Mark = "Yes" | "No" | "Partly" | "Not known";

type Cell = {
  mark: Mark;
  /** One sentence, and where it came from. Their page, not our summary of it. */
  evidence: React.ReactNode;
};

type Row = { n: string; claim: string; cells: Cell[] };

/** Their own page, in a new tab, styled like every other source link here. */
function Src({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-words text-secondary-ink underline underline-offset-[3px]"
    >
      {children}
    </a>
  );
}

const ROWS: Row[] = [
  {
    n: "01",
    claim: "Suppliers sign themselves up",
    cells: [
      {
        mark: "Not known",
        evidence: (
          <>
            Wakanow publishes an affiliate programme for people who want to sell travel, and a
            partnerships address for businesses wanting to integrate. We could not find a
            published route for a hotel or a restaurant to list itself, so we are not marking
            this one.{" "}
            <Src href="https://affiliates.wakanow.com/">affiliates.wakanow.com</Src>
          </>
        ),
      },
      {
        mark: "Yes",
        evidence: (
          <>
            The join page invites an owner to register for free and to sign up and start
            welcoming guests.{" "}
            <Src href="https://join.booking.com/">join.booking.com</Src>
          </>
        ),
      },
      {
        mark: "Yes",
        evidence: (
          <>
            Anyone can begin a listing from the host page.{" "}
            <Src href="https://www.airbnb.com/host/homes">airbnb.com/host/homes</Src>
          </>
        ),
      },
      {
        mark: "Yes",
        evidence: (
          <>
            Anyone can open an account, and that is the whole of the onboarding. It is a large
            part of why so much of this trade happens there.{" "}
            <Src href="https://www.instagram.com/">instagram.com</Src>
          </>
        ),
      },
      {
        mark: "No",
        evidence: (
          <>
            Nobody can add themselves to Sabię. Only we can add a place, and only after
            somebody has stood in it.{" "}
            <Link
              href="/how-it-works"
              className="text-secondary-ink underline underline-offset-[3px]"
            >
              How Sabię works
            </Link>
          </>
        ),
      },
    ],
  },
  {
    n: "02",
    claim: "Inventory contracted in advance",
    cells: [
      {
        mark: "Yes",
        evidence: (
          <>
            It sells priced holiday packages assembled in advance, and it has said publicly
            that it reaches hotel supply through a connectivity partner.{" "}
            <Src href="https://holidays.wakanow.com/packages/">holidays.wakanow.com</Src>
          </>
        ),
      },
      {
        mark: "Yes",
        evidence: (
          <>
            A property accepts the partner agreement and pays commission on each booking.{" "}
            <Src href="https://www.booking.com/content/legal.html">booking.com legal</Src>
          </>
        ),
      },
      {
        mark: "Partly",
        evidence: (
          <>
            A host accepts the terms, but commits no inventory in advance. The calendar stays
            the host&apos;s. <Src href="https://www.airbnb.com/terms">airbnb.com/terms</Src>
          </>
        ),
      },
      {
        mark: "No",
        evidence: <>Nothing is contracted, because nothing is sold.</>,
      },
      {
        mark: "No",
        evidence: (
          <>
            We contract nothing in advance. An operator&apos;s prices stay their prices, their
            own customers stay their own customers, and if nobody books they pay nothing.
          </>
        ),
      },
    ],
  },
  {
    n: "03",
    claim: "Carries a business with no legal entity",
    cells: [
      {
        mark: "Not known",
        evidence: (
          <>
            Wakanow publishes no eligibility criteria for a supplier, so we cannot say what it
            asks a business for.
          </>
        ),
      },
      {
        mark: "Partly",
        evidence: (
          <>
            The Know Your Partner form asks a business for a tax identification number, a VAT
            number and a business registration number, and asks an individual for identity
            details and a tax number. Booking.com says partners who do not submit it may have
            their properties closed.{" "}
            <Src href="https://partner.booking.com/en-us/help/legal-security/terms-local-laws/everything-you-need-know-about-know-your-partner-kyp-form">
              Know Your Partner
            </Src>
          </>
        ),
      },
      {
        mark: "Partly",
        evidence: (
          <>
            An individual can host without a company. Taxpayer information is still required,
            and Airbnb says it may suspend payouts without it.{" "}
            <Src href="https://www.airbnb.com/help/article/122">airbnb.com/help/article/122</Src>
          </>
        ),
      },
      {
        mark: "Yes",
        evidence: <>An account needs no entity behind it.</>,
      },
      {
        mark: "Yes",
        evidence: (
          <>
            We take a business as we find it. Plenty of ours are registered and plenty have
            bank accounts. It makes no difference to whether we will carry them.
          </>
        ),
      },
    ],
  },
  {
    n: "04",
    claim: "Payment held until the guest arrives",
    cells: [
      {
        mark: "Not known",
        evidence: <>Wakanow publishes no supplier payment terms that we could find.</>,
      },
      {
        mark: "Partly",
        evidence: (
          <>
            Where Booking.com collects, its own page says payouts are sent 24 hours after
            guest checkout. Where the property collects from the guest directly, which is
            common, Booking.com never holds the money at all.{" "}
            <Src href="https://join.booking.com/">join.booking.com</Src>
          </>
        ),
      },
      {
        mark: "Yes",
        evidence: (
          <>
            Airbnb says the money a host earns is typically released within one business day
            after check-in.{" "}
            <b className="font-semibold text-ink">
              This row is not a difference between Airbnb and Sabię.
            </b>{" "}
            <Src href="https://www.airbnb.com/resources/hosting-homes/a/how-youll-get-paid-for-hosting-20">
              How you will get paid for hosting
            </Src>
          </>
        ),
      },
      {
        mark: "No",
        evidence: <>There is no checkout, so there is nothing to hold.</>,
      },
      {
        mark: "Yes",
        evidence: (
          <>
            A licensed payment company holds the money, and Sabię releases it once the guest
            has been.{" "}
            <Link
              href="/how-it-works"
              className="text-secondary-ink underline underline-offset-[3px]"
            >
              How Sabię works
            </Link>
          </>
        ),
      },
    ],
  },
  {
    n: "05",
    claim: "Identity proven by a visit, not a document",
    cells: [
      {
        mark: "Not known",
        evidence: <>Nothing Wakanow publishes describes going to a property.</>,
      },
      {
        mark: "No",
        evidence: (
          <>
            It says it may ask an owner to verify a property before it can take bookings, and
            its trust page describes watchlist screening, fraud scoring and reservation risk
            models. None of it is a visit.{" "}
            <Src href="https://join.booking.com/trust">join.booking.com/trust</Src>
          </>
        ),
      },
      {
        mark: "No",
        evidence: (
          <>
            Every host must be identity verified before a listing is published, through a
            government ID or through checks against third-party records. That proves who
            somebody is, which is a different question from what is at the address.{" "}
            <Src href="https://www.airbnb.com/help/article/450">airbnb.com/help/article/450</Src>
          </>
        ),
      },
      {
        mark: "No",
        evidence: (
          <>
            A verified badge rests on a government-issued photo ID.{" "}
            <Src href="https://help.instagram.com/1666863223752144/">
              ID requirements for Meta Verified
            </Src>
          </>
        ),
      },
      {
        mark: "Yes",
        evidence: (
          <>
            A named person stood in the building on a dated day, and the date is on the
            listing.
          </>
        ),
      },
    ],
  },
];

/** The mark, in one weight for every company. No colour coding: a No against
 *  another company is a description of their model, not a mark against them. */
function MarkText({ mark, sabie }: { mark: Mark; sabie: boolean }) {
  const known = mark !== "Not known";
  return (
    <span
      className={
        known
          ? `font-semibold ${sabie ? "text-secondary-ink" : "text-ink"}`
          : "text-ink-faint"
      }
    >
      {mark}
    </span>
  );
}

export default function WhyPage() {
  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-[760px] px-5 py-16 sm:px-6 sm:py-20">
        <header>
          <h1 className={`${DISPLAY} m-0 text-hero font-bold leading-[1.06] text-balance text-ink`}>
            Nobody goes and looks
          </h1>
          <p className="mt-5 max-w-[46ch] text-heading leading-[1.5] text-ink-muted">
            Every other way of getting supply decides from a form, and a form only admits one
            shape of business. We decide by going there.
          </p>
          <p className="mt-5 text-small text-ink-faint">
            Last updated {UPDATED}. Every figure Sabię states in public, and where it came
            from, is on our{" "}
            <Link href="/sources" className="text-secondary-ink underline underline-offset-[3px]">
              evidence page
            </Link>
            .
          </p>
        </header>

        {/* ── How to read the marks, including the ones against us. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-balance text-ink`}>
            How to read this
          </h2>
          <div className="mt-5 flex flex-col gap-4 text-body leading-[1.7] text-ink-body">
            <p className="m-0">
              The claim above is a strong one, so every mark below carries a sentence of
              evidence, and for the four other companies a link to something they published
              themselves. Read theirs rather than ours.
            </p>
            <p className="m-0">
              Booking.com and Airbnb are good products that solve a different problem for a
              different supplier. Nothing here is an argument that they are bad. It is an
              argument that a form cannot see a particular kind of business, and that those
              businesses were therefore overlooked.
            </p>
            <p className="m-0 border-l-2 border-action pl-4">
              <b className="font-semibold text-ink">One row does not say what we would like.</b>{" "}
              Airbnb releases a host&apos;s money about a business day after the guest checks
              in, so holding payment until the guest arrives is not something only Sabię does.
              Row 04 is marked yes for them.
            </p>
            <p className="m-0">
              Four of the twenty cells for other companies say we could not verify them. All
              four are Wakanow, which publishes less about how it sources supply than the other
              three do. An empty cell with a reason is worth more than a confident mark with
              nothing behind it.
            </p>
          </div>
        </section>

        {/* ── The matrix. Desktop only: five companies across a phone cannot
             carry a readable header, and the blocks below say everything it
             says. Hiding it loses nothing; a sideways-scrolling table with two
             columns off the edge would lose a reader. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-ink`}>
            The comparison
          </h2>

          <div className="mt-6 hidden sm:block">
            <table className="w-full table-fixed border-collapse text-small">
              <caption className="sr-only">
                Five claims about how a travel platform gets its supply, compared across
                Wakanow, Booking.com, Airbnb, Instagram and Sabię. The evidence for every mark
                is below the table.
              </caption>
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="w-[34%] py-3 pr-3 text-left font-semibold text-ink">
                    <span className="sr-only">Claim</span>
                  </th>
                  {COMPANIES.map((c) => (
                    <th
                      key={c}
                      scope="col"
                      className="py-3 pl-2 text-left align-bottom text-small font-semibold text-ink-muted"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.n} className="border-b border-line">
                    <th scope="row" className="py-3.5 pr-3 text-left font-normal text-ink-body">
                      {row.claim}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td key={COMPANIES[i]} className="py-3.5 pl-2 align-top">
                        <MarkText mark={cell.mark} sabie={i === 4} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 m-0 text-small text-ink-faint">
              The evidence for every one of these marks is below.
            </p>
          </div>

          {/* ── A block per claim: the five marks, then the five sentences.
               This is the whole comparison on a phone, and the only place the
               evidence lives on any screen. ── */}
          <div className="mt-6 flex flex-col gap-4 sm:mt-10">
            {ROWS.map((row) => (
              <div key={row.n} className={cardClass({ pad: "lg" })}>
                <h3 className="m-0 flex items-baseline gap-3 text-heading font-semibold leading-[1.4] text-ink">
                  <span className={`${DISPLAY} shrink-0 tabular-nums text-ink-faint`}>
                    {row.n}
                  </span>
                  <span className="min-w-0">{row.claim}</span>
                </h3>

                {/* The marks at a glance, five across even at 390px. */}
                <ul className="mt-4 m-0 grid list-none grid-cols-5 gap-1 p-0 sm:hidden">
                  {row.cells.map((cell, i) => (
                    <li
                      key={SHORT[i]}
                      className={`min-w-0 border-t-2 pt-2 ${
                        i === 4 ? "border-action" : "border-line-strong"
                      }`}
                    >
                      <span className="block text-[10px] leading-[1.3] text-ink-faint">
                        {SHORT[i]}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-[1.35]">
                        <MarkText mark={cell.mark} sabie={i === 4} />
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-5 m-0 flex flex-col gap-3.5">
                  {row.cells.map((cell, i) => (
                    <div key={COMPANIES[i]} className="min-w-0">
                      <dt className="m-0 text-small font-semibold text-ink">
                        {COMPANIES[i]}{" "}
                        <span className="font-normal text-ink-faint">
                          &middot; <MarkText mark={cell.mark} sabie={i === 4} />
                        </span>
                      </dt>
                      <dd className="mt-1 m-0 text-small leading-[1.7] text-ink-muted">
                        {cell.evidence}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* ── The statistic, with the part that weakens it. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-balance text-ink`}>
            Seven in ten, and how we counted it
          </h2>
          <div className="mt-5 flex flex-col gap-4 text-body leading-[1.7] text-ink-body">
            <p className="m-0">
              The slide says that of the places we have visited, about seven in ten cannot be
              found on any of these platforms. That number had no written method until this
              page, so here is one.
            </p>
          </div>

          <dl className="mt-6 m-0 flex flex-col">
            {[
              {
                q: "What was checked",
                a: "40 of the 87 Nigerian businesses on Sabię. That is all 20 of the places to stay, plus 20 of the other 67 picked at random.",
              },
              {
                q: "Against what",
                a: "Booking.com, Airbnb and Wakanow. Instagram is deliberately left out of this count, because most of these businesses are on Instagram. That is rather the point.",
              },
              { q: "When", a: `${UPDATED}.` },
              {
                q: "By whom",
                a: "An automated web search, not a person working through the sites by hand.",
              },
              {
                q: "What counted as cannot find",
                a: "We searched the open web, restricted to those three domains, for the business name and its city. It counted as found if a listing on one of the three matched the name and city closely enough that a traveller searching that name would land on it.",
              },
              {
                q: "The raw count",
                a: "29 of the 40 were not found. On the strictest reading, where only an exact name match counts, it is 32 of 40.",
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-line py-4 first:pt-0">
                <dt className="m-0 text-small font-semibold text-ink">{item.q}</dt>
                <dd className="mt-1 m-0 text-small leading-[1.7] text-ink-muted">{item.a}</dd>
              </div>
            ))}
          </dl>

          <div className={`${cardClass({ tone: "sunken", pad: "lg" })} mt-8`}>
            <h3 className="m-0 text-heading font-semibold leading-[1.4] text-ink">
              Where the number comes from, which matters more than the number
            </h3>
            <ul className="mt-4 m-0 flex list-none flex-col gap-3 p-0 text-body leading-[1.7] text-ink-body">
              <li className="border-l-2 border-line pl-4">
                Of the 20 places to stay, <b className="font-semibold text-ink">11 were found</b>{" "}
                and 9 were not.
              </li>
              <li className="border-l-2 border-line pl-4">
                Of the 20 everything else, which is cafés, spas, a barber, a boat trip and an
                art exhibition, <b className="font-semibold text-ink">none were found</b>.
              </li>
            </ul>
            <div className="mt-5 flex flex-col gap-4 text-body leading-[1.7] text-ink-body">
              <p className="m-0">
                So the seven in ten is real, and roughly two thirds of it is businesses these
                platforms have no category for. Booking.com is not failing to list a barber in
                Surulere. It does not list barbers. That is a fact about what a catalogue is
                built to hold, not about anybody being careless.
              </p>
              <p className="m-0">
                On stays, which is the like-for-like test, it is nearer one in two. We have
                already said in public that eight of our stays are listed on a global platform,
                and this check found the same eight.{" "}
                <Link
                  href="/blog/nowhere-to-list"
                  className="text-secondary-ink underline underline-offset-[3px]"
                >
                  The full count by category
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="mt-6 border-l-2 border-action pl-4 text-small leading-[1.7] text-ink-muted">
            <b className="font-semibold text-ink">What is weak about this method.</b> It is a
            search, not an audit. The index is US based, so a listing that exists but is poorly
            indexed counts here as not found. Three near-name matches were counted as found
            rather than not, which pushes the number down and argues against us. And 40 of 87
            is a sample rather than a census. If you want the other 47 checked, ask and we will
            check them.
          </div>
        </section>

        {/* ── What a visit is, including the listings that do not carry one yet. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-balance text-ink`}>
            What a visit actually is
          </h2>
          <div className="mt-5 flex flex-col gap-4 text-body leading-[1.7] text-ink-body">
            <p className="m-0">
              Someone from the Sabię field team goes to the address. They meet whoever runs the
              place. They film it and photograph it, and they write the prices down in the
              owner&apos;s own words rather than copying them off a menu found online.
            </p>
            <p className="m-0">
              What gets recorded is the name of the person who went, the date they went, and a
              photograph from that day that a traveller can see without signing in to anything.
            </p>
            <p className="m-0">
              Of the 95 businesses on Sabię today, 91 were verified this way. The visit dates
              run from 5 June 2026 to 20 November 2026.
            </p>
            <p className="m-0 border-l-2 border-action pl-4">
              <b className="font-semibold text-ink">75 of those 91 carry the complete card.</b>{" "}
              16 are missing the public photograph and 11 have no visit date stored, so those
              listings show the plain card rather than the verified one. Somebody went to all
              of them. The record of it is incomplete, it is being filled in, and until it is
              the honest thing is to say so here.
            </p>
            <p className="m-0">
              You can see a real one on{" "}
              <Link
                href="/listing/the-rink-arena"
                className="text-secondary-ink underline underline-offset-[3px]"
              >
                The Rink Arena
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── The limits of the visit, said by us rather than found by them. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-balance text-ink`}>
            What a visit does not prove
          </h2>
          <div className="mt-5 flex flex-col gap-4 text-body leading-[1.7] text-ink-body">
            <p className="m-0">It proves the building on one day. That is all it proves.</p>
            <p className="m-0">
              It does not prove the place will be the same in March. Owners change. Places
              close. A kitchen that was spotless in September can be something else by
              December.
            </p>
            <p className="m-0">
              That is why the date sits on the listing rather than hidden behind a badge. A
              visit from five months ago is a different claim from a visit from last week, and
              you should be able to tell which one you are reading.
            </p>
            <p className="m-0">
              A change to where an operator&apos;s money goes is the single thing most worth
              faking on a platform like this. Our rule is that it sends somebody back out to
              the business. It is a rule the office follows rather than something the software
              enforces, which is a real difference and the reason it is written here rather
              than claimed as a control.
            </p>
          </div>
        </section>

        {/* ── The law, stated as narrowly as it actually reads. ── */}
        <section className="mt-16">
          <div className={cardClass({ tone: "sunken", pad: "lg" })}>
            <h2 className={`${DISPLAY} m-0 text-heading font-semibold leading-[1.4] text-ink`}>
              One point of law, stated narrowly
            </h2>
            <p className="mt-4 m-0 text-small leading-[1.7] text-ink-muted">
              The consumer provisions of the Digital Markets, Competition and Consumers Act
              2024 came into force on 6 April 2025. They make it unlawful to publish a review
              that is not based on a person&apos;s genuine experience, and they put the duty on
              the platform that publishes it.{" "}
              <b className="font-semibold text-ink">
                The Act does not require a listing to be physically verified, and Sabię does not
                claim that it does.
              </b>{" "}
              It is on our{" "}
              <Link
                href="/sources"
                className="text-secondary-ink underline underline-offset-[3px]"
              >
                evidence page
              </Link>{" "}
              with its citation.
            </p>
          </div>
        </section>

        <p className="mt-12 text-small italic text-ink-faint">
          If you work at one of the companies above and a mark here is wrong, we would rather
          know than be right. Write to{" "}
          <a
            href="mailto:hello@sabieapp.com"
            className="not-italic text-secondary-ink underline underline-offset-[3px]"
          >
            hello@sabieapp.com
          </a>{" "}
          and we will correct it and say that we did.
        </p>
      </div>
    </div>
  );
}
