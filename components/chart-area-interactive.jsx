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
  desktop: {
    label: "Total Revenue",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Order Volume",
    color: "hsl(var(--chart-2))",
  }
}

export function ChartAreaInteractive({ data = [], timeRange, onTimeRangeChange }) {
  const isMobile = useIsMobile()

  const isEmpty = data.length === 0 || data.every(d => d.desktop === 0 && d.mobile === 0);

  return (
    <Card className="@container/card bg-card/40 backdrop-blur-md border-border/50 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            Performance Analytics
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </CardTitle>
          <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">
            Live transactional stream monitoring
          </CardDescription>
        </div>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => val && onTimeRangeChange(val)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex bg-background/50 p-1 rounded-xl h-10 border-border/40">
            <ToggleGroupItem value="today" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Today</ToggleGroupItem>
            <ToggleGroupItem value="yesterday" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Yesterday</ToggleGroupItem>
            <ToggleGroupItem value="this-month" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Month</ToggleGroupItem>
            <ToggleGroupItem value="this-year" className="text-[10px] font-black uppercase tracking-widest rounded-lg">Year</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger
              className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden h-10 bg-background/50 font-black text-[10px] uppercase tracking-widest"
              size="sm"
              aria-label="Select range">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 shadow-2xl">
              <SelectItem value="today" className="text-xs font-bold uppercase tracking-widest">Today</SelectItem>
              <SelectItem value="yesterday" className="text-xs font-bold uppercase tracking-widest">Yesterday</SelectItem>
              <SelectItem value="this-month" className="text-xs font-bold uppercase tracking-widest">This Month</SelectItem>
              <SelectItem value="this-year" className="text-xs font-bold uppercase tracking-widest">This Year</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="relative h-[280px] w-full">
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
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="4 4"
                stroke="hsl(var(--border))"
                opacity={0.4}
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
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60"
              />
              <YAxis
                hide={isMobile}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value === 0 ? "₹0" : value > 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`}
                className="text-[10px] font-black text-muted-foreground/40"
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={
                  <ChartTooltipContent
                    className="bg-background/95 backdrop-blur-md border-border/50 shadow-2xl rounded-xl p-3 min-w-[180px]"
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return (
                        <div className="flex flex-col gap-0.5 mb-2 border-b border-border/20 pb-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Timeline Snapshot</span>
                          <span className="text-xs font-black text-foreground">
                            {date.toLocaleDateString("en-IN", {
                              weekday: 'long',
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
                            className="size-1.5 rounded-full ring-2 ring-offset-1 ring-offset-background"
                            style={{ backgroundColor: chartConfig[name]?.color, ringColor: chartConfig[name]?.color }}
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                            {chartConfig[name]?.label}
                          </span>
                        </div>
                        <span className="text-xs font-black tabular-nums font-mono">
                          {name === "desktop" ? `₹${value.toLocaleString('en-IN')}` : value.toLocaleString()}
                        </span>
                      </div>
                    )}
                    indicator="line"
                  />
                }
              />
              <Area
                dataKey="mobile"
                type="monotone"
                fill="url(#fillMobile)"
                stroke="var(--color-mobile)"
                strokeWidth={2}
                strokeLinecap="round"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="monotone"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
                strokeWidth={3}
                strokeLinecap="round"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
