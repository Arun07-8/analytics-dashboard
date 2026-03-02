"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, LabelList, ResponsiveContainer } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    count: {
        label: "Usage Count",
        color: "#10b981", // Emerald Matching Sales Page
    },
}

export function ChartBarMixed({ data = [] }) {
    const totalUsage = data.reduce((acc, curr) => acc + curr.count, 0);
    const barCount = data.length;

    // Fixed Height per bar to ensure 'Even spacing' regardless of count
    // Adjusted for larger 32px bar size
    const chartHeight = Math.max(240, barCount * 60 + 40);

    return (
        <Card className="border-none bg-white dark:bg-[#09090b] shadow-xl overflow-hidden relative group transition-all duration-300">
            {/* Sales Page Atmosphere Glows */}
            <div className="absolute top-0 right-0 size-64 bg-emerald-600/[0.03] dark:bg-emerald-600/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 size-64 bg-indigo-600/[0.03] dark:bg-indigo-600/5 blur-[120px] pointer-events-none" />

            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 pt-6 px-8 relative z-10">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                        Service Performance
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </CardTitle>
                    <CardDescription className="text-[11px] font-semibold text-muted-foreground/60 leading-none uppercase tracking-widest">
                        Live Analytics Stream
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="px-8 pb-4 relative z-10">
                <ChartContainer config={chartConfig} style={{ height: chartHeight }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{
                                left: 20,
                                right: 80,
                                top: 20,
                                bottom: 20
                            }}
                            barCategoryGap={20}
                        >
                            <defs>
                                <linearGradient id="serviceGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>

                            <XAxis
                                dataKey="count"
                                type="number"
                                tickLine={true}
                                axisLine={true}
                                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                                className="text-zinc-900 dark:text-zinc-100"
                                stroke="currentColor"
                                opacity={0.5} // Increased for clarity
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={true}
                                axisLine={true}
                                width={110}
                                tick={{
                                    fontSize: 10,
                                    fontWeight: 900,
                                    fill: 'currentColor',
                                    textAnchor: 'end'
                                }}
                                className="text-black dark:text-white font-black uppercase tracking-wider"
                                stroke="currentColor"
                                tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 17)}...` : value}
                            />

                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-2xl rounded-xl border-2 px-4 py-3"
                                        labelClassName="font-black uppercase tracking-wider text-[10px] text-zinc-500 mb-1"
                                    />
                                }
                            />

                            <Bar
                                dataKey="count"
                                layout="vertical"
                                radius={[0, 4, 4, 0]}
                                fill="url(#serviceGradient)"
                                barSize={32} // Increased height as requested
                                className="transition-all duration-500 hover:brightness-110 cursor-pointer"
                            >
                                {/* Service Count: Positioned on the right side of the bar */}
                                <LabelList
                                    dataKey="count"
                                    position="right"
                                    offset={12}
                                    className="fill-emerald-500 dark:fill-emerald-400 font-black text-[12px] tabular-nums"
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>

            <CardFooter className="flex-row items-center justify-between gap-2 text-[10px] px-8 py-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex gap-2 leading-none font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    Total Interactions: <span className="text-emerald-500 dark:text-emerald-400">{totalUsage.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-zinc-400">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="uppercase tracking-widest leading-none">Usage Stream</span>
                </div>
            </CardFooter>
        </Card>
    )
}
