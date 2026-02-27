"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartConfig = {
  revenue: {
    label: "Paid Revenue",
    color: "#10b981", // Vibrant Emerald
  },
  volume: {
    label: "Order Volume",
    color: "#6366f1", // Sleek Indigo
  }
}

export const ChartAreaInteractive = React.memo(function ChartAreaInteractive({ data = [], timeRange, onTimeRangeChange }) {
  const isMobile = useIsMobile()

  const isEmpty = data.length === 0 || data.every(d => d.revenue === 0 && d.volume === 0);

  return (
    <div className="w-full">
      <Card className="flex flex-col border border-border/40 bg-card shadow-sm transition-all duration-300 rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 px-6 pt-6">
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Performance Overview
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
            </CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              Live transactional stream monitoring for your company.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-2 md:px-4 pt-4 sm:pt-6 pb-6">
          <div className="relative h-[320px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart
                data={isEmpty ? [
                  { date: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(), revenue: 0, volume: 0 },
                  { date: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), revenue: 0, volume: 0 }
                ] : data}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-volume)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-volume)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="hsl(var(--border))"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={30}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    if (timeRange === 'this-week' || timeRange === 'week') {
                      return date.toLocaleDateString("en-IN", {
                        weekday: "short",
                      }).toLowerCase();
                    }
                    return date.toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  className="text-xs font-medium text-muted-foreground/80"
                />
                <YAxis
                  hide={isMobile}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value === 0 ? "₹0" : value > 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`}
                  className="text-xs font-medium text-muted-foreground/70"
                />
                <ChartTooltip
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={
                    <ChartTooltipContent
                      className="bg-card backdrop-blur-md border-border/40 shadow-lg rounded-xl p-3 min-w-[180px]"
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return (
                          <div className="flex flex-col gap-0.5 mb-2 border-b border-border/40 pb-2">
                            <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-widest">Timeline Snapshot</span>
                            <span className="text-sm font-bold text-foreground">
                              {date.toLocaleDateString("en-IN", {
                                weekday: 'short',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        );
                      }}
                      formatter={(value, name) => (
                        <div className="flex items-center justify-between w-full py-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="size-2 rounded-full shadow-sm"
                              style={{ backgroundColor: chartConfig[name]?.color }}
                            />
                            <span className="text-xs font-medium text-muted-foreground">
                              {chartConfig[name]?.label}
                            </span>
                          </div>
                          <span className="text-sm font-bold tabular-nums">
                            {name === "revenue" ? `₹${value.toLocaleString('en-IN')}` : value.toLocaleString()}
                          </span>
                        </div>
                      )}
                      indicator="line"
                    />
                  }
                />
                <Area
                  dataKey="volume"
                  type="monotone"
                  fill="url(#fillVolume)"
                  stroke="var(--color-volume)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
