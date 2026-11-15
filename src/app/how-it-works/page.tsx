import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, CreditCard, MapPin, HandCoins, Ban } from "lucide-react";
import { cardClass } from "@/lib/ui-recipes";

/**
 * THE PAGE THAT ANSWERS THE TWO QUESTIONS BEFORE A CARD COMES OUT.
 *
 * Built for customers, not for the deck. Somebody lands on sabieapp.com never
 * having heard of Sabię, in a market where they or someone they know has been
 * defrauded booking travel. They need two answers before they will pay: did
 * anyone actually go to this place, and what happens to my money. The site
 * did not answer either, and that costs bookings today. If the deck links it
 * afterwards, that is a side benefit and not the point.
 *
 * TWO AUDIENCES, TWO HALVES. A traveller and an operator want opposite things
 * from the same arrangement, so the page says each in its own section rather
 * than averaging them into one voice nobody recognises.
 *
 * WHAT IS DELIBERATELY NOT HERE, and it must stay that way: the payment
 * provider's name, the release mechanism, the timing windows, the name match
 * rule. Published, those are a map for a fraudster and a design document for a
 * competitor. The page says what the customer GETS and never how the control
 * works. "A licensed payment company" is the whole description, on purpose.
 *
 * THE BVN LINE IS THE MOST VALUABLE SENTENCE ON THE PAGE. Saying in public
 * that Sabię will never ask for a BVN inoculates our own operators against
 * the scam that will eventually use our name, and it costs nothing.
 *
 * COLOURS COME FROM THE TOKENS, NOT FROM THE BRIEF. The brief specified True
 * Purple #44366d and Misty White #f8f7f4. Both are pre brand change:
 * globals.css calls #44366d "the last of the old purple" and the live palette
 * is charcoal #2C2C2A on cream #FAF6ED with gold #EF9F27 as the one action
 * fill. Hardcoding the brief's hexes would make this the only page on the
 * site wearing the old brand, and scripts/token-collision-check.mjs would
 * refuse it anyway.
 */

export const metadata: Metadata = {
  title: "How Sabię works",
  description:
    "Someone from our team visits every place before it goes on Sabię. You pay by card, a licensed payment company holds your money, and the business is paid after you turn up.",
  alternates: { canonical: "https://www.sabieapp.com/how-it-works" },
  openGraph: {
    title: "How Sabię works",
    description:
      "We visit every place in person. Your money is held until you arrive. Ten percent to us, only when a business earns.",
    url: "https://www.sabieapp.com/how-it-works",
    type: "website",
  },
};

const DISPLAY = "font-[family-name:var(--font-display)]";

const BOOKING = [
  {
    icon: ShieldCheck,
    lead: "You see that we went.",
    body: "Every listing shows it, with the date.",
  },
  {
    icon: CreditCard,
    lead: "You pay by card, in your currency.",
    body: "One checkout, however many places you are booking.",
  },
  {
    icon: HandCoins,
    lead: "Your money is held by a licensed payment company.",
    body: "Not by us, and not by the business.",
  },
  {
    icon: MapPin,
    lead: "You turn up. Only then does the business get paid.",
    body: "If something goes wrong before you arrive, the money has not moved yet, so it comes back to you.",
  },
];

const OPERATOR = [
  {
    lead: "You do not fill in anything.",
    body: "We come to you. There is no form to find and no account to set up.",
  },
  {
    lead: "We build your page and run it for you,",
    body: "for as long as you want us to. When you are ready to take it over, you can.",
  },
  {
    lead: "Nothing changes about how you work.",
    body: "Your prices stay your prices. Your own customers stay your own customers. Keep taking bookings the way you already do.",
  },
  {
    lead: "You are paid after your guest has been.",
    body: "",
  },
  {
    lead: "Ten percent of a booking, and only when you earn.",
    body: "Nothing upfront. No monthly fee. If nobody books, you pay nothing.",
  },
];

const NEVER = [
  "We will never ask you for your BVN.",
  "We will never ask you to pay to be listed.",
  "We will never ask you to send money to be verified.",
];

