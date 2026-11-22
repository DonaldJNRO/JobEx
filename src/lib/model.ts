/**
 * THE OPERATING MODEL, AS ARITHMETIC.
 *
 * /model renders this. The deck links /model from three slides and says
 * "every assumption yours to change", so the numbers cannot be a picture of
 * a spreadsheet: a visitor edits an input and the whole 36 months recompute.
 *
 * PURE ON PURPOSE, and in src/lib so a .test.mjs beside it can import it
 * under tsx with no React and no DOM. The seven year-end figures in the deck
 * are asserted in model.test.mjs against this file, so a change to the
 * arithmetic that moves a printed number fails the suite rather than quietly
 * disagreeing with a PDF somebody is already holding.
 *
 * NOTHING IS ROUNDED IN HERE. Reps run fractional because attrition is a
 * rate (3% of 4 reps is 0.12 of a rep), businesses run fractional because
 * churn is, and rounding mid-chain is how a model stops reconciling with
 * itself. Rounding is the view's job, at the point of display.
 *
 * EVERY INPUT CARRIES ITS PROVENANCE, in INPUT_META below, and one of the
 * three kinds is "none": nobody has this figure, us included. An investor
 * who finds an unflagged guess on this page has learned something worse
 * about us than the guess itself, so the flag is part of the data and not a
 * decoration the page can forget to draw.
 */

/** Where a number came from. The page draws these three differently. */
export type Provenance = "measured" | "estimate" | "none";

export type ScenarioName = "low" | "base" | "high";

/** The six the scenario switch sets at once. */
export interface ScenarioInputs {
  perRep: number;
  businessChurn: number;
  bookingsPerBusiness: number;
  demandCac: number;
  bookingsPerTraveller: number;
  stayShare: number;
}

export interface ModelInputs extends ScenarioInputs {
  nairaPerPound: number;

  repsAtStart: number;
  hiresPerMonth: number;
  maxReps: number;
  repAttrition: number;
  repSalaryNgn: number;
  repExpensesNgn: number;
  newRepRamp: number;

  businessesAtStart: number;
  rampMonth1: number;
  rampMonth2: number;
  rampMonth3: number;

  marketingSpend: number;
  refundRate: number;

  tripWithStayNgn: number;
  activityOnlyNgn: number;
  stayCommission: number;
  activityCommission: number;
  processingRate: number;

  ngEmploymentRate: number;
  withholdingRate: number;
  founderSalary: number;
  foundersPaid: number;
  founderStart: number;
  engineerSalary: number;
  engineerStart: number;
  opsSalary: number;
  opsStart: number;
  employerNiRate: number;
  infraBase: number;
  infraPer1000: number;
  legalMonthly: number;
  otherMonthly: number;

  daysToSettle: number;
  corporationTaxRate: number;
  vatRegistered: boolean;
  vatRate: number;

  cashAtStart: number;
  raiseAmount: number;
  raiseMonth: number;
}

/**
 * Twelve multipliers, and they MUST average 1.00.
 *
 * Otherwise the seasonality is a growth assumption wearing a seasonality
 * label: a set averaging 1.1 adds ten percent to every year and nobody
 * reading the page would see where it came from. model.test.mjs asserts the
 * mean, so a future edit to one month has to be paid for in another.
 *
 * Index 0 is January. Month 1 of the model is December 2026, so t maps to
 * calendar month (t + 10) % 12.
 */
export const SEASON = [1.6, 0.7, 0.65, 0.8, 0.65, 0.8, 1.0, 1.1, 0.75, 0.75, 1.0, 2.2];

/** The calendar month index (0 = January) for model month t, where t is 1-based. */
export function monthIndex(t: number): number {
  return (t + 10) % 12;
}

