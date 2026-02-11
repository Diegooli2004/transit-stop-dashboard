export interface AmenityData {
  detected: boolean
  confidence: number
}

export interface Stop {
  id: string
  name: string
  lat: number
  lon: number
  direction: "Inbound" | "Outbound"
  lastSurveyed: string
  status: "recent" | "needs-update" | "no-data"
  amenities: {
    bench: AmenityData
    shelter: AmenityData
    lighting: AmenityData
    bikeRack: AmenityData
    trashCan: AmenityData
    realtimeDisplay: AmenityData
  }
  imageUrl: string
}

export interface ActivityItem {
  id: string
  stopId: string
  stopName: string
  timestamp: string
  type: "survey" | "amenity-change" | "alert"
  description: string
}

export const AMENITY_LABELS: Record<string, string> = {
  bench: "Bench",
  shelter: "Shelter",
  lighting: "Lighting",
  bikeRack: "Bike Rack",
  trashCan: "Trash Can",
  realtimeDisplay: "Real-time Display",
}

// Seed-based pseudo-random to keep data stable across renders
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateAmenities(seed: number, tier: "high" | "mid" | "low" | "none") {
  if (tier === "none") {
    return {
      bench: { detected: false, confidence: 0 },
      shelter: { detected: false, confidence: 0 },
      lighting: { detected: false, confidence: 0 },
      bikeRack: { detected: false, confidence: 0 },
      trashCan: { detected: false, confidence: 0 },
      realtimeDisplay: { detected: false, confidence: 0 },
    }
  }
  const r = (offset: number) => seededRandom(seed + offset)
  const high = (o: number) => ({ detected: true, confidence: 0.82 + r(o) * 0.17 })
  const maybe = (o: number, chance: number) => {
    const v = r(o)
    return v < chance ? { detected: true, confidence: 0.6 + v * 0.35 } : { detected: false, confidence: v * 0.2 }
  }

  if (tier === "high") {
    return {
      bench: high(1),
      shelter: high(2),
      lighting: high(3),
      bikeRack: maybe(4, 0.6),
      trashCan: high(5),
      realtimeDisplay: maybe(6, 0.5),
    }
  }
  if (tier === "mid") {
    return {
      bench: maybe(1, 0.75),
      shelter: maybe(2, 0.4),
      lighting: high(3),
      bikeRack: maybe(4, 0.25),
      trashCan: maybe(5, 0.65),
      realtimeDisplay: maybe(6, 0.2),
    }
  }
  // low
  return {
    bench: maybe(1, 0.4),
    shelter: maybe(2, 0.15),
    lighting: maybe(3, 0.7),
    bikeRack: maybe(4, 0.1),
    trashCan: maybe(5, 0.35),
    realtimeDisplay: { detected: false, confidence: r(6) * 0.1 },
  }
}

