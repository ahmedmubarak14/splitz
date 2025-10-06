import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useIsRTL } from '@/lib/rtl-utils';

interface SimplifiedDebt {
  from_user_id: string;
  to_user_id: string;
  from_name: string;
  to_name: string;
  amount: number;
}

interface GroupBalanceDetailsProps {
  groupId: string;
  currentUserId: string;
  debts: SimplifiedDebt[];
  onRecordPayment?: (fromUserId: string, toUserId: string, amount: number) => void;
}

export const GroupBalanceDetails = ({
  groupId,
  currentUserId,
  debts,
  onRecordPayment,
}: GroupBalanceDetailsProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const userDebts = debts.filter(
    debt => debt.from_user_id === currentUserId || debt.to_user_id === currentUserId
  );

  const otherDebts = debts.filter(
    debt => debt.from_user_id !== currentUserId && debt.to_user_id !== currentUserId
  );

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground">{t('expenses.noDebts')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {userDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('expenses.yourBalance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userDebts.map((debt, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  debt.from_user_id === currentUserId ? 'bg-destructive/10' : 'bg-success/10'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex items-center gap-2 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">
                    {debt.from_user_id === currentUserId ? t('expenses.youOwe') : t('expenses.owesYou')}
                  </span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  <span className="font-medium">
                    {debt.from_user_id === currentUserId ? debt.to_name : debt.from_name}
                  </span>
                </div>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-bold text-lg">
                    {formatCurrency(debt.amount)}
                  </span>
                  {onRecordPayment && debt.from_user_id === currentUserId && (
                    <Button
                      size="sm"
                      onClick={() => onRecordPayment(debt.from_user_id, debt.to_user_id, debt.amount)}
                      variant="outline"
                    >
                      {t('expenses.recordPayment')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {otherDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('expenses.whoOwesWhom')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {otherDebts.map((debt, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded-md bg-muted/30 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{debt.from_name}</span>
                  <ArrowRight className={`w-4 h-4 text-primary ${isRTL ? 'rotate-180' : ''}`} />
                  <span className="font-medium">{debt.to_name}</span>
                </div>
                <span className="font-semibold">{formatCurrency(debt.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
