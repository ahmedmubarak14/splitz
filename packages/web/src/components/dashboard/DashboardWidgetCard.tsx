import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsRTL } from '@/lib/rtl-utils';
import { LucideIcon } from 'lucide-react';

interface DashboardWidgetCardProps {
  title: string;
  icon: LucideIcon;
  badge?: number;
  children: ReactNode;
  onClick?: () => void;
}

export function DashboardWidgetCard({ 
  title, 
  icon: Icon, 
  badge, 
  children, 
  onClick 
}: DashboardWidgetCardProps) {
  const isRTL = useIsRTL();

  return (
    <Card className="bg-background border border-border/40 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-200 overflow-hidden">
      <CardContent className="p-4 md:p-5">
        <div className={`flex items-center justify-between mb-3 md:mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 md:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="inline-flex p-2 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <h3 className="text-base md:text-lg font-semibold tracking-tight">{title}</h3>
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
              {badge}
            </span>
          )}
          {onClick && (
            <button 
              onClick={onClick}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              View All
            </button>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