// All 54 real stops from SacRT Route 030 - J Street
const RAW_STOPS: { name: string; id: string; lat: number; lon: number; direction: "Inbound" | "Outbound" }[] = [
  // Inbound only (34 stops: Amtrak Depot -> CSUS)
  { name: "AMTRAK & DEPOT (WB)", id: "282", lat: 38.5845, lon: -121.5002, direction: "Inbound" },
  { name: "5TH ST & I ST (NB)", id: "281", lat: 38.5830, lon: -121.4996, direction: "Inbound" },
  { name: "J ST & 6TH ST (EB)", id: "413", lat: 38.5821, lon: -121.4981, direction: "Inbound" },
  { name: "J ST & 7TH ST (EB)", id: "414", lat: 38.5816, lon: -121.4968, direction: "Inbound" },
  { name: "J ST & 8TH ST (EB)", id: "415", lat: 38.5812, lon: -121.4955, direction: "Inbound" },
  { name: "J ST & 9TH ST (EB)", id: "416", lat: 38.5807, lon: -121.4944, direction: "Inbound" },
  { name: "J ST & 10TH ST (EB)", id: "417", lat: 38.5802, lon: -121.4933, direction: "Inbound" },
  { name: "J ST & 11TH ST (EB)", id: "418", lat: 38.5798, lon: -121.4917, direction: "Inbound" },
  { name: "J ST & 13TH ST (EB)", id: "419", lat: 38.5792, lon: -121.4898, direction: "Inbound" },
  { name: "J ST & 15TH ST (EB)", id: "420", lat: 38.5784, lon: -121.4865, direction: "Inbound" },
  { name: "J ST & 17TH ST (EB)", id: "421", lat: 38.5777, lon: -121.4839, direction: "Inbound" },
  { name: "J ST & 19TH ST (EB)", id: "1718", lat: 38.5768, lon: -121.4808, direction: "Inbound" },
  { name: "J ST & 21ST ST (EB)", id: "422", lat: 38.5761, lon: -121.4780, direction: "Inbound" },
  { name: "J ST & 23RD ST (EB)", id: "423", lat: 38.5754, lon: -121.4752, direction: "Inbound" },
  { name: "ALHAMBRA BLVD & K ST (SB)", id: "1705", lat: 38.5743, lon: -121.4720, direction: "Inbound" },
  { name: "J ST & 29TH ST (EB)", id: "424", lat: 38.5738, lon: -121.4690, direction: "Inbound" },
  { name: "J ST & 33RD ST (EB)", id: "425", lat: 38.5725, lon: -121.4645, direction: "Inbound" },
  { name: "J ST & 35TH ST (EB)", id: "426", lat: 38.5718, lon: -121.4620, direction: "Inbound" },
  { name: "J ST & 37TH ST (EB)", id: "427", lat: 38.5711, lon: -121.4593, direction: "Inbound" },
  { name: "J ST & 39TH ST (EB)", id: "428", lat: 38.5703, lon: -121.4565, direction: "Inbound" },
  { name: "J ST & 41ST ST (EB)", id: "429", lat: 38.5696, lon: -121.4538, direction: "Inbound" },
  { name: "J ST & 43RD ST (EB)", id: "430", lat: 38.5689, lon: -121.4510, direction: "Inbound" },
  { name: "J ST & 45TH ST (EB)", id: "431", lat: 38.5682, lon: -121.4483, direction: "Inbound" },
  { name: "J ST & 47TH ST (EB)", id: "432", lat: 38.5675, lon: -121.4455, direction: "Inbound" },
  { name: "J ST & 49TH ST (EB)", id: "433", lat: 38.5668, lon: -121.4428, direction: "Inbound" },
  { name: "J ST & 51ST ST (EB)", id: "434", lat: 38.5662, lon: -121.4400, direction: "Inbound" },
  { name: "J ST & 53RD ST (EB)", id: "435", lat: 38.5656, lon: -121.4372, direction: "Inbound" },
  { name: "J ST & 55TH ST (EB)", id: "436", lat: 38.5650, lon: -121.4345, direction: "Inbound" },
  { name: "J ST & 56TH ST (EB)", id: "437", lat: 38.5648, lon: -121.4330, direction: "Inbound" },
  { name: "FOLSOM BLVD & HORNET DR (EB)", id: "270", lat: 38.5624, lon: -121.4265, direction: "Inbound" },
  { name: "FOLSOM BLVD & COLLEGE TOWN DR (EB)", id: "271", lat: 38.5611, lon: -121.4235, direction: "Inbound" },
  { name: "STATE UNIV DR SOUTH & COLLEGE TOWN DR (NB)", id: "273", lat: 38.5604, lon: -121.4220, direction: "Inbound" },
  { name: "STATE UNIV DR NORTH & JED SMITH DR (SB)", id: "274", lat: 38.5595, lon: -121.4210, direction: "Inbound" },
  { name: "CARLSON DR & STATE UNIV DRIVE NORTH (EB)", id: "275", lat: 38.5585, lon: -121.4195, direction: "Inbound" },
]

// Assign statuses and survey dates deterministically
function assignStatus(index: number, total: number): { status: Stop["status"]; lastSurveyed: string } {
  const r = seededRandom(index * 7 + 3)
  // Downtown / major stops get recent, east sac gets more stale, some get no data
  if (index < total * 0.35) {
    // Downtown / near-downtown: mostly recent
    if (r < 0.15) return { status: "needs-update", lastSurveyed: "2024-01-28T10:00:00Z" }
    return { status: "recent", lastSurveyed: `2024-02-${String(8 + Math.floor(r * 3)).padStart(2, "0")}T${String(8 + Math.floor(r * 10)).padStart(2, "0")}:${String(Math.floor(r * 59)).padStart(2, "0")}:00Z` }
  }
  if (index < total * 0.7) {
    // Midtown: mix
    if (r < 0.2) return { status: "recent", lastSurveyed: "2024-02-09T14:30:00Z" }
    if (r < 0.35) return { status: "no-data", lastSurveyed: "" }
    return { status: "needs-update", lastSurveyed: `2024-02-0${1 + Math.floor(r * 5)}T09:00:00Z` }
  }
  // East sac / CSUS: more gaps
  if (r < 0.3) return { status: "needs-update", lastSurveyed: "2024-01-25T11:00:00Z" }
  if (r < 0.55) return { status: "no-data", lastSurveyed: "" }
  return { status: "needs-update", lastSurveyed: `2024-02-0${1 + Math.floor(r * 3)}T08:00:00Z` }
}

