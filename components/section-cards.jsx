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

export function SectionCards({ cards = [] }) {
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

  const totalSlots = cards.length + 1; // Assuming first card is span-2
  const gridClass = gridCols[totalSlots] || 'xl:grid-cols-9 lg:grid-cols-9';

  return (
    <div
      className={`*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-none lg:px-6 md:grid-cols-4 ${gridClass}`}>
      {cards.map((card, index) => {
        const isHighlight = index === 0;
        return (
          <Card key={index} className={`@container/card border-border/40 transition-all duration-300 hover:border-primary/30 ${isHighlight ? 'xl:col-span-2 bg-primary/[0.03] border-primary/20 shadow-sm shadow-primary/5' : ''}`}>
            <CardHeader className={`${isHighlight ? 'p-4' : 'p-3.5'} space-y-0 relative`}>
              <div className="flex items-center justify-between mb-1">
                <CardDescription className={`font-black uppercase tracking-widest line-clamp-1 ${isHighlight ? 'text-[11px] text-primary' : 'text-[10px]'}`}>
                  {card.label}
                </CardDescription>
                {card.action && (
                  <div className="z-10 bg-background/50 rounded-md">
                    {card.action}
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`font-black tabular-nums tracking-tighter ${isHighlight ? 'text-2xl' : 'text-xl'}`}>
                  {card.prefix || ""}{typeof card.value === 'number' ? card.value.toLocaleString(undefined, {
                    minimumFractionDigits: card.isCurrency ? (card.value % 1 === 0 ? 0 : 2) : 0,
                    maximumFractionDigits: card.isCurrency ? 2 : 0
                  }) : card.value}{card.suffix || ""}
                </span>
              </div>
              {card.growth !== undefined && (
                <div className={`absolute ${isHighlight ? 'top-4 right-4' : 'top-3.5 right-3.5'}`}>
                  <span className={`font-black ${isHighlight ? 'text-xs px-2 py-0.5 rounded-full bg-emerald-500/10' : 'text-[10px]'} ${card.growth >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {card.growth >= 0 ? "+" : ""}{card.growth}%
                  </span>
                </div>
              )}
              <p className={`font-bold mt-1 opacity-60 line-clamp-1 ${isHighlight ? 'text-[10px]' : 'text-[9px]'}`}>
                {card.description || "Live Status"}
              </p>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
