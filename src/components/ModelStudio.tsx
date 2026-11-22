"use client";

/**
 * THE OPERATING MODEL, LIVE.
 *
 * The deck links this from three slides and says "every assumption yours to
 * change", so a picture of a spreadsheet would be a broken promise. Every
 * input here is editable and the whole thirty-six months recompute on the
 * keystroke.
 *
 * NO GATE, and that is a requirement rather than an omission. No sign up, no
 * email capture, no analytics wall. An investor opens this from a QR code on
 * a phone, and anything between the tap and the numbers is a reason to put
 * the phone away.
 *
 * THE ARITHMETIC IS NOT IN HERE. It is in src/lib/model.ts, pure, with the
 * deck's own year-end figures asserted against it in model.test.mjs. This
 * file renders and nothing else, so a layout change cannot move a number an
 * investor is holding on paper.
 *
 * NO CHART LIBRARY. The line is hand-drawn SVG: thirty-six points and four
 * labels do not justify recharts in the bundle of a public page, and an
 * inline viewBox scales to a phone for free.
 *
 * COLOUR CARRIES THE PROVENANCE. Measured is green, an estimate is neutral,
 * and "no data" is the alarm tone, because seven of these inputs are figures
 * nobody has, including us, and they are the seven the forecast turns on
 * most. An unflagged guess found by an investor is worse than the guess.
 */