function amenityTier(status: Stop["status"], index: number): "high" | "mid" | "low" | "none" {
  if (status === "no-data") return "none"
  const r = seededRandom(index * 13 + 7)
  if (status === "recent") return r < 0.6 ? "high" : "mid"
  return r < 0.3 ? "mid" : "low"
}

export const stops: Stop[] = RAW_STOPS.map((raw, i) => {
  const { status, lastSurveyed } = assignStatus(i, RAW_STOPS.length)
  const tier = amenityTier(status, i)
  return {
    id: raw.id,
    name: raw.name,
    lat: raw.lat,
    lon: raw.lon,
    direction: raw.direction,
    lastSurveyed,
    status,
    amenities: generateAmenities(i * 100 + 42, tier),
    imageUrl: status !== "no-data" ? `/stops/${raw.id}.jpg` : "",
  }
})

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    stopId: "282",
    stopName: "AMTRAK & DEPOT (WB)",
    timestamp: "2024-02-10T14:30:00Z",
    type: "survey",
    description: "Route survey completed - 5 amenities detected at depot",
  },
  {
    id: "a2",
    stopId: "417",
    stopName: "J ST & 10TH ST (EB)",
    timestamp: "2024-02-10T14:35:00Z",
    type: "survey",
    description: "Route survey completed - 4 amenities detected",
  },
  {
    id: "a3",
    stopId: "1705",
    stopName: "ALHAMBRA BLVD & K ST (SB)",
    timestamp: "2024-02-09T10:20:00Z",
    type: "amenity-change",
    description: "Shelter no longer detected at this stop",
  },
  {
    id: "a4",
    stopId: "430",
    stopName: "J ST & 43RD ST (EB)",
    timestamp: "2024-02-08T16:10:00Z",
    type: "alert",
    description: "Only 1 amenity detected - possible camera obstruction",
  },
  {
    id: "a5",
    stopId: "275",
    stopName: "CARLSON DR & STATE UNIV DRIVE NORTH (EB)",
    timestamp: "2024-02-07T09:00:00Z",
    type: "survey",
    description: "End-of-line survey - 3 amenities detected near CSUS",
  },
  {
    id: "a6",
    stopId: "420",
    stopName: "J ST & 15TH ST (EB)",
    timestamp: "2024-02-06T11:45:00Z",
    type: "amenity-change",
    description: "New bike rack detected at midtown stop",
  },
  {
    id: "a7",
    stopId: "434",
    stopName: "J ST & 51ST ST (EB)",
    timestamp: "2024-02-05T08:30:00Z",
    type: "alert",
    description: "No amenities detected - stop may need field verification",
  },
]

// Route polyline: Inbound path from Amtrak Depot east on J St, then SE on Folsom Blvd to CSUS
export const routeCoordinates: [number, number][] = [
  // Amtrak Depot area - south on 5th St
  [38.5845, -121.5002],
  [38.5830, -121.4996],
  // Turn east onto J Street
  [38.5821, -121.4981],
  [38.5816, -121.4968],
  [38.5812, -121.4955],
  [38.5807, -121.4944],
  [38.5802, -121.4933],
  [38.5798, -121.4917],
  [38.5792, -121.4898],
  // J Street through Midtown - gentle SE diagonal
  [38.5784, -121.4865],
  [38.5777, -121.4839],
  [38.5768, -121.4808],
  [38.5761, -121.4780],
  [38.5754, -121.4752],
  [38.5743, -121.4720],
  [38.5738, -121.4690],
  // J Street through East Sacramento
  [38.5725, -121.4645],
  [38.5718, -121.4620],
  [38.5711, -121.4593],
  [38.5703, -121.4565],
  [38.5696, -121.4538],
  [38.5689, -121.4510],
  [38.5682, -121.4483],
  [38.5675, -121.4455],
  [38.5668, -121.4428],
  [38.5662, -121.4400],
  [38.5656, -121.4372],
  [38.5650, -121.4345],
  [38.5648, -121.4330],
  // Transition to Folsom Blvd - curves south-east to CSUS
  [38.5640, -121.4305],
  [38.5624, -121.4265],
  [38.5611, -121.4235],
  [38.5604, -121.4220],
  [38.5595, -121.4210],
  [38.5585, -121.4195],
]