export function seasonFor(t: number): number {
  return SEASON[monthIndex(t)];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Dec 26" for t = 1. */
export function monthLabel(t: number): string {
  const i = monthIndex(t);
  // Month 1 is December 2026, so the year turns the month after every December.
  const year = 2026 + Math.floor((t + 10) / 12);
  return `${MONTH_NAMES[i]} ${String(year).slice(2)}`;
}

export const SCENARIOS: Record<ScenarioName, ScenarioInputs> = {
  low:  { perRep: 5,   businessChurn: 0.02,  bookingsPerBusiness: 0.06, demandCac: 25, bookingsPerTraveller: 1,   stayShare: 0 },
  base: { perRep: 7.2, businessChurn: 0.01,  bookingsPerBusiness: 0.1,  demandCac: 15, bookingsPerTraveller: 1.2, stayShare: 0.03 },
  high: { perRep: 9,   businessChurn: 0.005, bookingsPerBusiness: 0.25, demandCac: 6,  bookingsPerTraveller: 2,   stayShare: 0.25 },
};

/** Default is HIGH, which is what the deck's printed figures are drawn on. */
export const DEFAULT_SCENARIO: ScenarioName = "high";

/** Everything the scenario switch does NOT touch. */
export const FIXED: Omit<ModelInputs, keyof ScenarioInputs> = {
  nairaPerPound: 1774.94,

  repsAtStart: 4,
  hiresPerMonth: 2,
  maxReps: 30,
  repAttrition: 0.03,
  repSalaryNgn: 111250,
  repExpensesNgn: 136117,
  newRepRamp: 0.5,

  businessesAtStart: 89,
  rampMonth1: 0.25,
  rampMonth2: 0.6,
  rampMonth3: 0.85,

  marketingSpend: 400,
  refundRate: 0.03,

  tripWithStayNgn: 587000,
  activityOnlyNgn: 18000,
  stayCommission: 0.1,
  activityCommission: 0.1,
  processingRate: 0.029,

  ngEmploymentRate: 0.1,
  withholdingRate: 0.05,
  founderSalary: 2000,
  foundersPaid: 2,
  founderStart: 4,
  engineerSalary: 3500,
  engineerStart: 4,
  opsSalary: 2200,
  opsStart: 9,
  employerNiRate: 0.15,
  infraBase: 150,
  infraPer1000: 60,
  legalMonthly: 300,
  otherMonthly: 200,

  daysToSettle: 30,
  corporationTaxRate: 0.19,
  vatRegistered: false,
  vatRate: 0.2,

  cashAtStart: 2000,
  raiseAmount: 500000,
  raiseMonth: 3,
};

export function inputsFor(scenario: ScenarioName): ModelInputs {
  return { ...FIXED, ...SCENARIOS[scenario] };
}

export interface MonthRow {
  t: number;
  label: string;
  season: number;

  repsStart: number;
  hired: number;
  lost: number;
  repsEnd: number;
  firstMonthReps: number;

  added: number;
  bizStart: number;
  bizLost: number;
  bizEnd: number;

  fullRate: number;
  baseBookings: number;
  travellers: number;
  acqBookings: number;
  grossBookings: number;
  netBookings: number;

  gmv: number;
  commission: number;
  vat: number;
  processing: number;
  grossProfit: number;

  fieldPayroll: number;
  fieldExpense: number;
  ngEmployment: number;
  withholding: number;
  marketing: number;
  ukSalaries: number;
  employerNi: number;
  infrastructure: number;
  legal: number;
  other: number;
  totalCosts: number;

  operating: number;
  lossesCf: number;
  tax: number;
  afterTax: number;
  inFlight: number;
  workingCap: number;
  cashStart: number;
  raised: number;
  cashEnd: number;
}

/** The basket and the take rate are WORKED OUT from the mix, never typed in. */
export function basketOf(i: ModelInputs): { basketNgn: number; takeRate: number } {
  const stayValue = i.stayShare * i.tripWithStayNgn;
  const actValue = (1 - i.stayShare) * i.activityOnlyNgn;
  const basketNgn = stayValue + actValue;
  const takeRate =
    basketNgn > 0
      ? (stayValue * i.stayCommission + actValue * i.activityCommission) / basketNgn
      : 0;
  return { basketNgn, takeRate };
}

export const MONTHS = 36;

export function runModel(i: ModelInputs): MonthRow[] {
  const { basketNgn, takeRate } = basketOf(i);
  const rows: MonthRow[] = [];
  const addedBy: number[] = []; // 1-indexed via addedBy[t]

  for (let t = 1; t <= MONTHS; t++) {
    const prev = rows[t - 2];
    const season = seasonFor(t);

    // ── the field team ──────────────────────────────────────────────────
    const repsStart = t === 1 ? i.repsAtStart : prev.repsEnd;
    const hired = Math.min(i.hiresPerMonth, Math.max(0, i.maxReps - repsStart));
    const lost = repsStart * i.repAttrition;
    const repsEnd = Math.max(0, Math.min(i.maxReps, repsStart + hired - lost));
    const firstMonthReps = t === 1 ? 0 : prev.hired;

    // ── supply ──────────────────────────────────────────────────────────
    const added =
      (repsStart - firstMonthReps) * i.perRep + firstMonthReps * i.perRep * i.newRepRamp;
    addedBy[t] = added;
    const bizStart = t === 1 ? i.businessesAtStart : prev.bizEnd;
    const bizLost = bizStart * i.businessChurn;
    const bizEnd = bizStart + added - bizLost;

    // ── demand. A business ramps over its first three months. ───────────
    const a1 = addedBy[t - 1] ?? 0;
    const a2 = addedBy[t - 2] ?? 0;
    const a3 = addedBy[t - 3] ?? 0;
    const fullRate =
      Math.max(0, bizStart - (a1 + a2 + a3)) +
      a1 * i.rampMonth1 +
      a2 * i.rampMonth2 +
      a3 * i.rampMonth3;

    const baseBookings = fullRate * i.bookingsPerBusiness * season;
    const travellers = i.demandCac === 0 ? 0 : i.marketingSpend / i.demandCac;
    const acqBookings = travellers * i.bookingsPerTraveller * season;
    const grossBookings = baseBookings + acqBookings;
    const netBookings = grossBookings * (1 - i.refundRate);

    // ── revenue, in pounds ──────────────────────────────────────────────
    const gmv = (netBookings * basketNgn) / i.nairaPerPound;
    const commission = gmv * takeRate;
    const vat = i.vatRegistered ? -commission * i.vatRate : 0;
    // Charged on the WHOLE GMV, not on the commission: the processor takes its
    // cut of what the traveller paid, not of what we keep.
    const processing = -gmv * i.processingRate;
    const grossProfit = commission + vat + processing;

    // ── costs, all negative ─────────────────────────────────────────────
    const fieldPayroll = (-repsEnd * i.repSalaryNgn) / i.nairaPerPound;
    const fieldExpense = (-repsEnd * i.repExpensesNgn) / i.nairaPerPound;
    const ngEmployment = (fieldPayroll + fieldExpense) * i.ngEmploymentRate;
    const withholding = -commission * i.withholdingRate;
    const marketing = -i.marketingSpend;
    const ukSalaries = -(
      (t >= i.founderStart ? i.founderSalary * i.foundersPaid : 0) +
      (t >= i.engineerStart ? i.engineerSalary : 0) +
      (t >= i.opsStart ? i.opsSalary : 0)
    );
    const employerNi = ukSalaries * i.employerNiRate;
    const infrastructure = -(i.infraBase + (i.infraPer1000 * bizEnd) / 1000);
    const legal = -i.legalMonthly;
    const other = -i.otherMonthly;
    const totalCosts =
      fieldPayroll + fieldExpense + ngEmployment + withholding + marketing +
      ukSalaries + employerNi + infrastructure + legal + other;

    // ── result and cash ─────────────────────────────────────────────────
    const operating = grossProfit + totalCosts;
    const lossesCf = t === 1 ? 0 : Math.max(0, prev.lossesCf - prev.operating);
    const tax = -Math.max(0, operating - lossesCf) * i.corporationTaxRate;
    const afterTax = operating + tax;
    const inFlight = commission * Math.min(1, i.daysToSettle / 30);
    const workingCap = t === 1 ? -inFlight : prev.inFlight - inFlight;
    const cashStart = t === 1 ? i.cashAtStart : prev.cashEnd;
    const raised = t === i.raiseMonth ? i.raiseAmount : 0;
    const cashEnd = cashStart + afterTax + workingCap + raised;

    rows.push({
      t, label: monthLabel(t), season,
      repsStart, hired, lost, repsEnd, firstMonthReps,
      added, bizStart, bizLost, bizEnd,
      fullRate, baseBookings, travellers, acqBookings, grossBookings, netBookings,
      gmv, commission, vat, processing, grossProfit,
      fieldPayroll, fieldExpense, ngEmployment, withholding, marketing,
      ukSalaries, employerNi, infrastructure, legal, other, totalCosts,
      operating, lossesCf, tax, afterTax, inFlight, workingCap,
      cashStart, raised, cashEnd,
    });
  }

  return rows;
}

/** A flow line sums across the year; a stock line takes the year's last month. */
const FLOW: (keyof MonthRow)[] = [
  "added", "bizLost", "grossBookings", "netBookings", "gmv", "commission", "vat",
  "processing", "grossProfit", "fieldPayroll", "fieldExpense", "ngEmployment",
  "withholding", "marketing", "ukSalaries", "employerNi", "infrastructure",
  "legal", "other", "totalCosts", "operating", "tax", "afterTax", "workingCap",
  "raised", "baseBookings", "acqBookings",
];
const STOCK: (keyof MonthRow)[] = ["bizEnd", "repsEnd", "cashEnd"];

export type YearRow = Record<string, number> & { year: number };

export function byYear(rows: MonthRow[]): YearRow[] {
  const years: YearRow[] = [];
  for (let y = 0; y < 3; y++) {
    const slice = rows.slice(y * 12, y * 12 + 12);
    const out = { year: y + 1 } as YearRow;
    for (const k of FLOW) out[k] = slice.reduce((s, r) => s + (r[k] as number), 0);
    for (const k of STOCK) out[k] = slice[slice.length - 1][k] as number;
    years.push(out);
  }
  return years;
}

/* ── WHERE EVERY NUMBER CAME FROM ────────────────────────────────────────── */

export interface InputMeta {
  key: keyof ModelInputs;
  group: string;
  label: string;
  /** How the field reads and writes: a plain number, a percent, or naira. */
  kind: "number" | "percent" | "money" | "ngn" | "month" | "toggle";
  provenance: Provenance;
  /** One line, and it has to say what the number actually is. */
  note: string;
  /** Set by the scenario switch, so the page can show it moving. */
  scenario?: boolean;
  step?: number;
}

/**
 * THE FLAG IS PART OF THE DATA.
 *
 * Three kinds, and "none" is the one that matters: nobody has this figure,
 * us included. Seven of these inputs are in that state and they are the
 * seven the whole forecast is most sensitive to, which is an uncomfortable
 * thing to publish and exactly why it is published. An investor who finds an
 * unflagged guess has learned something worse about us than the guess.
 *
 * MEASURED means it came off our own records, and nothing else gets to wear
 * it. The rep salary and expenses are the September to November payroll run,
 * businesses per rep is what the team actually did, businesses live is a
 * count, and the two rates are contractual. Everything else is an estimate
 * or it is nothing.
 */
export const INPUT_META: InputMeta[] = [
  // ── the field team ──────────────────────────────────────────────────────
  { key: "repsAtStart", group: "The field team", label: "Field reps at start", kind: "number", provenance: "measured",
    note: "Four reps on the team today, in Lagos, Abuja and Jos." },
  { key: "hiresPerMonth", group: "The field team", label: "New reps hired each month", kind: "number", provenance: "estimate",
    note: "A hiring plan, not a track record. We have never hired two in a month." },
  { key: "maxReps", group: "The field team", label: "Maximum reps", kind: "number", provenance: "estimate",
    note: "Where we stop adding people. A ceiling we have chosen, not one we have hit." },
  { key: "repAttrition", group: "The field team", label: "Rep attrition each month", kind: "percent", provenance: "estimate", step: 0.5,
    note: "We have not lost a rep yet, so this is a guess at what it will be once the team is larger." },
  { key: "repSalaryNgn", group: "The field team", label: "Rep salary a month", kind: "ngn", provenance: "measured",
    note: "The actual payroll figure, 14 September to 15 November 2026." },
  { key: "repExpensesNgn", group: "The field team", label: "Rep field expenses a month", kind: "ngn", provenance: "measured",
    note: "Reimbursed transport, data and incidentals, from the receipts." },
  { key: "newRepRamp", group: "The field team", label: "A new rep's first month output", kind: "percent", provenance: "estimate", step: 5,
    note: "Half of a settled rep in their first month. Observed loosely on four people, which is not a sample." },

  // ── supply ──────────────────────────────────────────────────────────────
  { key: "businessesAtStart", group: "Supply", label: "Businesses live at start", kind: "number", provenance: "measured",
    note: "A count of what is live on the platform right now." },
  { key: "perRep", group: "Supply", label: "Businesses per rep each month", kind: "number", provenance: "measured", scenario: true, step: 0.1,
    note: "What the team actually registered per rep over the measured window." },
  { key: "businessChurn", group: "Supply", label: "Businesses leaving each month", kind: "percent", provenance: "none", scenario: true, step: 0.1,
    note: "NOBODY HAS THIS. No business has left yet, so there is no rate to measure and this is invented." },
  { key: "rampMonth1", group: "Supply", label: "A new business in its first month", kind: "percent", provenance: "estimate", step: 5,
    note: "How much of a settled business's booking rate a brand new one earns. A guess." },
  { key: "rampMonth2", group: "Supply", label: "In its second month", kind: "percent", provenance: "estimate", step: 5,
    note: "Same guess, one month on." },
  { key: "rampMonth3", group: "Supply", label: "In its third month", kind: "percent", provenance: "estimate", step: 5,
    note: "Settled from month four. The three month ramp itself is an assumption." },

  // ── demand ──────────────────────────────────────────────────────────────
  { key: "bookingsPerBusiness", group: "Demand", label: "Bookings per live business a month", kind: "number", provenance: "none", scenario: true, step: 0.01,
    note: "NOBODY HAS THIS, and it is the single number the forecast turns on most." },
  { key: "marketingSpend", group: "Demand", label: "Marketing spend a month", kind: "money", provenance: "estimate",
    note: "What we intend to spend. We have spent almost nothing on acquisition so far." },
  { key: "demandCac", group: "Demand", label: "Cost to acquire one traveller", kind: "money", provenance: "none", scenario: true,
    note: "NOBODY HAS THIS. We have never run a paid acquisition campaign, so there is no cost to report." },
  { key: "bookingsPerTraveller", group: "Demand", label: "Bookings per acquired traveller", kind: "number", provenance: "none", scenario: true, step: 0.1,
    note: "NOBODY HAS THIS. Repeat behaviour on a platform this young cannot be measured." },
  { key: "refundRate", group: "Demand", label: "Refunds", kind: "percent", provenance: "none", step: 0.5,
    note: "NOBODY HAS THIS. Too few completed bookings to form a rate." },

  // ── what a booking is worth ─────────────────────────────────────────────
  { key: "stayShare", group: "What a booking is worth", label: "Share of bookings including a stay", kind: "percent", provenance: "none", scenario: true, step: 1,
    note: "NOBODY HAS THIS, and it moves the basket more than anything else on the page, because a stay is thirty times an activity." },
  { key: "tripWithStayNgn", group: "What a booking is worth", label: "Average trip with a stay", kind: "ngn", provenance: "none",
    note: "NOBODY HAS THIS. Built from listed room prices and a guessed length of stay, not from bookings that happened." },
  { key: "activityOnlyNgn", group: "What a booking is worth", label: "Average trip, activity only", kind: "ngn", provenance: "measured",
    note: "The real prices on the live catalogue, which is mostly food, drink and experiences." },
  { key: "stayCommission", group: "What a booking is worth", label: "Commission on a stay", kind: "percent", provenance: "measured", step: 1,
    note: "Ten percent. It is the same on everything and it is in the operator terms." },
  { key: "activityCommission", group: "What a booking is worth", label: "Commission on an activity", kind: "percent", provenance: "measured", step: 1,
    note: "Ten percent, the same rate. There is no second tier." },
  { key: "processingRate", group: "What a booking is worth", label: "Payment processing", kind: "percent", provenance: "measured", step: 0.1,
    note: "Charged on the whole booking value, not on our commission, which is why it is most of the gross margin." },
  { key: "nairaPerPound", group: "What a booking is worth", label: "Naira per pound", kind: "number", provenance: "measured", step: 1,
    note: "The rate on 15 November 2026. A Lagos booking crosses naira to pounds and back." },

  // ── costs ───────────────────────────────────────────────────────────────
  { key: "ngEmploymentRate", group: "Costs", label: "Nigerian employment costs", kind: "percent", provenance: "estimate", step: 1,
    note: "Added on top of rep pay and expenses. An allowance, not a computed liability." },
  { key: "founderSalary", group: "Costs", label: "Founder salary each", kind: "money", provenance: "estimate",
    note: "A plan. Neither founder is paid anything today." },
  { key: "foundersPaid", group: "Costs", label: "Founders paid", kind: "number", provenance: "estimate",
    note: "How many founders draw that salary." },
  { key: "founderStart", group: "Costs", label: "Founders start in month", kind: "month", provenance: "estimate",
    note: "Month 4, which is after the raise lands in month 3." },
  { key: "engineerSalary", group: "Costs", label: "Engineer salary", kind: "money", provenance: "estimate",
    note: "A plan. The product is built by the founders today." },
  { key: "engineerStart", group: "Costs", label: "Engineer starts in month", kind: "month", provenance: "estimate",
    note: "Month 4." },
  { key: "opsSalary", group: "Costs", label: "Operations hire", kind: "money", provenance: "estimate",
    note: "A plan, to take the office work off the founders." },
  { key: "opsStart", group: "Costs", label: "Operations starts in month", kind: "month", provenance: "estimate",
    note: "Month 9, later than the other two on purpose." },
  { key: "employerNiRate", group: "Costs", label: "Employer National Insurance", kind: "percent", provenance: "estimate", step: 1,
    note: "The headline UK rate applied flat to the salary line. Thresholds and allowances are not modelled." },
  { key: "infraBase", group: "Costs", label: "Infrastructure, fixed", kind: "money", provenance: "estimate",
    note: "Hosting, Firebase and the AI spend, before it scales with the catalogue." },
  { key: "infraPer1000", group: "Costs", label: "Infrastructure per 1,000 businesses", kind: "money", provenance: "estimate",
    note: "What each further thousand listings adds. Extrapolated from a small bill." },
  { key: "legalMonthly", group: "Costs", label: "Legal and professional", kind: "money", provenance: "estimate",
    note: "An allowance spread evenly. Real legal cost arrives in lumps." },
  { key: "otherMonthly", group: "Costs", label: "Everything else", kind: "money", provenance: "estimate",
    note: "Software, bank charges, the things that do not have their own line yet." },

  // ── tax and cash ────────────────────────────────────────────────────────
  { key: "withholdingRate", group: "Tax and cash", label: "Withholding tax on commission", kind: "percent", provenance: "estimate", step: 1,
    note: "Nigerian withholding on our commission. Treated as a cost, not reclaimed." },
  { key: "corporationTaxRate", group: "Tax and cash", label: "Corporation tax", kind: "percent", provenance: "estimate", step: 1,
    note: "UK rate, charged only on profit above the losses carried forward. There is no profit in these three years." },
  { key: "vatRegistered", group: "Tax and cash", label: "VAT registered", kind: "toggle", provenance: "estimate",
    note: "Off. We are below the threshold, and crossing it takes a fifth of the commission." },
  { key: "vatRate", group: "Tax and cash", label: "VAT rate", kind: "percent", provenance: "estimate", step: 1,
    note: "Only bites while the toggle above is on." },
  { key: "daysToSettle", group: "Tax and cash", label: "Days from booking to money reaching us", kind: "number", provenance: "estimate",
    note: "Commission earned but not yet received is working capital. A licensed payment company holds the booking money, and we release it once the guest has been." },
  { key: "cashAtStart", group: "Tax and cash", label: "Cash at start", kind: "money", provenance: "measured",
    note: "What is in the account." },
  { key: "raiseAmount", group: "Tax and cash", label: "Raise", kind: "money", provenance: "estimate",
    note: "Set it to zero to see the runway without it." },
  { key: "raiseMonth", group: "Tax and cash", label: "Raise lands in month", kind: "month", provenance: "estimate",
    note: "Month 3." },
];

export const GROUPS = [
  "The field team",
  "Supply",
  "Demand",
  "What a booking is worth",
  "Costs",
  "Tax and cash",
] as const;

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  measured: "Measured",
  estimate: "Estimate",
  none: "No data",
};
