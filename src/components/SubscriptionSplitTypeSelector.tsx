import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";
import { CheckCircle, XCircle } from "lucide-react";

type SplitType = 'equal' | 'percentage' | 'custom' | 'shares';

interface MemberSplit {
  user_id: string;
  full_name: string;
  split_value: number | null;
  calculated_amount: number;
}

interface SubscriptionSplitTypeSelectorProps {
  totalAmount: number;
  currency: string;
  members: Array<{ user_id: string; full_name: string }>;
  onSplitsChange: (splits: MemberSplit[], splitType: SplitType) => void;
  initialSplitType?: SplitType;
  initialSplits?: Array<{ user_id: string; split_value: number | null }>;
}

export const SubscriptionSplitTypeSelector = ({
  totalAmount,
  currency,
  members,
  onSplitsChange,
  initialSplitType = 'equal',
  initialSplits = []
}: SubscriptionSplitTypeSelectorProps) => {
  const { t, i18n } = useTranslation();
  const [splitType, setSplitType] = useState<SplitType>(initialSplitType);
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);

  // Initialize member splits
  useEffect(() => {
    const splits: MemberSplit[] = members.map(member => {
      const existingSplit = initialSplits.find(s => s.user_id === member.user_id);
      return {
        user_id: member.user_id,
        full_name: member.full_name,
        split_value: existingSplit?.split_value || null,
        calculated_amount: 0
      };
    });
    setMemberSplits(splits);
  }, [members, initialSplits]);

  // Calculate amounts based on split type
  const calculateAmounts = (splits: MemberSplit[], type: SplitType): MemberSplit[] => {
    const memberCount = splits.length;
    
    if (memberCount === 0) return splits;

    switch (type) {
      case 'equal':
        return splits.map(s => ({ ...s, calculated_amount: totalAmount / memberCount, split_value: null }));
      
      case 'percentage':
        return splits.map(s => ({
          ...s,
          calculated_amount: totalAmount * ((s.split_value || 0) / 100)
        }));
      
      case 'custom':
        return splits.map(s => ({ ...s, calculated_amount: s.split_value || 0 }));
      
      case 'shares':
        const totalShares = splits.reduce((sum, s) => sum + (s.split_value || 1), 0);
        return splits.map(s => ({
          ...s,
          calculated_amount: totalShares > 0 ? totalAmount * ((s.split_value || 1) / totalShares) : 0
        }));
      
      default:
        return splits;
    }
  };

  // Update amounts when splits or type change
  useEffect(() => {
    const updatedSplits = calculateAmounts(memberSplits, splitType);
    setMemberSplits(updatedSplits);
    onSplitsChange(updatedSplits, splitType);
  }, [splitType, totalAmount]);

  const handleSplitTypeChange = (newType: SplitType) => {
    setSplitType(newType);
    // Reset split values when changing type
    const resetSplits = memberSplits.map(s => ({ ...s, split_value: null }));
    setMemberSplits(resetSplits);
  };

  const handleSplitValueChange = (userId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedSplits = memberSplits.map(s =>
      s.user_id === userId ? { ...s, split_value: numValue } : s
    );
    const calculatedSplits = calculateAmounts(updatedSplits, splitType);
    setMemberSplits(calculatedSplits);
    onSplitsChange(calculatedSplits, splitType);
  };

  const getTotalDisplay = (): { total: number; isValid: boolean } => {
    const total = memberSplits.reduce((sum, s) => sum + s.calculated_amount, 0);
    const isValid = Math.abs(total - totalAmount) < 0.01;
    return { total, isValid };
  };

  const { total, isValid } = getTotalDisplay();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('subscriptions.splitType')}</Label>
        <Select value={splitType} onValueChange={(value) => handleSplitTypeChange(value as SplitType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equal">{t('subscriptions.equalSplit')}</SelectItem>
            <SelectItem value="percentage">{t('subscriptions.percentageSplit')}</SelectItem>
            <SelectItem value="custom">{t('subscriptions.customSplit')}</SelectItem>
            <SelectItem value="shares">{t('subscriptions.sharesSplit')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {splitType !== 'equal' && (
        <Card className="p-4 space-y-3">
          <div className="space-y-3">
            {memberSplits.map((split) => (
              <div key={split.user_id} className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-sm">{split.full_name}</Label>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={split.split_value || ''}
                    onChange={(e) => handleSplitValueChange(split.user_id, e.target.value)}
                    placeholder={
                      splitType === 'percentage' ? '0%' :
                      splitType === 'shares' ? '1' :
                      '0.00'
                    }
                  />
                </div>
                <div className="w-28 text-right text-sm font-medium">
                  {formatCurrency(split.calculated_amount, currency, i18n.language)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('subscriptions.total')}</span>
              {isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="text-right">
              <div className="font-bold">
                {formatCurrency(total, currency, i18n.language)}
              </div>
              {splitType === 'percentage' && (
                <div className="text-xs text-muted-foreground">
                  {memberSplits.reduce((sum, s) => sum + (s.split_value || 0), 0).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {splitType === 'equal' && (
        <div className="text-sm text-muted-foreground">
          {t('subscriptions.equalSplitInfo', {
            amount: formatCurrency(totalAmount / members.length, currency, i18n.language),
            count: members.length
          })}
        </div>
      )}
    </div>
  );
};