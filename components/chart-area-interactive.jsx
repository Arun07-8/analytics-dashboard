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
    label: "Total Revenue",
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
      <Card className="flex flex-col border-0 shadow-none bg-transparent">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 px-0">
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
          <CardAction>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(val) => val && onTimeRangeChange(val)}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex bg-card p-1 rounded-lg h-10 border border-border/40 shadow-sm">
              <ToggleGroupItem value="today" className="text-xs font-medium rounded-lg">Today</ToggleGroupItem>
              <ToggleGroupItem value="yesterday" className="text-xs font-medium rounded-lg">Yesterday</ToggleGroupItem>
              <ToggleGroupItem value="this-week" className="text-xs font-medium rounded-lg">Week</ToggleGroupItem>
              <ToggleGroupItem value="this-month" className="text-xs font-medium rounded-lg">Month</ToggleGroupItem>
              <ToggleGroupItem value="this-year" className="text-xs font-medium rounded-lg">Year</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger
                className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden h-10 bg-card border-border/40 shadow-sm font-medium text-xs rounded-lg"
                size="sm"
                aria-label="Select range">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-lg">
                <SelectItem value="today" className="text-xs font-medium">Today</SelectItem>
                <SelectItem value="yesterday" className="text-xs font-medium">Yesterday</SelectItem>
                <SelectItem value="this-week" className="text-xs font-medium">This Week</SelectItem>
                <SelectItem value="this-month" className="text-xs font-medium">This Month</SelectItem>
                <SelectItem value="this-year" className="text-xs font-medium">This Year</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>

        <CardContent className="px-0 pt-4 sm:pt-6">
          <div className="relative h-[320px] w-full">
            {isEmpty && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px] z-10 rounded-2xl border-2 border-dashed border-border/30">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Waiting for Data Stream...</p>
              </div>
            )}
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                  stackId="a"
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
