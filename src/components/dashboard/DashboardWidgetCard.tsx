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
    <Card className="bg-background border border-border/40 hover:border-border transition-colors">
      <CardContent className="p-4 md:p-6">
        <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {badge}
            </span>
          )}
          {onClick && (
            <button 
              onClick={onClick}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
