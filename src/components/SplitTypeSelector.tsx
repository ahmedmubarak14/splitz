import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import { Percent, DollarSign, Users, Equal } from 'lucide-react';

type SplitType = 'equal' | 'percentage' | 'custom' | 'shares';

interface MemberSplit {
  user_id: string;
  name: string;
  split_value?: number;
  calculated_amount?: number;
}

interface SplitTypeSelectorProps {
  totalAmount: number;
  members: Array<{ id: string; name: string }>;
  onSplitsChange: (splitType: SplitType, splits: MemberSplit[]) => void;
  initialSplitType?: SplitType;
  initialSplits?: MemberSplit[];
}

export const SplitTypeSelector = ({
  totalAmount,
  members,
  onSplitsChange,
  initialSplitType = 'equal',
  initialSplits = [],
}: SplitTypeSelectorProps) => {
  const { t } = useTranslation();
  const [splitType, setSplitType] = useState<SplitType>(initialSplitType);
  const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);

  useEffect(() => {
    // Initialize member splits
    if (initialSplits.length > 0) {
      setMemberSplits(initialSplits);
    } else {
      const defaultSplits = members.map(m => ({
        user_id: m.id,
        name: m.name,
        split_value: splitType === 'equal' ? undefined : 
                     splitType === 'percentage' ? (100 / members.length) :
                     splitType === 'shares' ? 1 :
                     (totalAmount / members.length),
      }));
      setMemberSplits(defaultSplits);
    }
  }, [members, splitType]);

  useEffect(() => {
    // Calculate amounts and notify parent
    const calculated = calculateAmounts();
    onSplitsChange(splitType, calculated);
  }, [memberSplits, splitType, totalAmount]);

  const calculateAmounts = (): MemberSplit[] => {
    if (splitType === 'equal') {
      return memberSplits.map(m => ({
        ...m,
        split_value: undefined,
        calculated_amount: totalAmount / members.length,
      }));
    }

    if (splitType === 'percentage') {
      return memberSplits.map(m => ({
        ...m,
        calculated_amount: (totalAmount * (m.split_value || 0)) / 100,
      }));
    }

    if (splitType === 'custom') {
      return memberSplits.map(m => ({
        ...m,
        calculated_amount: m.split_value || 0,
      }));
    }

    if (splitType === 'shares') {
      const totalShares = memberSplits.reduce((sum, m) => sum + (m.split_value || 0), 0);
      return memberSplits.map(m => ({
        ...m,
        calculated_amount: totalShares > 0 ? (totalAmount * (m.split_value || 0)) / totalShares : 0,
      }));
    }

    return memberSplits;
  };

  const handleSplitTypeChange = (value: SplitType) => {
    setSplitType(value);
    // Reset values when changing split type
    const resetSplits = members.map(m => ({
      user_id: m.id,
      name: m.name,
      split_value: value === 'percentage' ? (100 / members.length) :
                   value === 'shares' ? 1 :
                   value === 'custom' ? (totalAmount / members.length) :
                   undefined,
    }));
    setMemberSplits(resetSplits);
  };

  const handleSplitValueChange = (userId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMemberSplits(prev => prev.map(m => 
      m.user_id === userId ? { ...m, split_value: numValue } : m
    ));
  };

  const getTotalDisplay = () => {
    const calculated = calculateAmounts();
    const total = calculated.reduce((sum, m) => sum + (m.calculated_amount || 0), 0);
    
    if (splitType === 'percentage') {
      const totalPerc = memberSplits.reduce((sum, m) => sum + (m.split_value || 0), 0);
      return `${totalPerc.toFixed(1)}% (${formatCurrency(total)})`;
    }
    
    return formatCurrency(total);
  };

  const isValid = () => {
    const calculated = calculateAmounts();
    const total = calculated.reduce((sum, m) => sum + (m.calculated_amount || 0), 0);
    return Math.abs(total - totalAmount) < 0.01; // Allow for rounding errors
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{t('expenses.splitType')}</Label>
        <Select value={splitType} onValueChange={handleSplitTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equal">
              <div className="flex items-center gap-2">
                <Equal className="h-4 w-4" />
                {t('expenses.equalSplit')}
              </div>
            </SelectItem>
            <SelectItem value="percentage">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                {t('expenses.percentageSplit')}
              </div>
            </SelectItem>
            <SelectItem value="custom">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t('expenses.customSplit')}
              </div>
            </SelectItem>
            <SelectItem value="shares">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('expenses.sharesSplit')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {splitType !== 'equal' && (
        <Card className="p-4 space-y-3">
          <div className="text-sm font-medium">
            {splitType === 'percentage' ? t('expenses.setPercentages') :
             splitType === 'custom' ? t('expenses.setAmounts') :
             t('expenses.setShares')}
          </div>
          
          {memberSplits.map((member) => {
            const calculated = calculateAmounts().find(m => m.user_id === member.user_id);
            return (
              <div key={member.user_id} className="flex items-center gap-2">
                <div className="flex-1 text-sm">{member.name}</div>
                <Input
                  type="number"
                  step={splitType === 'percentage' ? '0.1' : splitType === 'shares' ? '1' : '0.01'}
                  min="0"
                  value={member.split_value || ''}
                  onChange={(e) => handleSplitValueChange(member.user_id, e.target.value)}
                  className="w-24"
                  placeholder={splitType === 'shares' ? '1' : '0'}
                />
                {splitType === 'percentage' && <span className="text-sm">%</span>}
                <span className="text-sm text-muted-foreground w-24 text-right">
                  = {formatCurrency(calculated?.calculated_amount || 0)}
                </span>
              </div>
            );
          })}
          
          <div className="pt-2 border-t flex justify-between items-center">
            <span className="text-sm font-medium">{t('expenses.total')}:</span>
            <span className={`text-sm font-medium ${isValid() ? 'text-primary' : 'text-destructive'}`}>
              {getTotalDisplay()}
              {!isValid() && ` / ${formatCurrency(totalAmount)}`}
            </span>
          </div>
          
          {!isValid() && (
            <div className="text-xs text-destructive">
              {t('expenses.splitMustMatchTotal')}
            </div>
          )}
        </Card>
      )}
      
      {splitType === 'equal' && (
        <div className="text-sm text-muted-foreground">
          {t('expenses.equalSplitInfo', { 
            amount: formatCurrency(totalAmount / members.length),
            count: members.length 
          })}
        </div>
      )}
    </div>
  );
};
