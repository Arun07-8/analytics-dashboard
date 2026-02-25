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

export const SectionCards = React.memo(function SectionCards({ cards = [] }) {
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

  const totalSlots = cards.length + 1;
  const gridClass = gridCols[totalSlots] || 'xl:grid-cols-9 lg:grid-cols-9';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full ${gridClass}`}>
      {cards.map((card, index) => {
        const isHighlight = index === 0;
        return (
          <Card key={index} className={`relative overflow-hidden group border-border/40 transition-all duration-300 hover:border-primary/30 hover:shadow-md ${isHighlight ? 'xl:col-span-2 bg-gradient-to-br from-card to-primary/[0.02] border-primary/20 shadow-sm shadow-primary/5' : 'bg-card shadow-sm'}`}>
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
            <CardHeader className={`${isHighlight ? 'p-5' : 'p-4'} flex flex-col justify-between h-full`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {card.icon && (
                    <div className={`flex items-center justify-center rounded-lg ${isHighlight ? 'h-10 w-10 bg-primary/10 text-primary ring-1 ring-inset ring-primary/20' : 'h-8 w-8 bg-muted/50 text-muted-foreground ring-1 ring-inset ring-border/50'}`}>
                      {React.cloneElement(card.icon, { className: 'h-4 w-4' })}
                    </div>
                  )}
                  <CardDescription className={`font-medium tracking-tight ${isHighlight ? 'text-sm text-foreground' : 'text-xs text-muted-foreground'}`}>
                    {card.label}
                  </CardDescription>
                </div>
                {card.growth !== undefined && (
                  <div className={`flex items-center gap-1 flex-shrink-0 ml-2 rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium ${card.growth >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-500/20'}`}>
                    {card.growth >= 0 ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
                    {card.growth > 0 ? "+" : ""}{card.growth}%
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <div className="flex items-baseline gap-1">
                  <span className={`font-bold tabular-nums tracking-tight ${isHighlight ? 'text-3xl lg:text-4xl text-primary' : 'text-2xl text-foreground'}`}>
                    {card.prefix || ""}{typeof card.value === 'number' ? card.value.toLocaleString(undefined, {
                      minimumFractionDigits: card.isCurrency ? (card.value % 1 === 0 ? 0 : 2) : 0,
                      maximumFractionDigits: card.isCurrency ? 2 : 0
                    }) : card.value}{card.suffix || ""}
                  </span>
                </div>
                <p className={`font-medium mt-1 text-muted-foreground line-clamp-1 ${isHighlight ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs'}`}>
                  {card.description || "Live Status"}
                </p>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
});
