"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ActivityItem } from "@/lib/mock-data"
import { Camera, RefreshCw, AlertTriangle } from "lucide-react"

interface ActivityFeedProps {
  activities: ActivityItem[]
  onStopSelect: (stopId: string) => void
}

const typeIcons: Record<string, typeof Camera> = {
  survey: Camera,
  "amenity-change": RefreshCw,
  alert: AlertTriangle,
}

const typeColors: Record<string, string> = {
  survey: "text-primary bg-primary/10",
  "amenity-change": "text-muted-foreground bg-muted",
  alert: "text-foreground bg-muted",
}

export function ActivityFeed({ activities, onStopSelect }: ActivityFeedProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <ScrollArea className="h-[280px] px-4">
          <div className="flex flex-col gap-2">
            {activities.map((item) => {
              const Icon = typeIcons[item.type] || Camera
              const colorClass = typeColors[item.type] || "text-muted-foreground bg-muted"
              return (
                <button
                  type="button"
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/50"
                  onClick={() => onStopSelect(item.stopId)}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.stopName}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {new Date(item.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
