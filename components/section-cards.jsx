import * as React from "react"
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

export const SectionCards = React.memo(function SectionCards({ cards = [], equalWidth = false }) {
  if (!cards.length) return null;

  const gridCols = {
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4 lg:grid-cols-4',
    5: 'xl:grid-cols-5 lg:grid-cols-5',
    6: 'xl:grid-cols-6 lg:grid-cols-6',
    7: 'xl:grid-cols-7 lg:grid-cols-7',
    8: 'xl:grid-cols-8 lg:grid-cols-8',
    9: 'xl:grid-cols-9 lg:grid-cols-9',
  };

  const equalGridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
  };

  const totalSlots = cards.length + 1;
  const gridClass = equalWidth
    ? (equalGridCols[cards.length] || 'sm:grid-cols-2 lg:grid-cols-4')
    : (gridCols[totalSlots] || 'xl:grid-cols-9 lg:grid-cols-9');

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 gap-4 md:gap-6 w-full ${gridClass}`}>
      {cards.map((card, index) => {
        const isHighlight = !equalWidth && index === 0;
        return (
          <Card key={index} className={`relative overflow-hidden group border-border/40 bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_1px_2px_0_rgba(0,0,0,0.04)] transition-all duration-300 ${isHighlight ? 'col-span-2 xl:col-span-2' : ''}`}>
            <CardHeader className="p-5 flex flex-col justify-between h-full space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  {card.icon && (
                    <div className="flex items-center justify-center size-10 rounded-xl bg-muted/50 text-muted-foreground ring-1 ring-inset ring-border/20 shadow-sm">
                      {React.cloneElement(card.icon, { className: 'size-5' })}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <h3 className="text-[15px] font-bold text-foreground/90 tracking-tight leading-tight">
                      {card.label}
                    </h3>
                    <p className="text-[11px] font-medium text-muted-foreground/50 tracking-tight line-clamp-1">
                      {card.description || "Live Status"}
                    </p>
                  </div>
                </div>
                {card.growth !== undefined && (
                  <Badge variant="outline" className={`gap-1 font-bold py-0.5 px-2 rounded-lg border-0 ${card.growth >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    {card.growth >= 0 ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
                    {card.growth > 0 ? "+" : ""}{card.growth}%
                  </Badge>
                )}
              </div>

              <div className="pt-1">
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg sm:text-2xl lg:text-4xl font-bold tabular-nums tracking-tighter ${typeof card.value === 'number' && card.value < 0 ? 'text-red-500' : 'text-foreground'}`}>
                    {card.prefix || ""}{typeof card.value === 'number' ? card.value.toLocaleString(undefined, {
                      minimumFractionDigits: card.isCurrency ? (card.value % 1 === 0 ? 0 : 2) : 0,
                      maximumFractionDigits: card.isCurrency ? 2 : 0
                    }) : card.value}{card.suffix || ""}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
});
