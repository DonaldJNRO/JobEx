import type { Metadata } from "next";
import Image from "next/image";
import localFont from "next/font/local";

/**
 * THE EVIDENCE PAGE FOR THE INVESTOR DECK.
 *
 * Linked from a PDF that is already out, so /sources is a fixed address: it
 * cannot move and it cannot 404. /evidence redirects here, because an earlier
 * cut of the deck used that path. Both facts live in next.config.ts.
 *
 * NOT IN THE SITEMAP AND NOT IN THE NAV, on purpose. src/app/sitemap.ts is an
 * allowlist, so leaving this route out of STATIC_PAGES is the whole exclusion.
 * The robots metadata below does the rest. It is reached by typing the address
 * or tapping the deck, and by nothing else.
 *
 * WHY robots.txt IS UNTOUCHED. A Disallow would stop the crawler fetching the
 * page, which means it would never READ the noindex below, and a blocked URL
 * can still be indexed on the strength of links pointing at it. Allowing the
 * crawl and refusing the index is the combination that actually keeps a page
 * out of search results.
 *
 * THREE FACES THIS SITE DOES NOT OTHERWISE CARRY. The page was designed in
 * Bitter, Source Serif 4 and JetBrains Mono, and the design is signed off, so
 * the faces stay. What changed is how they arrive: as self-hosted woff2 via
 * next/font/local, exactly like Instrument Sans and Fraunces in layout.tsx,
 * rather than as a Google Fonts <link>. layout.tsx explains why that matters,
 * and a build that depends on fonts.googleapis.com being reachable is a build
 * that can fail for a reason nobody on this team caused.
 *
 * Scoped to this route, so no other page pays for them.
 */
