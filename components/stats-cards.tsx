"use client"

import { Card, CardContent } from "@/components/ui/card"
import { type Stop, AMENITY_LABELS } from "@/lib/mock-data"
import { MapPin, Eye, AlertTriangle, CheckCircle2 } from "lucide-react"

interface StatsCardsProps {
  stops: Stop[]
}

export function StatsCards({ stops }: StatsCardsProps) {
  const totalStops = stops.length
  const surveyedStops = stops.filter((s) => s.status !== "no-data").length
  const recentStops = stops.filter((s) => s.status === "recent").length
  const needsUpdate = stops.filter((s) => s.status === "needs-update").length

  const amenityKeys = Object.keys(AMENITY_LABELS)
  const totalDetected = stops.reduce((acc, stop) => {
    return (
      acc +
      amenityKeys.filter((k) => {
        const amenity = stop.amenities[k as keyof typeof stop.amenities]
        return amenity && amenity.detected
      }).length
    )
  }, 0)

  const stats = [
    {
      label: "Total Stops",
      value: totalStops,
      icon: MapPin,
      color: "text-foreground",
      bg: "bg-muted",
    },
    {
      label: "Surveyed",
      value: surveyedStops,
      icon: Eye,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Needs Update",
      value: needsUpdate,
      icon: AlertTriangle,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
    {
      label: "Amenities Found",
      value: totalDetected,
      icon: CheckCircle2,
      color: "text-foreground",
      bg: "bg-primary/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
