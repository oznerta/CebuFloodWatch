export interface CebuLandmark {
  id: string;
  name: string;
  category: 'barangay' | 'landmark' | 'road' | 'hospital' | 'sensor' | 'shelter';
  barangay: string;
  latitude: number;
  longitude: number;
  description: string;
  searchTags: string[];
}

export const METRO_CEBU_LANDMARKS: CebuLandmark[] = [
  // 1. Critical Commercial & Urban Landmarks
  {
    id: 'it_park',
    name: 'Cebu IT Park',
    category: 'landmark',
    barangay: 'Lahug',
    latitude: 10.3297,
    longitude: 123.9063,
    description: 'Major BPO & tech hub, high elevation commercial district.',
    searchTags: ['it park', 'lahug', 'bpo', 'waterfront', 'apang', 'garden bloc'],
  },
  {
    id: 'sm_city_cebu',
    name: 'SM City Cebu',
    category: 'landmark',
    barangay: 'Mabolo',
    latitude: 10.3117,
    longitude: 123.9181,
    description: 'North Reclamation Area commercial complex and transport terminal.',
    searchTags: ['sm', 'sm city', 'mabolo', 'north reclamation', 'mall', 'terminal'],
  },
  {
    id: 'sm_seaside',
    name: 'SM Seaside City Cebu',
    category: 'landmark',
    barangay: 'Mambaling',
    latitude: 10.2818,
    longitude: 123.8814,
    description: 'South Road Properties (SRP) mega complex.',
    searchTags: ['sm seaside', 'srp', 'south road', 'mambaling', 'cube'],
  },
  {
    id: 'ayala_center_cebu',
    name: 'Ayala Center Cebu',
    category: 'landmark',
    barangay: 'Luz',
    latitude: 10.3175,
    longitude: 123.9056,
    description: 'Cebu Business Park primary shopping and business hub.',
    searchTags: ['ayala', 'business park', 'luz', 'mall', 'terraces'],
  },
  {
    id: 'fuente_osmena',
    name: 'Fuente Osmeña Circle',
    category: 'landmark',
    barangay: 'Capitol Site',
    latitude: 10.3111,
    longitude: 123.8937,
    description: 'Central urban rotary connecting Osmeña Blvd and B. Rodriguez.',
    searchTags: ['fuente', 'osmena', 'rotunda', 'capitol site', 'uptown'],
  },
  {
    id: 'cebu_capitol',
    name: 'Cebu Provincial Capitol',
    category: 'landmark',
    barangay: 'Capitol Site',
    latitude: 10.3168,
    longitude: 123.8894,
    description: 'Seat of provincial government, elevated junction.',
    searchTags: ['capitol', 'provincial', 'escario', 'gov'],
  },
  {
    id: 'colon_street',
    name: 'Colon Street',
    category: 'road',
    barangay: 'Pari-an',
    latitude: 10.2974,
    longitude: 123.8996,
    description: 'Oldest national road in the Philippines, historic downtown corridor.',
    searchTags: ['colon', 'downtown', 'parian', 'uv', 'gullas', 'historical'],
  },
  {
    id: 'carbon_market',
    name: 'Carbon Public Market',
    category: 'landmark',
    barangay: 'Ermita',
    latitude: 10.2917,
    longitude: 123.8972,
    description: 'Central agricultural trading and coastal commercial district.',
    searchTags: ['carbon', 'market', 'ermita', 'coastal', 'wharf'],
  },
  {
    id: 'cit_university',
    name: 'Cebu Institute of Technology - University',
    category: 'landmark',
    barangay: 'Basak San Nicolas',
    latitude: 10.2942,
    longitude: 123.8697,
    description: 'Leading engineering and technology university in N. Bacalso corridor.',
    searchTags: ['cit', 'cit-u', 'university', 'basak', 'wildcats', 'technologian'],
  },

  // 2. Critical Corridors & Road Arteries
  {
    id: 'road_mj_cuenco',
    name: 'M.J. Cuenco Avenue Corridor',
    category: 'road',
    barangay: 'Mabolo',
    latitude: 10.3235,
    longitude: 123.9152,
    description: 'Major arterial road subject to Suba river runoff during severe storms.',
    searchTags: ['mj cuenco', 'cuenco', 'mabolo', 'suba', 'arterial'],
  },
  {
    id: 'road_mambaling_underpass',
    name: 'N. Bacalso Avenue (Mambaling Underpass)',
    category: 'road',
    barangay: 'Mambaling',
    latitude: 10.2915,
    longitude: 123.8742,
    description: 'Depressed underpass section prone to deep pooling and complete blockage.',
    searchTags: ['mambaling underpass', 'n bacalso', 'bacalso', 'underpass', 'pooling'],
  },
  {
    id: 'road_jp2_ave',
    name: 'Pope John Paul II Avenue',
    category: 'road',
    barangay: 'Kasambagan',
    latitude: 10.3225,
    longitude: 123.9112,
    description: 'Corridor connecting Mabolo and Cebu Business Park.',
    searchTags: ['john paul', 'jp2', 'kasambagan', 'carmelites', 'waterfront'],
  },
  {
    id: 'road_gorordo_ave',
    name: 'Gorordo Avenue',
    category: 'road',
    barangay: 'Lahug',
    latitude: 10.3218,
    longitude: 123.8985,
    description: 'Key access route from uptown to Lahug and JY Square.',
    searchTags: ['gorordo', 'lahug', 'jy square', 'up cebu'],
  },
  {
    id: 'road_srp_coastal',
    name: 'South Road Properties (SRP) Coastal Expressway',
    category: 'road',
    barangay: 'Mambaling',
    latitude: 10.2856,
    longitude: 123.8768,
    description: 'Multi-lane coastal bypass linking Cebu City to Talisay.',
    searchTags: ['srp', 'coastal', 'expressway', 'talisay', 'cclex'],
  },

  // 3. Hospitals & Emergency Centers
  {
    id: 'hosp_vsmmc',
    name: 'Vicente Sotto Memorial Medical Center (VSMMC)',
    category: 'hospital',
    barangay: 'Sambag II',
    latitude: 10.3102,
    longitude: 123.8906,
    description: 'Level 3 apex regional government training hospital & trauma center.',
    searchTags: ['vsmmc', 'sotto', 'vicente sotto', 'hospital', 'trauma', 'b rodriguez'],
  },
  {
    id: 'hosp_cebu_docs',
    name: 'Cebu Doctors’ University Hospital',
    category: 'hospital',
    barangay: 'Capitol Site',
    latitude: 10.3134,
    longitude: 123.8921,
    description: 'Tertiary medical facility near Fuente Osmeña.',
    searchTags: ['cebu docs', 'cduh', 'hospital', 'osmena blvd', 'doctors'],
  },
  {
    id: 'hosp_chong_hua',
    name: 'Chong Hua Hospital (Fuente & Mandaue)',
    category: 'hospital',
    barangay: 'Capitol Site',
    latitude: 10.3123,
    longitude: 123.8912,
    description: 'Major private tertiary medical institution with advanced ICU.',
    searchTags: ['chong hua', 'hospital', 'fuente', 'icu'],
  },
  {
    id: 'hosp_ccmc',
    name: 'Cebu City Medical Center (CCMC)',
    category: 'hospital',
    barangay: 'Pahina Central',
    latitude: 10.2982,
    longitude: 123.8924,
    description: 'City government public hospital serving downtown communities.',
    searchTags: ['ccmc', 'city medical', 'pahina', 'public hospital'],
  },

  // 4. Hydrological Stream Sensors
  {
    id: 'sensor_mabolo',
    name: 'Mabolo River Hydrological Sensor',
    category: 'sensor',
    barangay: 'Mabolo',
    latitude: 10.325,
    longitude: 123.9167,
    description: 'Real-time telemetry measuring Suba river water height & rainfall rate.',
    searchTags: ['sensor mabolo', 'mabolo river', 'suba river', 'gauge', 'telemetry'],
  },
  {
    id: 'sensor_mahiga',
    name: 'Mahiga Creek Basin Gauge',
    category: 'sensor',
    barangay: 'Kasambagan',
    latitude: 10.334,
    longitude: 123.914,
    description: 'Monitors upstream spillway between Cebu City and Subangdaku.',
    searchTags: ['sensor mahiga', 'mahiga creek', 'kasambagan', 'creek sensor'],
  },
  {
    id: 'sensor_guadalupe',
    name: 'Guadalupe River Midstream Sensor',
    category: 'sensor',
    barangay: 'Guadalupe',
    latitude: 10.328,
    longitude: 123.882,
    description: 'High-elevation catchment sensor tracking water rushing to San Nicolas.',
    searchTags: ['sensor guadalupe', 'guadalupe river', 'upstream', 'catchment'],
  },

  // 5. Evacuation Shelters
  {
    id: 'shelter_mabolo_elem',
    name: 'Mabolo Elementary School Gym',
    category: 'shelter',
    barangay: 'Mabolo',
    latitude: 10.3265,
    longitude: 123.918,
    description: 'Capacity: 350 evacuees. Equipped with generator, clean water & medical post.',
    searchTags: ['mabolo elem', 'mabolo gym', 'evacuation', 'shelter mabolo'],
  },
  {
    id: 'shelter_kasambagan_complex',
    name: 'Kasambagan Sports Complex',
    category: 'shelter',
    barangay: 'Kasambagan',
    latitude: 10.334,
    longitude: 123.914,
    description: 'Capacity: 250 evacuees. High-ground sports arena with relief storage.',
    searchTags: ['kasambagan complex', 'kasambagan gym', 'evacuation', 'sports complex'],
  },
  {
    id: 'shelter_guadalupe_gym',
    name: 'Guadalupe Barangay Gymnasium',
    category: 'shelter',
    barangay: 'Guadalupe',
    latitude: 10.3295,
    longitude: 123.881,
    description: 'Capacity: 500 evacuees. Large community evacuation facility.',
    searchTags: ['guadalupe gym', 'guadalupe shelter', 'evacuation'],
  },

  // 6. Major Metro Cebu Barangays
  {
    id: 'brgy_mabolo',
    name: 'Barangay Mabolo',
    category: 'barangay',
    barangay: 'Mabolo',
    latitude: 10.3255,
    longitude: 123.9165,
    description: 'Commercial & residential barangay near port, home to Mabolo River.',
    searchTags: ['mabolo', 'barangay mabolo', 'carreta', 'suba'],
  },
  {
    id: 'brgy_kasambagan',
    name: 'Barangay Kasambagan',
    category: 'barangay',
    barangay: 'Kasambagan',
    latitude: 10.332,
    longitude: 123.912,
    description: 'Hosts Mahiga creek drainage and commercial corridors.',
    searchTags: ['kasambagan', 'barangay kasambagan', 'mahiga', 'panagdait'],
  },
  {
    id: 'brgy_lahug',
    name: 'Barangay Lahug',
    category: 'barangay',
    barangay: 'Lahug',
    latitude: 10.335,
    longitude: 123.898,
    description: 'High elevation area encompassing Cebu IT Park and JY Square.',
    searchTags: ['lahug', 'barangay lahug', 'it park', 'salinas'],
  },
  {
    id: 'brgy_guadalupe',
    name: 'Barangay Guadalupe',
    category: 'barangay',
    barangay: 'Guadalupe',
    latitude: 10.328,
    longitude: 123.882,
    description: 'Largest residential barangay in Cebu City along Guadalupe River.',
    searchTags: ['guadalupe', 'barangay guadalupe', 'banawa'],
  },
  {
    id: 'brgy_mambaling',
    name: 'Barangay Mambaling',
    category: 'barangay',
    barangay: 'Mambaling',
    latitude: 10.2915,
    longitude: 123.8742,
    description: 'Coastal and low-elevation southern barangay hosting N. Bacalso underpass.',
    searchTags: ['mambaling', 'barangay mambaling', 'underpass', 'alaska'],
  },
  {
    id: 'brgy_banilad',
    name: 'Barangay Banilad',
    category: 'barangay',
    barangay: 'Banilad',
    latitude: 10.342,
    longitude: 123.915,
    description: 'Key junction connecting Cebu City and Mandaue Banilad corridor.',
    searchTags: ['banilad', 'barangay banilad', 'btc', 'country club'],
  },
  {
    id: 'brgy_tejero',
    name: 'Barangay Tejero',
    category: 'barangay',
    barangay: 'Tejero',
    latitude: 10.306,
    longitude: 123.908,
    description: 'Lowland coastal zone along Tejero creek prone to tidal backflows.',
    searchTags: ['tejero', 'barangay tejero', 'tide', 'creek'],
  },
  {
    id: 'brgy_tisa',
    name: 'Barangay Tisa',
    category: 'barangay',
    barangay: 'Tisa',
    latitude: 10.301,
    longitude: 123.875,
    description: 'Residential barangay in southern district with rolling hills.',
    searchTags: ['tisa', 'barangay tisa', 'siomai', 'katipunan'],
  },
];

/**
 * Perform fast fuzzy search over Metro Cebu landmarks
 */
export function searchCebuLandmarks(query: string): CebuLandmark[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();

  return METRO_CEBU_LANDMARKS.filter((item) => {
    if (item.name.toLowerCase().includes(q)) return true;
    if (item.barangay.toLowerCase().includes(q)) return true;
    if (item.description.toLowerCase().includes(q)) return true;
    return item.searchTags.some((tag) => tag.includes(q));
  }).slice(0, 8);
}
