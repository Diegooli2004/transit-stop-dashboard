"use client"

import { useEffect, useRef, useState } from "react"
import type { Stop } from "@/lib/mock-data"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface RouteMapProps {
  stops: Stop[]
  routeCoordinates: [number, number][]
  selectedStopId: string | null
  onStopSelect: (stopId: string) => void
  amenityFilter: string | null
}

const STATUS_COLORS: Record<string, string> = {
  recent: "#3d4f6f",
  "needs-update": "#7a8599",
  "no-data": "#bcc3ce",
}

function createStopIcon(status: string, isSelected: boolean) {
  const color = STATUS_COLORS[status] || "#94a3b8"
  const size = isSelected ? 18 : 12
  const border = isSelected ? 3 : 2
  return L.divIcon({
    className: "custom-stop-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: ${border}px solid #fff;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      ${isSelected ? "box-shadow: 0 0 0 3px rgba(61,79,111,0.4), 0 1px 4px rgba(0,0,0,0.3);" : ""}
    "></div>`,
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  })
}

export function RouteMap({ stops, routeCoordinates, selectedStopId, onStopSelect, amenityFilter }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

  const filteredStops = amenityFilter
    ? stops.filter((s) => {
        const amenity = s.amenities[amenityFilter as keyof typeof s.amenities]
        return amenity && amenity.detected
      })
    : stops

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [38.572, -121.460],
      zoom: 13,
      zoomControl: false,
    })

    L.control.zoom({ position: "topright" }).addTo(map)

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    L.polyline(routeCoordinates, {
      color: "#3d4f6f",
      weight: 4,
      opacity: 0.7,
    }).addTo(map)

    mapInstanceRef.current = map
    setMapReady(true)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return
    const map = mapInstanceRef.current

    for (const m of markersRef.current) {
      m.remove()
    }
    markersRef.current = []

    for (const stop of filteredStops) {
      const isSelected = stop.id === selectedStopId
      const marker = L.marker([stop.lat, stop.lon], {
        icon: createStopIcon(stop.status, isSelected),
      })
        .addTo(map)
        .bindTooltip(stop.name, {
          direction: "top",
          offset: [0, -10],
          className: "stop-tooltip",
        })
        .on("click", () => {
          onStopSelect(stop.id)
        })

      markersRef.current.push(marker)
    }
  }, [filteredStops, selectedStopId, onStopSelect, mapReady])

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStopId || !mapReady) return
    const stop = stops.find((s) => s.id === selectedStopId)
    if (stop) {
      mapInstanceRef.current.setView([stop.lat, stop.lon], 15, { animate: true })
    }
  }, [selectedStopId, stops, mapReady])

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 rounded-md bg-card/95 px-3 py-2 text-xs text-card-foreground shadow-md backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS.recent }} />
          Recently Surveyed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS["needs-update"] }} />
          Needs Update
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS["no-data"] }} />
          No Data
        </span>
      </div>
      <style jsx global>{`
        .stop-tooltip {
          font-family: var(--font-inter), sans-serif;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .custom-stop-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}
