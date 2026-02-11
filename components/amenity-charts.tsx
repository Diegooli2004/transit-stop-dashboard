"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Stop, AMENITY_LABELS } from "@/lib/mock-data"
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface AmenityChartsProps {
  stops: Stop[]
}

const CHART_COLORS = [
  "hsl(226, 20%, 28%)",
  "hsl(220, 9%, 46%)",
  "hsl(220, 14%, 62%)",
  "hsl(226, 20%, 38%)",
  "hsl(220, 14%, 74%)",
  "hsl(220, 9%, 54%)",
]

export function AmenityCharts({ stops }: AmenityChartsProps) {
  const amenityKeys = Object.keys(AMENITY_LABELS)

  const barData = amenityKeys.map((key) => {
    const count = stops.filter((s) => {
      const amenity = s.amenities[key as keyof typeof s.amenities]
      return amenity && amenity.detected
    }).length
    return {
      name: AMENITY_LABELS[key],
      count,
      fill: CHART_COLORS[amenityKeys.indexOf(key) % CHART_COLORS.length],
    }
  })

  const pieData = [
    { name: "Recent", value: stops.filter((s) => s.status === "recent").length, fill: "hsl(226, 20%, 28%)" },
    { name: "Needs Update", value: stops.filter((s) => s.status === "needs-update").length, fill: "hsl(220, 9%, 52%)" },
    { name: "No Data", value: stops.filter((s) => s.status === "no-data").length, fill: "hsl(220, 14%, 80%)" },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Amenity Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(220, 9%, 46%)" }}
                axisLine={{ stroke: "hsl(220, 13%, 89%)" }}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={55}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(220, 9%, 46%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 89%)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Survey Status</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 89%)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
