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
 *
 * LATIN-EXT, NOT JUST LATIN, AND THAT IS THE WHOLE POINT.
 *
 * The first cut of these shipped Google's `latin` slice, which stops at
 * U+00FF. Ę and ę are U+0118 and U+0119, and the naira sign is U+20A6, so
 * every one of them fell out of the subset and the browser substituted
 * Georgia for that single glyph. The brand name rendered as Sabi in one
 * typeface and ę in another, which is the one typographic mistake this
 * company cannot make, and ₦111.5 billion had the same seam in it.
 *
 * These three are subset from the upstream variable TTFs to latin plus
 * latin-ext with pyftsubset, the same ranges Google serves, so the ogonek
 * and the naira are in the file. A face added here later must cover both,
 * and the test beside this page checks exactly that.
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
            Sabię · Investor deck
          </p>
          <h1
            className={`${DISPLAY} mt-3.5 mb-0 text-display font-bold sm:text-hero leading-[1.08] tracking-normal text-balance text-ink`}
          >
            Evidence
          </h1>
          <p className="mt-4 max-w-[62ch] text-heading text-ink-muted">
            Every figure we state in public, what its source actually measured, and a link to
            the source where one is published. Figures that cut against us are included too.
          </p>
          <p className={`${MONO} mt-4 m-0 text-caption uppercase tracking-[0.18em] text-ink-faint`}>
            Last reviewed 15 November 2026
          </p>
        </header>

        <section className="flex flex-col">
          <SectionHead label="Where the money goes">
            One city, one season, measured by the state tourism ministry&apos;s own research
            partner.
          </SectionHead>

          <Row
            figure="£223m"
            unit="One season, Lagos"
            claim="Spent in Lagos across the 2025 festive season."
            source={
              <>
                MO Africa Co, <i>The Economics of Euphoria: Lagos&apos; Detty December 2025</i>,
                produced with the Lagos State Ministry of Tourism, Arts and Culture.{" "}
                <a href="https://businessday.ng/news/article/real-estate-investors-cash-in-as-lagos-detty-december-earnings-triple-to-n396bn/">
                  Read the report coverage
                </a>
              </>
            }
            noteLead="What it measures."
            note="₦396.54bn across a 55-day window, mid November 2025 to 10 January 2026. Converted at ₦1,774 to the pound."
          />

          <Row
            figure="£73m"
            unit="Of that, going out"
            claim="Went on entertainment and nightlife. Almost a third of everything spent."
            source="Same report."
            noteLead="What it measures."
            note="₦129.55bn, 32.67% of the season total. Accommodation was ₦175.4bn, food and dining 12.91%, fashion and retail 9.3%, wellness 0.9%."
          />

          <Row
            figure="3×"
            unit="Year on year"
            claim="Three times the previous season, and part of that is better counting."
            source={
              <>
                The 2024 season was ₦111.5bn.{" "}
                <a href="https://atta.travel/resource/lagos-generates-n111-5-billion-in-detty-december.html">
                  Read the 2024 figures
                </a>
              </>
            }
            noteLead="Read this carefully."
            note="The 2025 report widened its definition to include airfare, local transport and enabler services, and tracked domestic travel better. So part of the increase is measurement rather than growth. We say so every time we quote it."
          />

          <Row
            figure="55%"
            unit="From abroad"
            claim="Of that spending came from travellers arriving from outside Nigeria."
            source="Same report."
            noteLead="What it measures."
            note="400,000 international arrivals, led by the United States at 27% and the United Kingdom at 24%."
          />

          <Row
            figure="2.4m"
            unit="Travellers"
            claim="People travelled to Lagos for the season."
            source="Same report."
            noteLead="Why not the bigger number."
            note="1.6 million domestic land arrivals, 450,000 domestic air arrivals and 400,000 from abroad. The report's headline of 3.6 million participants also counts 1.2 million resident hosts, who are not travelling, so we do not use it."
          />
        </section>

        <section className="flex flex-col">
          <SectionHead label="What it costs people">
            The buyer&apos;s side of the transaction, which is where Sabię&apos;s customer sits.
          </SectionHead>

          <Row
            figure="£12.3m"
            unit="One year, UK"
            claim="Stolen from people booking travel, by 6,640 reports. £1,851 each."
            source={
              <>
                Action Fraud and the National Fraud Intelligence Bureau, calendar year 2023,
                released February 2024 with ABTA.{" "}
                <a href="https://www.abta.com/news/dont-lose-out-flying-out-action-fraud-urge-holiday-makers-watch-out-fraudsters-online">
                  Read the summary
                </a>{" "}
                ·{" "}
                <a href="https://www.actionfraud.police.uk/campaign/holidayfraud">
                  Action Fraud campaign page
                </a>
              </>
            }
            noteLead="What it measures."
            note="Reports made to Action Fraud, not convictions or verified victims. This is the most recent figure they have published and it remains live on their campaign page. Both Action Fraud and ABTA state the true number is higher, because most people do not report."
          />

          <Row
            figure="Africa"
            unit="Named twice"
            claim="UK police named flights to Africa, and the visiting friends and family market, among the most targeted."
            source={
              <>
                Action Fraud and NFIB annual reports, via ABTA.{" "}
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
            note="In 2018, 53% of reported travel fraud was airline tickets, and Hajj travel carried the highest average loss of any category at almost £10,000 per reported case. Recent releases stopped publishing the destination breakdown, so the destination evidence is 2016 and 2018 while the money figure is 2023. Two separate years is a pattern, and we claim no more than that."
          />

          <Row
            figure="38%"
            unit="Bank transfer"
            claim="Of African travellers pay by bank transfer, against 18% globally. A transfer cannot be reversed."
            source={
              <>
                IATA, <i>Global Passenger Survey 2025</i>, sample of 10,534.{" "}
                <a href="https://assets.iata.org/download/assets/Global_Passenger_Survey__GPS__2025___Highlights.pdf/b2f5075ac07a11f0a844a6bbf78131c6">
                  Read the highlights (PDF)
                </a>
              </>
            }
            noteLead="What it measures."
            note="Stated payment preference among surveyed air passengers. IATA describes it as more than double the global average. The irreversibility is a property of bank transfers, not a survey finding."
          />

          <Row
            figure="£733"
            unit="One family"
            claim="A family who checked the property in person still lost the money."
            source={
              <>
                Vanguard, October 2025.{" "}
                <a href="https://www.vanguardngr.com/2025/10/detty-december-shortlet-agent-defrauds-diaspora-family-of-n1-3m-in-ikoyi/">
                  Read the report
                </a>
              </>
            }
            noteLead="Why this case and not a bigger one."
            note="₦1.3 million. They found a short-let agent on Instagram for a flat in Ikoyi, visited the property, and a housekeeper on site confirmed he managed it. They paid. He deleted the account. It is here because they did the one check the market offers, and the person on site had been bought."
          />
        </section>

        <section className="flex flex-col">
          <SectionHead label="Why it cannot be checked" />

          <Row
            figure="93%"
            unit="Of employment"
            claim="Of Nigerian work is informal. There is no register to query."
            source={
              <>
                National Bureau of Statistics, Nigeria Labour Force Survey, Q2 2024.{" "}
                <a href="https://www.nigerianstat.gov.ng/pdfuploads/NLFS_Q2_2024.pdf">
                  Read the survey (PDF)
                </a>
              </>
            }
            noteLead="We are careful with this one."
            note="It measures employment, a large share of it subsistence agriculture, not specifically the businesses a traveller would book. We use it to make one narrow point and no more: there is no register to query."
          />

          <Row
            figure="4%"
            unit="Reported"
            claim="Of scams in Nigeria are ever reported. 84% of adults encountered one."
            source={
              <>
                Global Anti-Scam Alliance, <i>State of Scams in Nigeria 2026</i>.{" "}
                <a href="https://gasa.org/knowledge-base/reports/state-of-scams-in-nigeria-2026">
                  Read the summary
                </a>
              </>
            }
            noteLead="What it measures."
            note={
              <>
                A survey panel of 1,180 Nigerian adults, not a census. 22% suffered a loss,
                and that is money{" "}
                <b className="font-semibold text-ink">or data</b>, not money alone. We never
                state it as money alone.
              </>
            }
          />

          <Row
            figure="None"
            unit="Verify in person"
            claim="No platform sends a person to verify a business in Lagos."
            source="An argument, not a statistic, and we label it as one."
            noteLead="What we do not claim."
            note="Major platforms verify an email address or a document upload. We have found no published figure for what fraud costs an honest trader, so we do not quote one."
          />
        </section>

        <section className="flex flex-col">
          <SectionHead label="Why this is possible now" />

          <Row
            figure="64.4%"
            unit="Of adults"
            claim="Of Nigerian adults now use digital financial services, against 45% in 2023."
            source={
              <>
                EFInA, <i>Access to Financial Services in Nigeria 2026</i> (A2F, 9th survey).{" "}
                <a href="https://nannews.ng/94-2m-nigerians-use-financial-products-formal-inclusion-hits-73-efina/">
                  Read the coverage
                </a>{" "}
                ·{" "}
                <a href="https://www.arise.tv/opay-deepens-financial-inclusion-as-digital-finance-reaches-64-4-of-nigerians/">
                  and the digital finance figure
                </a>
              </>
            }
            noteLead="What it measures."
            note="Formal financial inclusion reached 73%, passing the national strategy's 70% target."
          />

          <Row
            figure="£6.32"
            unit="Per business"
            claim="Is what it costs us to send a person to check one business."
            source="Sabię internal data, 2026. Measured field receipts, not a projection."
            noteLead="How it is counted."
            note="₦986,238 of reimbursed field receipts across 88 businesses visited, which is ₦11,207 each, converted at ₦1,774. It is the transport and access cost the rep actually paid out of pocket and we reimbursed. It does not include the rep's time."
          />

          <Row
            figure="£3.6bn"
            unit="A year, domestic"
            claim="Nigerian travel spending is overwhelmingly domestic, and it has no season."
            source={
              <>
                WTTC, <i>Travel and Tourism Economic Impact Research 2026</i>, via Intelpoint.{" "}
                <a href="https://intelpoint.co/?p=9182">Read the figures</a>
              </>
            }
            noteLead="What it measures."
            note="₦6.39tn domestic visitor spending in 2025 against ₦461bn from international visitors: roughly ₦93 in every ₦100 spent on travel in Nigeria comes from people already in the country. It is the answer to the seasonality question. Our cost is seasonal; this market is not."
          />
        </section>

        <section className="flex flex-col">
          <SectionHead label="Our own numbers">
            Available to investors and press on request.
          </SectionHead>

          <Row
            figure="88"
            unit="Businesses"
            claim="Registered in person, each one visited by a named member of our team."
            source="Sabię internal data, 2026."
            noteLead="What a visit is."
            note="A recorded date, GPS, and film. The rep is named on the listing, which is the part a traveller can check and the part a fake page cannot copy."
          />

          <Row
            figure="64"
            unit="Of the 88"
            claim="Cannot be listed on any global platform at all."
            source="Sabię internal data, 2026."
            noteLead="What we found."
            note="There is no Booking.com for a barber, a café or a skating rink. Of the 24 that could be listed somewhere, 8 already were, and every one of those 8 is a hotel."
          />
        </section>

        <section className="flex flex-col">
          <SectionHead label="How we handle figures" />

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
            Sabię · Evidence
          </p>
          <p className="m-0">
            Naira figures are converted at ₦1,774 to the pound as at 15 November 2026, and we
            re-check the rate before quoting. Where a source publishes no public link, the
            report is named in full so it can be requested directly.
          </p>
          <p className="m-0">
            Something here look wrong? Tell us at{" "}
            <a
              href="mailto:hello@sabieapp.com"
              className="text-secondary-ink underline underline-offset-[3px]"
            >
              hello@sabieapp.com
            </a>{" "}
            and we will correct it.
          </p>
        </div>
      </div>
    </div>
  );
}