import { useMemo, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import {
  DEFAULT_SCENARIO, GROUPS, INPUT_META, PROVENANCE_LABEL, SCENARIOS,
  byYear, inputsFor, runModel,
  type InputMeta, type ModelInputs, type MonthRow, type Provenance, type ScenarioName, type YearRow,
} from "@/lib/model";
import { buildWorkbook } from "@/lib/workbook";
import { BUTTON, cardClass, cx, fieldClass, pillClass } from "@/lib/ui-recipes";

const DISPLAY = "font-[family-name:var(--font-display)]";

const SCENARIO_LABEL: Record<ScenarioName, string> = { low: "Low", base: "Base", high: "High" };

/* ── how a number reads ──────────────────────────────────────────────────── */

/**
 * Whole pounds, with the sign kept.
 *
 * NOT ROUNDED TO LOOK BETTER, which the brief is explicit about: £112,634
 * and not "about £113k". A negative wears a minus rather than brackets,
 * because brackets on a phone at 14px read as a typo.
 */
function gbp(n: number): string {
  const r = Math.round(n);
  return `${r < 0 ? "-" : ""}£${Math.abs(r).toLocaleString("en-GB")}`;
}

function plain(n: number, dp = 0): string {
  return n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/** What goes in the box for one input, and what comes back out of it. */
function toField(meta: InputMeta, v: number | boolean): string {
  if (meta.kind === "percent") return String(Number(((v as number) * 100).toFixed(4)));
  return String(v);
}
function fromField(meta: InputMeta, s: string): number | null {
  const n = Number(s);
  if (s.trim() === "" || !Number.isFinite(n)) return null;
  return meta.kind === "percent" ? n / 100 : n;
}

const PROV_TONE: Record<Provenance, "settled" | "neutral" | "alarm"> = {
  measured: "settled",
  estimate: "neutral",
  none: "alarm",
};

/* ── the profit and loss ─────────────────────────────────────────────────── */

type PlRow =
  | { kind: "head"; label: string }
  | { kind: "line"; label: string; key: keyof YearRow; fmt?: "gbp" | "count" }
  | { kind: "total"; label: string; key: keyof YearRow; fmt?: "gbp" | "count" };

const PL: PlRow[] = [
  { kind: "head", label: "Revenue" },
  { kind: "line", label: "Bookings, after refunds", key: "netBookings", fmt: "count" },
  { kind: "line", label: "Gross booking value", key: "gmv" },
  { kind: "line", label: "Commission revenue", key: "commission" },
  { kind: "line", label: "VAT", key: "vat" },
  { kind: "line", label: "Payment processing", key: "processing" },
  { kind: "total", label: "Gross profit", key: "grossProfit" },

  { kind: "head", label: "Operating costs" },
  { kind: "line", label: "Field payroll", key: "fieldPayroll" },
  { kind: "line", label: "Field expenses", key: "fieldExpense" },
  { kind: "line", label: "Nigerian employment costs", key: "ngEmployment" },
  { kind: "line", label: "Withholding tax", key: "withholding" },
  { kind: "line", label: "Marketing", key: "marketing" },
  { kind: "line", label: "UK salaries", key: "ukSalaries" },
  { kind: "line", label: "Employer National Insurance", key: "employerNi" },
  { kind: "line", label: "Infrastructure", key: "infrastructure" },
  { kind: "line", label: "Legal and professional", key: "legal" },
  { kind: "line", label: "Everything else", key: "other" },
  { kind: "total", label: "Total operating costs", key: "totalCosts" },

  { kind: "head", label: "Result" },
  { kind: "total", label: "Operating result", key: "operating" },
  { kind: "line", label: "Corporation tax", key: "tax" },
  { kind: "total", label: "After tax", key: "afterTax" },

  { kind: "head", label: "Where it leaves us" },
  { kind: "line", label: "Raised", key: "raised" },
  { kind: "line", label: "Businesses live at year end", key: "bizEnd", fmt: "count" },
  { kind: "line", label: "Field reps at year end", key: "repsEnd", fmt: "count" },
  { kind: "total", label: "Cash at year end", key: "cashEnd" },
];

/* ── the chart ───────────────────────────────────────────────────────────── */

function CommissionChart({ rows }: { rows: MonthRow[] }) {
  const W = 760;
  const H = 240;
  const L = 58;
  const R = 10;
  const T = 14;
  const B = 30;

  const values = rows.map((r) => r.commission);
  const peak = Math.max(...values, 1);
  // A tick ceiling that is a round number, so the axis reads as money rather
  // than as whatever the maximum happened to be.
  const mag = Math.pow(10, Math.floor(Math.log10(peak)));
  const top = Math.ceil(peak / mag) * mag;

  const x = (i: number) => L + (i / (rows.length - 1)) * (W - L - R);
  const y = (v: number) => H - B - (v / top) * (H - T - B);

  const line = rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(r.commission).toFixed(1)}`).join(" ");
  const area = `${line} L${x(rows.length - 1).toFixed(1)},${(H - B).toFixed(1)} L${x(0).toFixed(1)},${(H - B).toFixed(1)} Z`;

  const ticks = [0, top / 2, top];
  // Every December, because the seasonality multiplier is 2.2 there and the
  // spikes are the shape of the business. Labelling the Decembers is what
  // makes the chart say "this is a seasonal market" without a caption.
  const decembers = rows.filter((r) => r.season === 2.2);

  const last = rows[rows.length - 1];

  return (
    <figure className="m-0">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[320px] text-ink-faint"
          role="img"
          aria-label={`Monthly commission revenue across 36 months, from ${gbp(rows[0].commission)} in December 2026 to ${gbp(last.commission)} in November 2029, spiking every December.`}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" opacity="0.25" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="currentColor">
                {gbp(v)}
              </text>
            </g>
          ))}

          {decembers.map((r) => (
            <line
              key={r.t}
              x1={x(r.t - 1)} x2={x(r.t - 1)} y1={T} y2={H - B}
              stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.35"
            />
          ))}

          <path d={area} fill="var(--color-action)" opacity="0.14" />
          <path d={line} fill="none" stroke="var(--color-action-press)" strokeWidth="2.5" strokeLinejoin="round" />

          {decembers.map((r) => (
            <g key={`l-${r.t}`}>
              <circle cx={x(r.t - 1)} cy={y(r.commission)} r="3.5" fill="var(--color-action-press)" />
              <text x={x(r.t - 1)} y={H - B + 16} textAnchor="middle" fontSize="11" fill="currentColor">
                {r.label}
              </text>
            </g>
          ))}
          <text x={x(rows.length - 1)} y={H - B + 16} textAnchor="end" fontSize="11" fill="currentColor">
            {last.label}
          </text>
        </svg>
      </div>
      <figcaption className="mt-3 text-small leading-[1.6] text-ink-muted">
        Commission revenue a month, December 2026 to November 2029. The dotted lines are
        Decembers, where the seasonality multiplier is 2.2. The twelve multipliers average
        exactly 1.00, so the shape is seasonal and not growth smuggled in.
      </figcaption>
    </figure>
  );
}

/* ── the page ────────────────────────────────────────────────────────────── */

export default function ModelStudio() {
  const [scenario, setScenario] = useState<ScenarioName>(DEFAULT_SCENARIO);
  const [inputs, setInputs] = useState<ModelInputs>(() => inputsFor(DEFAULT_SCENARIO));
  // A draft per field, so clearing a box to retype does not snap it to zero
  // under the cursor. Cleared on blur.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const rows = useMemo(() => runModel(inputs), [inputs]);
  const years = useMemo(() => byYear(rows), [rows]);

  const pristine = useMemo(
    () => JSON.stringify(inputs) === JSON.stringify(inputsFor(scenario)),
    [inputs, scenario],
  );

  function pickScenario(s: ScenarioName) {
    setScenario(s);
    // The six move; anything the visitor changed by hand elsewhere stays.
    setInputs((prev) => ({ ...prev, ...SCENARIOS[s] }));
    setDrafts({});
  }

  function reset() {
    setInputs(inputsFor(scenario));
    setDrafts({});
  }

  function setOne(meta: InputMeta, raw: string) {
    setDrafts((d) => ({ ...d, [meta.key]: raw }));
    const v = fromField(meta, raw);
    if (v !== null) setInputs((prev) => ({ ...prev, [meta.key]: v }));
  }

  function download() {
    const money = (n: number) => Math.round(n * 100) / 100;

    const pl: (string | number | null)[][] = [
      ["Sabię operating model"],
      [`Scenario: ${SCENARIO_LABEL[scenario]}${pristine ? "" : ", with edits"}`],
      ["Month 1 is December 2026. All figures in pounds unless stated."],
      [],
      ["", "Year 1", "Year 2", "Year 3"],
    ];
    for (const r of PL) {
      if (r.kind === "head") {
        pl.push([]);
        pl.push([r.label]);
        continue;
      }
      pl.push([r.label, ...years.map((y) => money(y[r.key] as number))]);
    }

    const MONTHLY: { label: string; key: keyof MonthRow }[] = [
      { label: "Season multiplier", key: "season" },
      { label: "Reps at start", key: "repsStart" },
      { label: "Reps hired", key: "hired" },
      { label: "Reps at end", key: "repsEnd" },
      { label: "Businesses added", key: "added" },
      { label: "Businesses lost", key: "bizLost" },
      { label: "Businesses live", key: "bizEnd" },
      { label: "Businesses at full rate", key: "fullRate" },
      { label: "Bookings from the catalogue", key: "baseBookings" },
      { label: "Travellers acquired", key: "travellers" },
      { label: "Bookings from acquisition", key: "acqBookings" },
      { label: "Bookings, after refunds", key: "netBookings" },
      { label: "Gross booking value", key: "gmv" },
      { label: "Commission revenue", key: "commission" },
      { label: "VAT", key: "vat" },
      { label: "Payment processing", key: "processing" },
      { label: "Gross profit", key: "grossProfit" },
      { label: "Field payroll", key: "fieldPayroll" },
      { label: "Field expenses", key: "fieldExpense" },
      { label: "Nigerian employment costs", key: "ngEmployment" },
      { label: "Withholding tax", key: "withholding" },
      { label: "Marketing", key: "marketing" },
      { label: "UK salaries", key: "ukSalaries" },
      { label: "Employer National Insurance", key: "employerNi" },
      { label: "Infrastructure", key: "infrastructure" },
      { label: "Legal and professional", key: "legal" },
      { label: "Everything else", key: "other" },
      { label: "Total operating costs", key: "totalCosts" },
      { label: "Operating result", key: "operating" },
      { label: "Losses carried forward", key: "lossesCf" },
      { label: "Corporation tax", key: "tax" },
      { label: "After tax", key: "afterTax" },
      { label: "Commission in flight", key: "inFlight" },
      { label: "Working capital movement", key: "workingCap" },
      { label: "Raised", key: "raised" },
      { label: "Cash at month end", key: "cashEnd" },
    ];
    const monthly: (string | number | null)[][] = [
      ["Month", ...rows.map((r) => r.label)],
      ...MONTHLY.map((m) => [m.label, ...rows.map((r) => money(r[m.key] as number))]),
    ];

    const assumptions: (string | number | null)[][] = [
      ["Input", "Value", "Where it came from", "Note", "Set by the scenario switch"],
      ...INPUT_META.map((m) => {
        const v = inputs[m.key];
        const shown =
          m.kind === "toggle" ? (v ? "Yes" : "No")
          : m.kind === "percent" ? `${Number((((v as number) * 100)).toFixed(4))}%`
          : (v as number);
        return [m.label, shown, PROVENANCE_LABEL[m.provenance], m.note, m.scenario ? "Yes" : "No"];
      }),
      [],
      ["Seasonality, which averages exactly 1.00"],
      ["Month", ...rows.slice(0, 12).map((r) => r.label)],
      ["Multiplier", ...rows.slice(0, 12).map((r) => r.season)],
    ];

    const bytes = buildWorkbook([
      { name: "Profit and loss", rows: pl },
      { name: "36 months", rows: monthly },
      { name: "Assumptions", rows: assumptions },
    ]);

    const blob = new Blob([new Uint8Array(bytes)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sabie-model-${scenario}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const noDataCount = INPUT_META.filter((m) => m.provenance === "none").length;

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-[760px] px-5 py-16 sm:px-6 sm:py-20">
        <header>
          <h1 className={`${DISPLAY} m-0 text-hero font-bold leading-[1.06] text-balance text-ink`}>
            The model
          </h1>
          <p className="mt-5 max-w-[46ch] text-heading leading-[1.5] text-ink-muted">
            Three years of it, and every assumption is yours to change.
          </p>
          <p className="mt-5 max-w-[62ch] text-body leading-[1.7] text-ink-body">
            Change anything below and the whole thirty-six months recompute. Nothing is
            hidden, nothing is rounded to flatter us, and{" "}
            <b className="font-semibold text-ink">
              {noDataCount} of these inputs are figures nobody has
            </b>
            , us included. Those are marked.
          </p>
        </header>

        {/* ── 1. the scenario switch ── */}
        <section className="mt-14">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-ink`}>
            Pick a scenario
          </h2>
          <p className="mt-3 max-w-[62ch] text-body leading-[1.7] text-ink-body">
            Each one sets six inputs at once. They are the six we have no evidence for, so
            the spread between Low and High is the honest range rather than a sales band.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {(["low", "base", "high"] as ScenarioName[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => pickScenario(s)}
                aria-pressed={scenario === s}
                className={cx(pillClass({ chosen: scenario === s, size: "md" }), "h-11 px-5")}
              >
                {SCENARIO_LABEL[s]}
              </button>
            ))}
            {!pristine ? (
              <button
                type="button"
                onClick={reset}
                className={cx(BUTTON.base, BUTTON.variant.secondary, BUTTON.size.md)}
              >
                <RotateCcw size={15} aria-hidden />
                Back to {SCENARIO_LABEL[scenario]}
              </button>
            ) : null}
          </div>
          {!pristine ? (
            <p className="mt-3 m-0 text-small text-ink-muted">
              You have changed something, so these are your numbers rather than ours.
            </p>
          ) : null}
        </section>

        {/* ── 2. the outputs ── */}
        <section className="mt-14">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-ink`}>
            What comes out
          </h2>

          {/* ALL THREE YEARS HAVE TO BE ON SCREEN AT 390px.
              A min-width here pushed years 2 and 3 off the edge behind a
              sideways scroll, and an investor reading this from a QR code
              sees year 1 and concludes that is the whole table. So the type
              steps down on a phone and the labels wrap instead. The
              overflow-x stays as a floor for something narrower still. */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-caption sm:text-small">
              <thead>
                <tr>
                  <th className="w-[38%] border-b border-line-strong py-2.5 pr-2 text-left font-semibold text-ink">
                    <span className="sr-only">Line</span>
                  </th>
                  {years.map((y) => (
                    <th
                      key={y.year}
                      className="border-b border-line-strong py-2.5 pl-2 text-right font-semibold text-ink sm:pl-3"
                    >
                      Year {y.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PL.map((r, idx) =>
                  r.kind === "head" ? (
                    <tr key={`h-${r.label}`}>
                      <th
                        colSpan={4}
                        className={cx(
                          "pb-1.5 pt-6 text-left text-caption font-semibold uppercase tracking-[0.16em] text-ink-faint",
                          idx === 0 && "pt-4",
                        )}
                      >
                        {r.label}
                      </th>
                    </tr>
                  ) : (
                    <tr key={r.key as string} className={r.kind === "total" ? "font-semibold" : undefined}>
                      <td
                        className={cx(
                          "border-b py-2 pr-2 text-left",
                          r.kind === "total" ? "border-line-strong text-ink" : "border-line text-ink-muted",
                        )}
                      >
                        {r.label}
                      </td>
                      {years.map((y) => {
                        const v = y[r.key] as number;
                        return (
                          <td
                            key={y.year}
                            className={cx(
                              "border-b py-2 pl-2 text-right tabular-nums whitespace-nowrap sm:pl-3",
                              r.kind === "total" ? "border-line-strong text-ink" : "border-line text-ink-body",
                            )}
                          >
                            {r.fmt === "count" ? plain(Math.round(v)) : gbp(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-small leading-[1.7] text-ink-muted">
            Year 1 is December 2026 to November 2027. Flow lines sum across the year.
            Businesses, reps and cash are where they stand in the last month of it.
          </p>

          <div className="mt-8">
            <h3 className={`${DISPLAY} m-0 mb-4 text-heading font-semibold text-ink`}>
              Commission revenue, month by month
            </h3>
            <CommissionChart rows={rows} />
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={download}
              className={cx(BUTTON.base, BUTTON.variant.primary, BUTTON.size.lg)}
            >
              <Download size={18} aria-hidden />
              Download the workbook
            </button>
            <p className="mt-3 m-0 max-w-[62ch] text-small leading-[1.7] text-ink-muted">
              An Excel file with three sheets: the profit and loss, all thirty-six months,
              and the assumptions with where each one came from. It carries whatever you have
              changed above, not our defaults.
            </p>
          </div>
        </section>

        {/* ── 3. the assumptions ── */}
        <section className="mt-14">
          <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-ink`}>
            Every assumption
          </h2>

          <div className={cx("mt-5", cardClass({ tone: "sunken", pad: "md" }))}>
            <p className="m-0 text-small font-semibold text-ink">What the marks mean</p>
            <ul className="mt-3 m-0 flex list-none flex-col gap-2 p-0 text-small">
              {(["measured", "estimate", "none"] as Provenance[]).map((p) => (
                <li key={p} className="flex flex-wrap items-center gap-2">
                  <span className={pillClass({ tone: PROV_TONE[p] })}>{PROVENANCE_LABEL[p]}</span>
                  <span className="text-ink-muted">
                    {p === "measured"
                      ? "From our own records. A payroll run, a count, a contractual rate."
                      : p === "estimate"
                        ? "A considered guess, or a plan we have decided on but not yet done."
                        : "Nobody has this figure, us included. There is nothing to measure yet."}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {GROUPS.map((group) => (
            <div key={group} className="mt-9">
              <h3
                className={`${DISPLAY} m-0 border-b border-line pb-2.5 text-heading font-semibold text-ink`}
              >
                {group}
              </h3>
              <div className="flex flex-col">
                {INPUT_META.filter((m) => m.group === group).map((m) => {
                  const value = inputs[m.key];
                  const id = `in-${m.key}`;
                  return (
                    <div key={m.key as string} className="border-b border-line py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <label htmlFor={id} className="m-0 text-body font-semibold text-ink">
                          {m.label}
                        </label>
                        <span className={pillClass({ tone: PROV_TONE[m.provenance] })}>
                          {PROVENANCE_LABEL[m.provenance]}
                        </span>
                        {m.scenario ? (
                          <span className={pillClass({ tone: "gold" })}>Scenario</span>
                        ) : null}
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        {m.kind === "toggle" ? (
                          <button
                            id={id}
                            type="button"
                            role="switch"
                            aria-checked={Boolean(value)}
                            onClick={() =>
                              setInputs((prev) => ({ ...prev, [m.key]: !prev[m.key] }))
                            }
                            className={cx(BUTTON.base, BUTTON.variant.secondary, BUTTON.size.md)}
                          >
                            {value ? "Yes" : "No"}
                          </button>
                        ) : (
                          <>
                            {m.kind === "money" ? (
                              <span className="text-body text-ink-muted" aria-hidden>£</span>
                            ) : null}
                            {m.kind === "ngn" ? (
                              <span className="text-body text-ink-muted" aria-hidden>₦</span>
                            ) : null}
                            <input
                              id={id}
                              type="number"
                              inputMode="decimal"
                              step={m.step ?? (m.kind === "percent" ? 0.1 : 1)}
                              min={m.kind === "month" ? 1 : undefined}
                              max={m.kind === "month" ? 36 : undefined}
                              value={drafts[m.key] ?? toField(m, value)}
                              onChange={(e) => setOne(m, e.target.value)}
                              onBlur={() =>
                                setDrafts((d) => {
                                  const next = { ...d };
                                  delete next[m.key];
                                  return next;
                                })
                              }
                              aria-describedby={`${id}-note`}
                              className={cx(fieldClass(), "max-w-[160px]")}
                            />
                            {m.kind === "percent" ? (
                              <span className="text-body text-ink-muted" aria-hidden>%</span>
                            ) : null}
                            {m.kind === "month" ? (
                              <span className="text-small text-ink-muted">
                                {m.key === "raiseMonth" || m.key === "founderStart" || m.key === "engineerStart" || m.key === "opsStart"
                                  ? rows[Math.min(35, Math.max(0, Math.round(value as number) - 1))]?.label
                                  : null}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>

                      <p
                        id={`${id}-note`}
                        className={cx(
                          "mt-2.5 m-0 border-l-2 pl-3 text-small leading-[1.6]",
                          m.provenance === "none"
                            ? "border-alarm-line font-semibold text-alarm-ink"
                            : "border-line text-ink-muted",
                        )}
                      >
                        {m.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14">
          <div className={cardClass({ tone: "sunken", pad: "lg" })}>
            <h2 className={`${DISPLAY} m-0 text-title font-bold leading-[1.2] text-balance text-ink`}>
              What this model does not do
            </h2>
            <ul className="mt-5 m-0 flex list-none flex-col gap-3 p-0 text-body leading-[1.7] text-ink-body">
              <li className="border-l-2 border-line pl-4">
                It does not prove demand. The bookings per business figure is the one the
                whole forecast turns on and it is the one nobody has.
              </li>
              <li className="border-l-2 border-line pl-4">
                It assumes supply keeps working at the rate we have measured, across a team
                seven times its current size. That is the part most likely to break.
              </li>
              <li className="border-l-2 border-line pl-4">
                Food and drink can never take payment through Sabię, and most of the live
                catalogue is food and drink. The basket above is the paid part only.
              </li>
              <li className="border-l-2 border-line pl-4">
                There is no profit in any of the three years on any scenario. The model says
                so rather than reaching for a fourth.
              </li>
            </ul>
          </div>
        </section>

        <p className="mt-12 text-small italic text-ink-faint">
          Think one of these numbers is wrong? Write to{" "}
          <a
            href="mailto:hello@sabieapp.com"
            className="not-italic text-secondary-ink underline underline-offset-[3px]"
          >
            hello@sabieapp.com
          </a>{" "}
          and tell us which one.
        </p>
      </div>
    </div>
  );
}