const QUESTIONS = [
  {
    q: "How do I know someone really went?",
    a: "Every listing carries the date of the visit and the name of the person from our team who made it. We have film of the place from that day.",
  },
  {
    q: "Why do you hold the money instead of sending it straight away?",
    a: "Because paying a business you have never been to, in a city you are not in yet, is the thing that goes wrong in this market. Holding the money until you arrive takes that risk off you.",
  },
  {
    q: "What if I cannot make it?",
    a: "Talk to us before you travel. The money is still with the payment company at that point, not with the business.",
  },
  {
    q: "Do you only cover Lagos?",
    a: "No. We are live in Lagos, Abuja and Jos, with London listings too, and we are adding cities.",
  },
  {
    q: "What kinds of places are on Sabię?",
    a: "Stays, experiences, food and drink, and events. Everything from a skating rink to a cafe to a beach lounge.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-[760px] px-5 py-16 sm:px-6 sm:py-20">
        <header>
          <h1 className={`${DISPLAY} m-0 text-hero font-bold leading-[1.06] text-balance text-ink`}>
            How Sabię works
          </h1>
          <p className="mt-5 max-w-[46ch] text-heading leading-[1.5] text-ink-muted">
            We book the places the booking platforms overlooked.
          </p>
        </header>

        {/* ── The visit. First, because it is the thing nobody else does. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-balance text-ink`}>
            Before a place goes on Sabię, we go to it
          </h2>
          <div className="mt-5 flex flex-col gap-4 text-body leading-[1.7] text-ink-body">
            <p className="m-0">Someone from our team walks in. A real person, on a real day.</p>
            <p className="m-0">
              They meet the owner. They film the place. They write down her prices, in her own
              words.
            </p>
            <p className="m-0">
              We record who went and the day they went, and it stays on the listing for you to
              see.
            </p>
            <p className="m-0 border-l-2 border-action pl-4 font-semibold text-ink">
              Nobody can add themselves to Sabię. Only we can add a place, and only after we
              have stood in it.
            </p>
          </div>
        </section>

        {/* ── The traveller's half. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-ink`}>
            When you book
          </h2>

          <div className="mt-6 flex flex-col gap-3">
            {BOOKING.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.lead} className={cardClass({ pad: "md" })}>
                  <div className="flex items-start gap-3.5">
                    <Icon size={20} className="mt-0.5 shrink-0 text-secondary-ink" aria-hidden />
                    <p className="m-0 text-body leading-[1.6]">
                      <span className="font-semibold text-ink">{step.lead}</span>{" "}
                      <span className="text-ink-muted">{step.body}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-body leading-[1.7] text-ink-body">
            That last part is the whole idea. In most of this market you pay first and find
            out later. On Sabię the money moves after you have been.
          </p>
        </section>

        {/* ── The operator's half. A marketplace that explains one side has
             explained nothing, which is the same note the about page carries. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-ink`}>
            If you run a business
          </h2>

          <ul className="mt-6 m-0 flex list-none flex-col gap-4 p-0">
            {OPERATOR.map((row) => (
              <li key={row.lead} className="border-l-2 border-line pl-4 text-body leading-[1.7]">
                <span className="font-semibold text-ink">{row.lead}</span>
                {row.body ? <span className="text-ink-muted"> {row.body}</span> : null}
              </li>
            ))}
          </ul>
        </section>

        {/* ── The promise that protects our own operators from our own name. ── */}
        <section className="mt-16">
          <div className={cardClass({ tone: "sunken", pad: "lg" })}>
            <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-balance text-ink`}>
              What Sabię will never ask you for
            </h2>
            <ul className="mt-5 m-0 flex list-none flex-col gap-3 p-0">
              {NEVER.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <Ban size={18} className="mt-0.5 shrink-0 text-secondary-ink" aria-hidden />
                  <span className="font-semibold text-ink">{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 mb-0 text-small leading-[1.7] text-ink-muted">
              If someone contacts you saying they are from Sabię and asks for any of these, it
              is not us. Please tell us at{" "}
              <a
                href="mailto:hello@sabieapp.com"
                className="text-secondary-ink underline underline-offset-[3px]"
              >
                hello@sabieapp.com
              </a>{" "}
              so we can warn other businesses.
            </p>
          </div>
        </section>

        {/* ── Questions. ── */}
        <section className="mt-16">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-ink`}>
            Questions people ask
          </h2>
          <dl className="mt-6 m-0 flex flex-col">
            {QUESTIONS.map((item) => (
              <div key={item.q} className="border-b border-line py-5 first:pt-0">
                <dt className="m-0 text-heading font-semibold leading-[1.4] text-ink">
                  {item.q}
                </dt>
                <dd className="mt-2 m-0 text-body leading-[1.7] text-ink-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-12 text-small italic text-ink-faint">
          Something here not clear? Write to{" "}
          <a
            href="mailto:hello@sabieapp.com"
            className="not-italic text-secondary-ink underline underline-offset-[3px]"
          >
            hello@sabieapp.com
          </a>{" "}
          and we will fix the wording.
        </p>

        <p className="mt-6 text-small text-ink-faint">
          Every figure we state in public, and where it came from, is on our{" "}
          <Link href="/sources" className="text-secondary-ink underline underline-offset-[3px]">
            evidence page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
