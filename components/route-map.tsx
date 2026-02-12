"use client"

import { useEffect, useRef, useState } from "react"
import type { Stop } from "@/lib/mock-data"
import { AMENITY_LABELS } from "@/lib/mock-data"
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

function escapeHtml(text: string): string {
  const el = document.createElement("div")
  el.textContent = text
  return el.innerHTML
}

function getStopHoverContent(stop: Stop): string {
  const name = escapeHtml(stop.name)
  const detected = Object.entries(stop.amenities)
    .filter(([, v]) => v.detected)
    .map(([key]) => AMENITY_LABELS[key] || key)
  const amenityText = detected.length > 0 ? detected.join(", ") : "No amenities detected"
  const imgHtml = stop.imageUrl
    ? `<img src="${stop.imageUrl}" alt="" class="stop-hover-tooltip-img" />`
    : ""
  return `
    <div class="stop-hover-tooltip-content">
      <div class="stop-hover-tooltip-name">${name}</div>
      ${imgHtml}
      <div class="stop-hover-tooltip-amenities">${escapeHtml(amenityText)}</div>
    </div>
  `
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
      center: [38.5758, -121.477],
      zoom: 15,
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
        .bindTooltip(getStopHoverContent(stop), {
          direction: "top",
          offset: [0, -12],
          className: "stop-hover-tooltip",
          permanent: false,
          sticky: false,
          interactive: true,
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
        .stop-hover-tooltip {
          font-family: var(--font-inter), sans-serif;
          font-size: 12px;
          padding: 0;
          border-radius: 8px;
          border: 1px solid hsl(220, 13%, 89%);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-width: 200px;
          overflow: hidden;
          background: white;
          pointer-events: auto;
        }
        .stop-hover-tooltip-content {
          padding: 8px;
        }
        .stop-hover-tooltip-name {
          font-weight: 600;
          margin-bottom: 6px;
          line-height: 1.2;
          color: hsl(222, 18%, 14%);
        }
        .stop-hover-tooltip-img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 6px;
          display: block;
        }
        .stop-hover-tooltip-amenities {
          font-size: 11px;
          color: hsl(220, 9%, 46%);
          line-height: 1.3;
        }
        .custom-stop-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}
