"use client"

import { useState, useEffect } from "react"
import type { Stop, ActivityItem } from "@/lib/mock-data"
import { stops as mockStops, recentActivity as mockActivity, routeCoordinates as mockRoute } from "@/lib/mock-data"

const SURVEY_JSON_URL = "/data/stops_output.json"

export interface SurveyData {
  stops: Stop[]
  recentActivity: ActivityItem[]
  routeCoordinates: [number, number][]
}

function isSurveyData(raw: unknown): raw is SurveyData {
  if (!raw || typeof raw !== "object") return false
  const o = raw as Record<string, unknown>
  return Array.isArray(o.stops) && Array.isArray(o.recentActivity) && Array.isArray(o.routeCoordinates)
}

export function useSurveyData(): {
  stops: Stop[]
  recentActivity: ActivityItem[]
  routeCoordinates: [number, number][]
  loading: boolean
  fromSurvey: boolean
} {
  const [data, setData] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(SURVEY_JSON_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Not found"))))
      .then((raw) => {
        if (cancelled) return
        if (isSurveyData(raw)) setData(raw)
        else setData(null)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (data) {
    return {
      stops: data.stops,
      recentActivity: data.recentActivity,
      routeCoordinates: data.routeCoordinates,
      loading: false,
      fromSurvey: true,
    }
  }

  return {
    stops: mockStops,
    recentActivity: mockActivity,
    routeCoordinates: mockRoute,
    loading,
    fromSurvey: false,
  }
}