const display = localFont({
  src: "../../fonts/bitter.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-ev-display",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const body = localFont({
  src: "../../fonts/source-serif-4.woff2",
  weight: "300 600",
  display: "swap",
  variable: "--font-ev-body",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const mono = localFont({
  src: "../../fonts/jetbrains-mono.woff2",
  weight: "400 500",
  display: "swap",
  variable: "--font-ev-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "Evidence | Sabię",
  description:
    "Every figure in the Sabię investor deck, what its source measured, and a link to the source.",
  // IT MUST NEVER OUTRANK A PRODUCT PAGE. This is a reference sheet for people
  // who already have the deck, not a page competing for Lagos travel searches.
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.sabieapp.com/sources" },
};

/* The page's own type roles, named once so a row cannot drift from a row. */
const DISPLAY = "font-[family-name:var(--font-ev-display)]";
const MONO = "font-[family-name:var(--font-ev-mono)]";

/** A section's heading: the small gold mono label and its optional standfirst. */
function SectionHead({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="mb-1 border-b border-line pb-3.5">
      <h2
        className={`${MONO} m-0 text-caption font-medium uppercase tracking-[0.24em] text-secondary-ink`}
      >
        {label}
      </h2>
      {children ? (
        <p className="mt-2 max-w-[62ch] text-body text-ink-muted">{children}</p>
      ) : null}
    </div>
  );
}

/**
 * One figure.
 *
 * The note is the part that does the work on this page: it is where a figure
 * says what it actually counted, which is the difference between a source list
 * and evidence. So it is a required prop rather than an optional one.
 */
function Row({
  figure,
  unit,
  claim,
  source,
  noteLead,
  note,
}: {
  figure: string;
  unit: string;
  claim: React.ReactNode;
  source: React.ReactNode;
  noteLead: string;
  note: React.ReactNode;
}) {
  return (
    <div className="grid items-start gap-3.5 border-b border-line py-6 sm:grid-cols-[168px_1fr] sm:gap-7">
      <p className={`${DISPLAY} m-0 min-w-0 text-display font-bold leading-[1.05] tabular-nums text-secondary-ink`}>
        {figure}
        <span
          className={`${MONO} mt-1.5 block text-caption font-normal uppercase leading-[1.5] tracking-[0.16em] text-ink-faint sm:mt-2`}
        >
          {unit}
        </span>
      </p>
      <div className="flex min-w-0 flex-col gap-3">
        <p className="m-0 text-heading leading-[1.5]">{claim}</p>
        <p className="m-0 text-small text-ink-muted [&_a]:break-words [&_a]:text-secondary-ink [&_a]:underline [&_a]:underline-offset-[3px]">
          {source}
        </p>
        <p className="m-0 border-l-2 border-line pl-3.5 text-small text-ink-muted">
          <b className="font-semibold text-ink">{noteLead}</b> {note}
        </p>
      </div>
    </div>
  );
}

export default function SourcesPage() {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-surface font-[family-name:var(--font-ev-body)] text-body leading-[1.55] text-ink`}
    >
      {/* The gutter is on this one wrapper, so a band can never zero it out. */}
      <div className="mx-auto flex max-w-[760px] flex-col gap-14 px-gutter py-page sm:px-6">
        <header>
          {/* Small and quiet. The wordmark already contains the bee, so it goes
              on alone: never the wordmark and the bee symbol together. */}
          <Image
            src="/images/sabie-wordmark.png"
            alt="Sabię"
            width={157}
            height={84}
            priority
            className="mb-5 h-7 w-auto"
          />
          <p className={`${MONO} m-0 text-caption tracking-[0.28em] text-secondary-ink`}>
            SABIĘ · INVESTOR DECK
          </p>
          <h1
            className={`${DISPLAY} mt-3.5 mb-0 text-display font-bold sm:text-hero leading-[1.08] tracking-normal text-balance text-ink`}
          >
            Evidence
          </h1>
          <p className="mt-4 max-w-[62ch] text-heading text-ink-muted">
            Every figure in the deck, what its source actually measured, and a link to the
            source where one is published. Figures that cut against us are included too.
          </p>
        </header>

        <section className="flex flex-col">
          <SectionHead label="Slide 03 · The problem">
            Three figures, read left to right as one sentence: who comes home, what it costs
            them, and why it happens.
          </SectionHead>

          <Row
            figure="550,000"
            unit="Arrivals"
            claim="Flew into Lagos last December. Nearly 90% were Nigerians living abroad."
            source={
              <>
                MO Africa Company Limited, Detty December 2024 report, reported by Premium
                Times and the African Travel and Tourism Association.{" "}
                <a href="https://atta.travel/resource/lagos-generates-n111-5-billion-in-detty-december.html">
                  Read the figures
                </a>
              </>
            }
            noteLead="What it measures."
            note="Passenger arrivals at Murtala Muhammed International Airport over the holiday period, not unique individuals. Total visitors to Lagos across the period were about 1.2 million including domestic travel."
          />

          <Row
            figure="£12.3m"
            unit="One year, UK"
            claim="Lost booking travel in one year, by 6,640 people. £1,851 each."
            source={
              <>
                Action Fraud and the National Fraud Intelligence Bureau, calendar year 2023,
                published February 2024 with ABTA.{" "}
                <a href="https://www.abta.com/news/dont-lose-out-flying-out-action-fraud-urge-holiday-makers-watch-out-fraudsters-online">
                  Read the report summary
                </a>
              </>
            }
            noteLead="What it measures."
            note="Reports made to Action Fraud in the United Kingdom, not confirmed convictions or verified victims. Action Fraud and ABTA both state the true figure is likely higher, because many people do not report. This is the buyer's side of the transaction, which is where Sabię's customer sits."
          />

          <Row
            figure="93%"
            unit="Of employment"
            claim="Of Nigerian work is informal. No register to check, so you check Instagram."
            source={
              <>
                National Bureau of Statistics, Nigeria. Nigeria Labour Force Survey, Q2 2024.{" "}
                <a href="https://www.nigerianstat.gov.ng/pdfuploads/NLFS_Q2_2024.pdf">
                  Read the survey (PDF)
                </a>
              </>
            }
            noteLead="What it measures."
            note="Informal employment as a share of total employment, stated as 93.0%, up from 92.7% in Q1 2024. It includes subsistence agriculture, so the slice Sabię can address is smaller than the headline. The point stands either way: no register reaches these businesses."
          />
        </section>

        <section className="flex flex-col">
          <SectionHead label="Said out loud, not printed on the slide">
            Held back for questions, because four figures stopped landing where three did.
          </SectionHead>

          <Row
            figure="Africa"
            unit="Most targeted"
            claim="The police named flights to Africa, and the visiting friends and family market, among the most targeted."
            source={
              <>
                Action Fraud and the National Fraud Intelligence Bureau annual reports, via
                ABTA.{" "}
                <a href="https://www.abta.com/news/new-report-reveals-seven-million-pounds-lost-holiday-booking-fraud">
                  2018 report
                </a>{" "}
                and{" "}
                <a href="https://www.abta.com/news/new-report-shows-growing-number-people-are-falling-victim-holiday-booking-fraud">
                  2016 report
                </a>
              </>
            }
            noteLead="Read this carefully."
            note="The 2018 wording is that fraudsters particularly target the visiting friends and family market, with flights to Africa and the Indian subcontinent dominating the list of affected destinations. 53% of all reported crimes that year were airline tickets. The 2016 report says the same. Recent releases stopped publishing the destination breakdown, so the destination evidence is 2016 and 2018 while the money figure is 2023. Two separate years is a pattern, and we claim no more than that."
          />

          <Row
            figure="4%"
            unit="Reported"
            claim="Only 4% of scams in Nigeria are ever reported to authorities."
            source={
              <>
                Global Anti-Scam Alliance, State of Scams in Nigeria 2026.{" "}
                <a href="https://gasa.org/knowledge-base/reports/state-of-scams-in-nigeria-2026">
                  Read the summary
                </a>
              </>
            }
            noteLead="What it measures."
            note={
              <>
                A survey panel of 1,180 Nigerian adults, not a census. 84% encountered a scam
                in the year and 22% suffered loss. That 22% is money{" "}
                <b className="font-semibold text-ink">or data</b>, not money alone, and we
                never state it as money alone.
              </>
            }
          />

          <Row
            figure="38%"
            unit="Bank transfer"
            claim="Of African travellers pay by bank transfer, roughly twice the global rate. A transfer cannot be reversed."
            source={
              <>
                IATA Global Passenger Survey 2025.{" "}
                <a href="https://assets.iata.org/download/assets/Global_Passenger_Survey__GPS__2025___Highlights.pdf/b2f5075ac07a11f0a844a6bbf78131c6">
                  Read the highlights (PDF)
                </a>
              </>
            }
            noteLead="What it measures."
            note="Stated payment preference among 10,534 surveyed air passengers. The irreversibility point is a property of bank transfers, not a survey finding."
          />
        </section>

        <section className="flex flex-col">
          <SectionHead label="Elsewhere in the deck" />

          <Row
            figure="£56m"
            unit="Slide 08"
            claim="Spent on tourism and entertainment in Lagos in December alone. 1.2 million visitors that month, and short lets averaged £60 a night."
            source={
              <>
                MO Africa Company Limited, Detty December 2024.{" "}
                <a href="https://atta.travel/resource/lagos-generates-n111-5-billion-in-detty-december.html">
                  Read the figures
                </a>
              </>
            }
            noteLead="What it measures."
            note="₦111.5 billion in sector revenue, about 1.2 million visitors including domestic travel, and ₦120,000 as the average short let night, converted at roughly ₦2,000 to £1."
          />

          <Row
            figure="£650"
            unit="Slide A4"
            claim="A diaspora family visited the Ikoyi property first. A housekeeper confirmed the agent managed it. They transferred the money and he deactivated the account."
            source={
              <>
                Vanguard, October 2025.{" "}
                <a href="https://www.vanguardngr.com/2025/10/detty-december-shortlet-agent-defrauds-diaspora-family-of-n1-3m-in-ikoyi/">
                  Read the report
                </a>
              </>
            }
            noteLead="Why this case and not a bigger one."
            note="₦1.3 million, converted at roughly ₦2,000 to £1. It is on the slide because the family did the one check the market offers, going to the property in person, and the person on site had been bought."
          />
        </section>

        <section className="flex flex-col">
          <SectionHead label="What we could not find, and what we left out" />

          <div className="mt-5 rounded-[14px] border border-line bg-card p-6 text-body text-ink-muted">
            <h3 className={`${DISPLAY} m-0 mb-3 text-title font-semibold text-ink`}>
              There is no published Nigerian total for travel booking fraud
            </h3>
            <p className="m-0 mb-3.5">
              Two full research passes found no aggregate figure. We checked the Nigeria
              Police Force, the EFCC, the Nigerian Tourism Development Corporation, Lagos
              State Government, the Global Anti-Scam Alliance, WTTC, UNWTO, Euromonitor,
              Skift, Phocuswright and the Nigerian travel trade press.
            </p>
            <p className="m-0">
              So we do not state a Nigerian total, and we do not build one by extrapolating
              survey percentages across a population. Nobody counts this, which is part of
              why nobody has built for it.
            </p>

            <h3 className={`${DISPLAY} mt-6 mb-3 text-title font-semibold text-ink`}>
              Figures we deliberately do not use
            </h3>
            <ul className="m-0 mb-3.5 list-disc pl-5">
              <li className="mb-1.5">
                ₦1.7 trillion lost to Ponzi schemes over nine years, and ₦316 billion per the
                Securities and Exchange Commission. Both real, both official, both investment
                fraud rather than travel booking.
              </li>
              <li className="mb-1.5">
                Residential property fraud caseloads, including the Lagos State real estate
                regulator&apos;s 1,702 complaints. People buying homes and signing yearly
                tenancies are not travellers booking a week.
              </li>
            </ul>

            <h3 className={`${DISPLAY} mt-6 mb-3 text-title font-semibold text-ink`}>
              Evidence that cuts against us
            </h3>
            <p className="m-0">
              Nigerian digital payment fraud{" "}
              <b className="font-semibold text-ink">fell 51% in 2025</b>, to ₦25.85 billion,
              according to the Nigeria Inter-Bank Settlement System. The payment rails got
              safer. The trust layer did not, which is the part Sabię builds. We raise this
              before anyone else does.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-2 border-t border-line pt-5 text-small text-ink-faint">
          <p className={`${MONO} m-0 text-caption tracking-[0.2em] text-secondary-ink`}>
            SABIĘ · EVIDENCE
          </p>
          <p className="m-0">
            Naira figures converted at approximately ₦2,000 to £1. Check the rate before
            presenting. Where a source publishes no public link, the report is named in full
            so it can be requested directly.
          </p>
        </div>
      </div>
    </div>
  );
}
