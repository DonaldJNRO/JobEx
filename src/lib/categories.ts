/**
 * WHICH CATEGORY A BUSINESS BELONGS TO. One table, because there were four and
 * they disagreed.
 *
 * The founder tapped Stays and got nothing, from a home page that had just
 * headed a row of hotels "Stays in Lagos". Four separate tables were answering
 * the same question: the explore filter's roleMap, the home page's CATEGORY_OF,
 * listings.ts's ROLE_LABELS (which called it "Hotels & Restaurants", a category
 * that exists nowhere else), and the mobile app. A heading that leads to an
 * empty filter is worse than no heading, so there is now one table and every
 * surface reads it.
 *
 * HospitalityManager sits under Food & Drink because that is what the phone
 * decided: BUSINESS_TYPE_MAP in sabie-v53-main's UnifiedPriceDisplay.js maps
 * 'hospitality_manager' to 'fnb'. Anything that browses the platform has to
 * agree with the app about what a business IS, and the app is the older
 * authority. If that is the wrong call it is the wrong call in two repos, and
 * it gets changed in both.
 *
 * THIS FILE IMPORTS NOTHING on purpose. listings.ts pulls in Firebase, so a
 * test could not load the table through it; as a leaf, plain node can, which is
 * the same arrangement as slug.ts and listing-place.ts. Add a role here and it
 * is filterable, groupable and labelled everywhere at once.
 */
export type ListingRole =
  | "Landlord"
  | "Host"
  | "HospitalityManager"
  | "ExperienceProviders"
  | "EventOrganizer"
  | "FoodBeverageManager";

/** Keyed by the id the URL and the filter pills use. */
export const CATEGORY_ROLES: Record<string, ListingRole[]> = {
  stays: ["Landlord", "Host"],
  experiences: ["ExperienceProviders"],
  events: ["EventOrganizer"],
  food: ["HospitalityManager", "FoodBeverageManager"],
};

/** The words a person reads, keyed by those same ids. */
export const CATEGORY_LABELS: Record<string, string> = {
  stays: "Stays",
  experiences: "Experiences",
  events: "Events",
  food: "Food & Drink",
};

/** The category id for a role, inverted from the one table above so a row
 *  heading and the filter it links to can never disagree again. */
export function categoryOfRole(role?: string | null): string {
  if (!role) return "";
  for (const [id, roles] of Object.entries(CATEGORY_ROLES)) {
    if ((roles as string[]).includes(role)) return id;
  }
  return "";
}

/** And the words for it. Empty when the role is unrecognised, rather than a
 *  guess: a label nothing can filter by is how this went wrong the first time. */
export function categoryLabelOfRole(role?: string | null): string {
  return CATEGORY_LABELS[categoryOfRole(role)] ?? "";
}
