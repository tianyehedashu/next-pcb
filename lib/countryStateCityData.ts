// 精简版：us, ca, uk, de, fr, jp, au, sg, kr, ru
export const countryData = [
  {
    code: "US", name: "United States", states: [
      { code: "CA", name: "California", cities: ["Los Angeles", "San Francisco", "San Diego"] },
      { code: "NY", name: "New York", cities: ["New York City", "Buffalo", "Rochester"] },
      { code: "TX", name: "Texas", cities: ["Houston", "Dallas", "Austin"] },
    ]
  },
  {
    code: "CA", name: "Canada", states: [
      { code: "ON", name: "Ontario", cities: ["Toronto", "Ottawa", "Mississauga"] },
      { code: "BC", name: "British Columbia", cities: ["Vancouver", "Victoria", "Richmond"] },
      { code: "QC", name: "Quebec", cities: ["Montreal", "Quebec City", "Laval"] },
    ]
  },
  {
    code: "GB", name: "United Kingdom", states: [
      { code: "ENG", name: "England", cities: ["London", "Manchester", "Liverpool"] },
      { code: "SCT", name: "Scotland", cities: ["Edinburgh", "Glasgow", "Aberdeen"] },
      { code: "WLS", name: "Wales", cities: ["Cardiff", "Swansea", "Newport"] },
    ]
  },
  {
    code: "DE", name: "Germany", states: [
      { code: "BE", name: "Berlin", cities: ["Berlin"] },
      { code: "BW", name: "Baden-Württemberg", cities: ["Stuttgart", "Mannheim"] },
      { code: "BY", name: "Bavaria", cities: ["Munich", "Nuremberg"] },
    ]
  },
  {
    code: "FR", name: "France", states: [
      { code: "IDF", name: "Île-de-France", cities: ["Paris", "Boulogne-Billancourt"] },
      { code: "PAC", name: "Provence-Alpes-Côte d'Azur", cities: ["Marseille", "Nice"] },
      { code: "NAQ", name: "Nouvelle-Aquitaine", cities: ["Bordeaux", "Limoges"] },
    ]
  },
  {
    code: "JP", name: "Japan", states: [
      { code: "13", name: "Tokyo", cities: ["Tokyo", "Hachioji"] },
      { code: "27", name: "Osaka", cities: ["Osaka", "Sakai"] },
      { code: "23", name: "Aichi", cities: ["Nagoya", "Toyota"] },
    ]
  },
  {
    code: "AU", name: "Australia", states: [
      { code: "NSW", name: "New South Wales", cities: ["Sydney", "Newcastle"] },
      { code: "VIC", name: "Victoria", cities: ["Melbourne", "Geelong"] },
      { code: "QLD", name: "Queensland", cities: ["Brisbane", "Gold Coast"] },
    ]
  },
  {
    code: "SG", name: "Singapore", states: [
      { code: "SG", name: "Singapore", cities: ["Singapore"] },
    ]
  },
  {
    code: "KR", name: "South Korea", states: [
      { code: "11", name: "Seoul", cities: ["Seoul"] },
      { code: "26", name: "Busan", cities: ["Busan"] },
      { code: "27", name: "Daegu", cities: ["Daegu"] },
    ]
  },
  {
    code: "RU", name: "Russia", states: [
      { code: "MOW", name: "Moscow", cities: ["Moscow"] },
      { code: "SPE", name: "Saint Petersburg", cities: ["Saint Petersburg"] },
      { code: "NGR", name: "Novgorod", cities: ["Veliky Novgorod"] },
    ]
  },
];

export function getStatesByCountry(countryCode: string) {
  const country = countryData.find(c => c.code === countryCode);
  return country ? country.states : [];
}

export function getCitiesByCountryState(countryCode: string, stateCode: string) {
  const country = countryData.find(c => c.code === countryCode);
  const state = country?.states.find((s: any) => s.code === stateCode);
  return state ? state.cities : [];
} 