"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AMENITY_LABELS } from "@/lib/mock-data"
import { Search, Download, Filter, X } from "lucide-react"

interface FilterToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  amenityFilter: string | null
  onAmenityFilterChange: (value: string | null) => void
  statusFilter: string | null
  onStatusFilterChange: (value: string | null) => void
  onExportCSV: () => void
}

export function FilterToolbar({
  searchQuery,
  onSearchChange,
  amenityFilter,
  onAmenityFilterChange,
  statusFilter,
  onStatusFilterChange,
  onExportCSV,
}: FilterToolbarProps) {
  const hasFilters = searchQuery || amenityFilter || statusFilter

  const clearFilters = () => {
    onSearchChange("")
    onAmenityFilterChange(null)
    onStatusFilterChange(null)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stops..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={amenityFilter || "all"}
          onValueChange={(v) => onAmenityFilterChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="h-9 w-[160px] text-xs">
            <SelectValue placeholder="Amenity filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Amenities</SelectItem>
            {Object.entries(AMENITY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select
        value={statusFilter || "all"}
        onValueChange={(v) => onStatusFilterChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="h-9 w-[150px] text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="recent">Recent</SelectItem>
          <SelectItem value="needs-update">Needs Update</SelectItem>
          <SelectItem value="no-data">No Data</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs text-muted-foreground" onClick={clearFilters}>
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}

      <div className="ml-auto">
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs bg-transparent" onClick={onExportCSV}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
