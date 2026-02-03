import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards({ stats = {}, labels = {}, prefixes = {}, suffixes = {} }) {
  const {
    totalRevenue = 0,
    revenueGrowth = 0,
    newCustomers = 0,
    customerGrowth = 0,
    activeAccounts = 0,
    activeAccountsGrowth = 0,
    growthRate = 0,
    growthRateChange = 0
  } = stats;

  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{labels.totalRevenue || "Total Revenue"}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {prefixes.totalRevenue ?? "₹"}{totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: prefixes.totalRevenue === "" ? 0 : 2,
              maximumFractionDigits: prefixes.totalRevenue === "" ? 0 : 2
            })}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {revenueGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {revenueGrowth >= 0 ? "+" : ""}{revenueGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {revenueGrowth >= 0 ? "Trending up this month" : "Trending down this month"}
            {revenueGrowth >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Analysis for the current period
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{labels.newCustomers || "New Customers"}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {newCustomers.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {customerGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {customerGrowth >= 0 ? "+" : ""}{customerGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {customerGrowth >= 0 ? "Growth in acquisitions" : "Acquisitions decreased"}
            {customerGrowth >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Compared to last month
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{labels.activeAccounts || "Active Accounts"}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activeAccounts.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {activeAccountsGrowth >= 0 ? "+" : ""}{activeAccountsGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement metrics</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{labels.growthRate || "Retention Rate"}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {prefixes.growthRate}{growthRate}{suffixes.growthRate || (prefixes.growthRate ? "" : "%")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {growthRateChange >= 0 ? "+" : ""}{growthRateChange}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{labels.growthRateDescription || "Customer loyalty"}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
