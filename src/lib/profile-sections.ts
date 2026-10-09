// Which shape a listing's profile takes, mirroring the mobile app.
//
// A VERBATIM PORT of components/business/profile/sectionRouter.js in
// sabie-v53-main, down to the subcategory sets, which were extracted from
// that file rather than retyped. The web page and the app must decide the
// same way or a traveller sees a menu on one and a service list on the
// other for the same business.
//
// THE THREE SHAPES, and they are genuinely different transactions:
//
//   rooms           a stay, sold by the night
//   menu            a café, read by category, never payable
//   nested-services a service, with tiers under it
//
// LOCKED TO TWO LEVELS, as the app is: service → tiers. No heuristic
// category grouping. The app's comment is explicit that three levels waits
// for Studio to ship a service.category enum, and inventing one here would
// put the two surfaces out of step the day it arrives.
//
// Pure, so profile-sections.test.mjs runs it without Firebase.

export type ServicesShape = "rooms" | "menu" | "nested-services";
export type BookCta = "rooms" | "reserve" | "inquire" | "book";

/** Lodging subcategories, sold by the night. Verbatim from the app. */
const LODGING_SUBCATS = new Set([
  "hotel", "resort", "hostel", "bed_and_breakfast", "vacation_rental_entire",
  "glamping", "private_room",
  // Pre-canonical aliases used by some older listings, kept while those
  // documents exist in production.
  "bnb", "vacation_rental", "unique_stay",
]);

const FOOD_SUBCATS = new Set([
  "restaurant", "cafe", "bar", "bakery", "catering_service",
]);

/**
 * THE TWO SURFACES STORE THE ROLE DIFFERENTLY, and the port had to learn it.
 *
 * Mobile documents carry `food_beverage_manager`. On the website the role is
 * the COLLECTION NAME, `FoodBeverageManager`, because getAllListings stamps
 * it from the bucket it read. Lowercasing alone leaves "foodbeveragemanager",
 * which does not contain "food_beverage", so a café resolved to a service
 * list and its button said Book.
 *
 * Caught by the test, which is the only reason it is not live: it would have
 * shipped as a café quietly wearing the wrong shape.
 *
 * Stripping non-alphanumerics makes both forms the same string, which is the
 * same trick isCafe uses everywhere else in this codebase.
 */
function norm(v: unknown): string {
  return String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rolesOf(roleField: unknown): string[] {
  if (!roleField) return [];
  if (Array.isArray(roleField)) return roleField.map(norm);
  return [norm(roleField)];
}

function hasRole(roleField: unknown, target: string): boolean {
  const t = norm(target);
  return rolesOf(roleField).some((r) => r === t || r.includes(t));
}

export interface ProfileSections {
  services: ServicesShape;
  bookCta: BookCta;
  isLodging: boolean;
  isFood: boolean;
}

export function resolveProfileSections(listing: unknown): ProfileSections {
  const l = (listing ?? {}) as { role?: unknown; subCategory?: unknown };
  const role = l.role;
  const subCategory = typeof l.subCategory === "string" ? l.subCategory : "";

  const isHospitalityRole = hasRole(role, "hospitality_manager")
    || hasRole(role, "host")
    || hasRole(role, "landlord");

  // Verbatim from the app, including the event_rental carve-out: a
  // hospitality role renting out a venue for an event is not a stay.
  const isLodging = (subCategory && LODGING_SUBCATS.has(subCategory))
    || (isHospitalityRole && subCategory === "event_rental"
      ? false
      : isHospitalityRole && !subCategory);

  const isFood = (subCategory && FOOD_SUBCATS.has(subCategory))
    || hasRole(role, "food_beverage");

  const services: ServicesShape = isLodging ? "rooms" : isFood ? "menu" : "nested-services";

  const bookCta: BookCta = isLodging ? "rooms"
    : isFood ? "reserve"
    : hasRole(role, "landlord") ? "inquire"
    : "book";

  return { services, bookCta, isLodging: !!isLodging, isFood: !!isFood };
}

/** The words on the button, for each shape. */
export const CTA_LABEL: Record<BookCta, string> = {
  rooms: "See rooms",
  reserve: "Request a table",
  inquire: "Enquire",
  book: "Book",
};
