import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceHistoryChartProps {
  subscriptionId: string;
  currentPrice: number;
  currency: string;
}

export const PriceHistoryChart = ({
  subscriptionId,
  currentPrice,
  currency,
}: PriceHistoryChartProps) => {
  const { data: priceHistory } = useQuery({
    queryKey: ['price-history', subscriptionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_price_history')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('changed_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price History
          </CardTitle>
          <CardDescription>No price changes recorded yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = priceHistory.map((change) => ({
    date: format(new Date(change.changed_at), 'MMM d, yyyy'),
    price: change.new_price,
  }));

  // Add current price as the latest point
  chartData.push({
    date: 'Current',
    price: currentPrice,
  });

  // Calculate total change
  const firstPrice = priceHistory[0]?.old_price || currentPrice;
  const totalChange = currentPrice - firstPrice;
  const percentageChange = ((totalChange / firstPrice) * 100).toFixed(1);

  const getTrendIcon = () => {
    if (totalChange > 0) return <TrendingUp className="h-5 w-5 text-destructive" />;
    if (totalChange < 0) return <TrendingDown className="h-5 w-5 text-success" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const getTrendBadge = () => {
    if (totalChange > 0) {
      return (
        <Badge variant="destructive">
          +{currency} {totalChange.toFixed(2)} (+{percentageChange}%)
        </Badge>
      );
    }
    if (totalChange < 0) {
      return (
        <Badge variant="default" className="bg-success">
          {currency} {totalChange.toFixed(2)} ({percentageChange}%)
        </Badge>
      );
    }
    return <Badge variant="secondary">No change</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Price History
            </CardTitle>
            <CardDescription>
              {priceHistory.length} price change{priceHistory.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            {getTrendBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => [`${currency} ${value}`, 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Price Change Timeline */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Change Log</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {priceHistory.map((change, index) => {
              const diff = change.new_price - change.old_price;
              const isIncrease = diff > 0;
              
              return (
                <div
                  key={change.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    {isIncrease ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-success" />
                    )}
                    <span className="text-muted-foreground">
                      {format(new Date(change.changed_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-muted-foreground">
                      {currency} {change.old_price}
                    </span>
                    <span className="font-medium">
                      {currency} {change.new_price}
                    </span>
                    <Badge
                      variant={isIncrease ? 'destructive' : 'default'}
                      className={isIncrease ? '' : 'bg-success'}
                    >
                      {isIncrease ? '+' : ''}
                      {currency} {diff.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};