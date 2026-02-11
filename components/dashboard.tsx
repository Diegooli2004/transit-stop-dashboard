"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { stops, recentActivity, routeCoordinates, AMENITY_LABELS } from "@/lib/mock-data"
import { StatsCards } from "@/components/stats-cards"
import { AmenityCharts } from "@/components/amenity-charts"
import { ActivityFeed } from "@/components/activity-feed"
import { StopDetailPanel } from "@/components/stop-detail-panel"
import { FilterToolbar } from "@/components/filter-toolbar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Bus, Loader2 } from "lucide-react"

const RouteMap = dynamic(
  () => import("@/components/route-map").then((mod) => ({ default: mod.RouteMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/30 rounded-lg">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-xs">Loading map...</span>
        </div>
      </div>
    ),
  }
)

export function Dashboard() {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [amenityFilter, setAmenityFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filteredStops = useMemo(() => {
    let result = stops

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      )
    }

    if (amenityFilter) {
      result = result.filter((s) => {
        const amenity = s.amenities[amenityFilter as keyof typeof s.amenities]
        return amenity && amenity.detected
      })
    }

    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter)
    }

    return result
  }, [searchQuery, amenityFilter, statusFilter])

  const selectedStop = useMemo(
    () => stops.find((s) => s.id === selectedStopId) || null,
    [selectedStopId]
  )

  const handleStopSelect = useCallback((stopId: string) => {
    setSelectedStopId((prev) => (prev === stopId ? null : stopId))
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedStopId(null)
  }, [])

  const handleExportCSV = useCallback(() => {
    const amenityKeys = Object.keys(AMENITY_LABELS)
    const headers = [
      "Stop ID",
      "Stop Name",
      "Direction",
      "Latitude",
      "Longitude",
      "Status",
      "Last Surveyed",
      ...amenityKeys.map((k) => `${AMENITY_LABELS[k]} Detected`),
      ...amenityKeys.map((k) => `${AMENITY_LABELS[k]} Confidence`),
    ]

    const rows = filteredStops.map((stop) => [
      stop.id,
      stop.name,
      stop.direction,
      stop.lat,
      stop.lon,
      stop.status,
      stop.lastSurveyed || "N/A",
      ...amenityKeys.map((k) => {
        const a = stop.amenities[k as keyof typeof stop.amenities]
        return a?.detected ? "Yes" : "No"
      }),
      ...amenityKeys.map((k) => {
        const a = stop.amenities[k as keyof typeof stop.amenities]
        return a ? (a.confidence * 100).toFixed(0) + "%" : "0%"
      }),
    ])

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transit-stop-amenities.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredStops])

  const lastSurveyDate = useMemo(() => {
    const dates = stops
      .filter((s) => s.lastSurveyed)
      .map((s) => new Date(s.lastSurveyed))
      .sort((a, b) => b.getTime() - a.getTime())
    return dates.length > 0
      ? dates[0].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "N/A"
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 border-b bg-card px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">Transit Stop Amenity Dashboard</h1>
              <p className="text-xs text-muted-foreground">Route 030 - J Street &middot; Sacramento RT</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="rounded bg-muted px-2 py-1">
              Last survey: <span className="font-medium text-foreground">{lastSurveyDate}</span>
            </span>
            <span className="rounded bg-muted px-2 py-1">
              <span className="font-medium text-foreground">{filteredStops.length}</span> of {stops.length} stops
            </span>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="shrink-0 border-b bg-card px-4 py-2.5 lg:px-6">
        <FilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          amenityFilter={amenityFilter}
          onAmenityFilterChange={setAmenityFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onExportCSV={handleExportCSV}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map + Dashboard */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Map Section */}
          <div className="h-[400px] shrink-0 p-4 pb-2 lg:h-[450px] lg:px-6">
            <Card className="h-full overflow-hidden border-border/60">
              <CardContent className="h-full p-0">
                <RouteMap
                  stops={filteredStops}
                  routeCoordinates={routeCoordinates}
                  selectedStopId={selectedStopId}
                  onStopSelect={handleStopSelect}
                  amenityFilter={amenityFilter}
                />
              </CardContent>
            </Card>
          </div>

          {/* Stats + Charts */}
          <div className="flex flex-col gap-4 p-4 pt-2 lg:px-6">
            <StatsCards stops={filteredStops} />
            <Separator />
            <AmenityCharts stops={filteredStops} />
            <ActivityFeed activities={recentActivity} onStopSelect={handleStopSelect} />
          </div>
        </div>

        {/* Stop Detail Sidebar */}
        <aside className="hidden w-[320px] shrink-0 border-l bg-card lg:block">
          <StopDetailPanel stop={selectedStop} onClose={handleCloseDetail} />
        </aside>
      </div>
    </div>
  )
}
