// A flag for a city's country.
//
// The cities collection stores a country NAME ("Nigeria", "UK"), not a code,
// and a flag emoji is built from a two-letter ISO code by offsetting each
// letter into the regional-indicator block. So the name has to be resolved
// first, and only for the countries that are actually live.
//
// RETURNS EMPTY FOR ANYTHING UNKNOWN, deliberately. A missing flag is a small
// gap; a wrong flag beside a city name is the kind of mistake people
// screenshot. The office adds a city far more often than it adds a country,
// so this list growing by hand is fine, and silence is the right default
// until somebody does.

const ISO: Record<string, string> = {
  nigeria: "NG",
  uk: "GB",
  "united kingdom": "GB",
  "great britain": "GB",
  england: "GB",
  mali: "ML",
  mauritania: "MR",
  ghana: "GH",
  kenya: "KE",
  "south africa": "ZA",
  "ivory coast": "CI",
  "cote d'ivoire": "CI",
  senegal: "SN",
  usa: "US",
  "united states": "US",
};

export function flagFor(country: string | null | undefined): string {
  const code = ISO[(country || "").trim().toLowerCase()];
  if (!code) return "";
  // 0x1F1E6 is the regional indicator for A, and 65 is "A" in ASCII.
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
