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

// 7 stops on SacRT Route 030 J Street (Outbound) — 16th St to 28th St
const RAW_STOPS: { name: string; id: string; lat: number; lon: number; direction: "Inbound" | "Outbound" }[] = [
  { name: "J ST & 16TH ST (EB)", id: "1716", lat: 38.577968, lon: -121.484995, direction: "Outbound" },
  { name: "J ST & 18TH ST (EB)", id: "1717", lat: 38.577412, lon: -121.482898, direction: "Outbound" },
  { name: "J ST & 19TH ST (EB)", id: "1718", lat: 38.576844, lon: -121.480795, direction: "Outbound" },
  { name: "J ST & 22ND ST (EB)", id: "1720", lat: 38.575857, lon: -121.477049, direction: "Outbound" },
  { name: "J ST & 25TH ST (EB)", id: "1721", lat: 38.574814, lon: -121.473081, direction: "Outbound" },
  { name: "J ST & 27TH ST (EB)", id: "1722", lat: 38.574051, lon: -121.470294, direction: "Outbound" },
  { name: "J ST & 28TH ST (EB)", id: "1723", lat: 38.573724, lon: -121.469031, direction: "Outbound" },
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
    stopId: "1716",
    stopName: "J ST & 16TH ST (EB)",
    timestamp: "2024-02-10T14:30:00Z",
    type: "survey",
    description: "Route survey completed - 5 amenities detected",
  },
  {
    id: "a2",
    stopId: "1718",
    stopName: "J ST & 19TH ST (EB)",
    timestamp: "2024-02-10T14:35:00Z",
    type: "survey",
    description: "Route survey completed - 4 amenities detected",
  },
  {
    id: "a3",
    stopId: "1720",
    stopName: "J ST & 22ND ST (EB)",
    timestamp: "2024-02-09T10:20:00Z",
    type: "amenity-change",
    description: "Shelter no longer detected at this stop",
  },
  {
    id: "a4",
    stopId: "1722",
    stopName: "J ST & 27TH ST (EB)",
    timestamp: "2024-02-08T16:10:00Z",
    type: "alert",
    description: "Only 1 amenity detected - possible camera obstruction",
  },
  {
    id: "a5",
    stopId: "1723",
    stopName: "J ST & 28TH ST (EB)",
    timestamp: "2024-02-07T09:00:00Z",
    type: "survey",
    description: "End-of-segment survey - 3 amenities detected",
  },
  {
    id: "a6",
    stopId: "1717",
    stopName: "J ST & 18TH ST (EB)",
    timestamp: "2024-02-06T11:45:00Z",
    type: "amenity-change",
    description: "New bike rack detected at midtown stop",
  },
  {
    id: "a7",
    stopId: "1721",
    stopName: "J ST & 25TH ST (EB)",
    timestamp: "2024-02-05T08:30:00Z",
    type: "alert",
    description: "No amenities detected - stop may need field verification",
  },
]

// Route polyline: 7 stops on J Street (Outbound) — 16th St to 28th St
export const routeCoordinates: [number, number][] = [
  [38.577968, -121.484995], // 1716
  [38.577412, -121.482898], // 1717
  [38.576844, -121.480795], // 1718
  [38.575857, -121.477049], // 1720
  [38.574814, -121.473081], // 1721
  [38.574051, -121.470294], // 1722
  [38.573724, -121.469031], // 1723
]
