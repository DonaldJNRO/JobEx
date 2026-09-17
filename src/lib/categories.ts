/**
 * WHICH OF THE FOUR A BUSINESS IS. One table, because there were four and they
 * disagreed.
 *
 * Stays, Experiences, Events, Food & Drink. That is the whole list.
 *
 * WHERE THIS COMES FROM. sabie-studio/src/lib/roleConfig.ts, which is the
 * screen an operator signs up through and therefore the only place that gets
 * to say what a role MEANS. It carries a `category` per role, and this is that
 * table with one fold:
 *
 *   host                  stay      -> stays
 *   hospitality_manager   stay      -> stays     ("Hotels, resorts, lodges")
 *   landlord              rental    -> stays     (the fold, see below)
 *   food_beverage_manager food      -> food
 *   experience_provider   experience-> experiences
 *   event_organizer       event     -> events
 *
 * THE FOLD. Studio has a fifth category, `rental`, for a landlord's long-term
 * residential listings. The website has four, so rental sits inside Stays
 * rather than being hidden: a place you sleep is a place you sleep, and the
 * alternative is a listing that no filter on the site can reach.
 *
 * THE ONE EXCEPTION IS NOT AN EXCEPTION. A host listing whose subCategory is
 * `event_rental` is an Event, not a Stay. That is categoryFromRole() in the
 * same Studio file, a product decision made there, and it is honoured here
 * rather than re-argued.
 *
 * WHAT I GOT WRONG, AND IT MATTERS. An earlier version of this file put
 * HospitalityManager under Food & Drink, on the strength of BUSINESS_TYPE_MAP
 * in sabie-v53-main's UnifiedPriceDisplay.js, which maps hospitality_manager
 * to 'fnb'. That map answers a different question: how to PRICE something, not
 * what it IS. A hotel prices like a restaurant, per head and per night, and is
 * still somewhere you stay. Reading a pricing table as a taxonomy is what put
 * hotels behind the Food & Drink filter.
 *
 * THIS FILE IMPORTS NOTHING on purpose. listings.ts pulls in Firebase, so a
 * test could not load the table through it; as a leaf, plain node can, the same
 * arrangement as slug.ts and listing-place.ts.
 */
export type ListingRole =
  | "Landlord"
  | "Host"
  | "HospitalityManager"
  | "ExperienceProviders"
  | "EventOrganizer"
  | "FoodBeverageManager";

/**
 * Which collections a category can be FOUND IN, which is not the same as which
 * ones it is made of. Host appears under both stays and events because a host
 * listing marked event_rental is an event; a query reads every role listed
 * here and then asks categoryOf() about each listing it got back, so the
 * collection it came out of never decides the answer on its own.
 */
export const CATEGORY_ROLES: Record<string, ListingRole[]> = {
  stays: ["Landlord", "Host", "HospitalityManager"],
  experiences: ["ExperienceProviders"],
  events: ["EventOrganizer", "Host"],
  food: ["FoodBeverageManager"],
};

/** The words a person reads, keyed by the ids the URL and the pills use. */
export const CATEGORY_LABELS: Record<string, string> = {
  stays: "Stays",
  experiences: "Experiences",
  events: "Events",
  food: "Food & Drink",
};

/** Every category, in the order the filter pills show them. */
export const CATEGORY_IDS = ["stays", "experiences", "events", "food"] as const;

/** Firestore stores subCategory as a string key on newer docs and as
 *  { id, name } on older ones. Both mean the same thing. */
export function subCategoryKey(
  sub?: string | { id?: string; name?: string } | null,
): string {
  if (!sub) return "";
  return typeof sub === "string" ? sub : sub.id ?? "";
}

const CATEGORY_OF_ROLE: Record<ListingRole, string> = {
  Landlord: "stays",
  Host: "stays",
  HospitalityManager: "stays",
  ExperienceProviders: "experiences",
  EventOrganizer: "events",
  FoodBeverageManager: "food",
};

/**
 * The category id for one listing. Empty when the role is unrecognised, rather
 * than a guess: a label nothing can filter by is how this went wrong the first
 * time, and a heading leading to an empty page is worse than no heading.
 */
export function categoryOf(
  role?: string | null,
  subCategory?: string | { id?: string; name?: string } | null,
): string {
  if (!role) return "";
  if (role === "Host" && subCategoryKey(subCategory) === "event_rental") return "events";
  return CATEGORY_OF_ROLE[role as ListingRole] ?? "";
}

/** And the words for it. */
export function categoryLabelOf(
  role?: string | null,
  subCategory?: string | { id?: string; name?: string } | null,
): string {
  return CATEGORY_LABELS[categoryOf(role, subCategory)] ?? "";
}
