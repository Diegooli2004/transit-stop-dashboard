"use client"

import { type Stop, AMENITY_LABELS } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MapPin, Clock, CheckCircle2, XCircle, X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StopDetailPanelProps {
  stop: Stop | null
  onClose: () => void
}

export function StopDetailPanel({ stop, onClose }: StopDetailPanelProps) {
  if (!stop) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-sm font-semibold text-foreground">No Stop Selected</h3>
        <p className="text-xs text-muted-foreground">Click a stop on the map to view its amenity details.</p>
      </div>
    )
  }

  const lastSurveyed = stop.lastSurveyed
    ? new Date(stop.lastSurveyed).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never"

  const amenityEntries = Object.entries(stop.amenities) as [string, { detected: boolean; confidence: number }][]
  const detectedCount = amenityEntries.filter(([, v]) => v.detected).length

  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{stop.name}</h3>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              ID: {stop.id} &middot; {stop.direction}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close stop details</span>
          </Button>
        </div>

        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {lastSurveyed}
          </span>
          <Badge
            variant={stop.status === "recent" ? "default" : stop.status === "needs-update" ? "secondary" : "outline"}
            className={`text-[10px] px-1.5 py-0 ${
              stop.status === "recent"
                ? "bg-primary text-primary-foreground"
                : stop.status === "needs-update"
                  ? "bg-muted text-muted-foreground"
                  : ""
            }`}
          >
            {stop.status === "recent" ? "Recent" : stop.status === "needs-update" ? "Needs Update" : "No Data"}
          </Badge>
        </div>

        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Amenities Detected</span>
            <span className="font-mono text-muted-foreground">
              {detectedCount}/{amenityEntries.length}
            </span>
          </div>
          <Progress value={(detectedCount / amenityEntries.length) * 100} className="h-2" />
        </div>

        {stop.imageUrl ? (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Latest Capture</span>
            </div>
            <div className="rounded-lg bg-muted flex items-center justify-center h-32 text-xs text-muted-foreground">
              Camera image placeholder
            </div>
          </div>
        ) : null}

        <Separator className="mb-3" />

        <h4 className="mb-2 text-xs font-semibold text-foreground uppercase tracking-wider">Amenity Details</h4>
        <div className="flex flex-col gap-2">
          {amenityEntries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                {value.detected ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-foreground">{AMENITY_LABELS[key] || key}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16">
                  <Progress
                    value={value.confidence * 100}
                    className="h-1.5"
                  />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                  {(value.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
