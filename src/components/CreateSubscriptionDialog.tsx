import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/lib/rtl-utils";
import { formatDate } from "@/lib/formatters";

interface CreateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POPULAR_SUBSCRIPTIONS = [
  // Streaming Video
  { 
    name: "Netflix", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    category: "streaming",
    defaultAmount: 15
  },
  { 
    name: "Disney+", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
    category: "streaming",
    defaultAmount: 8
  },
  { 
    name: "Amazon Prime", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
    category: "streaming",
    defaultAmount: 14
  },
  { 
    name: "Apple TV+", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg",
    category: "streaming",
    defaultAmount: 7
  },
  { 
    name: "HBO Max", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Hulu", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg",
    category: "streaming",
    defaultAmount: 8
  },
  { 
    name: "Paramount+", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg",
    category: "streaming",
    defaultAmount: 6
  },
  { 
    name: "YouTube Premium", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
    category: "streaming",
    defaultAmount: 12
  },
  
  // Music Streaming
  { 
    name: "Spotify Premium", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Apple Music", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg",
    category: "streaming",
    defaultAmount: 11
  },
  { 
    name: "Tidal", 
    logo: "https://upload.wikimedia.org/wikipedia/en/1/19/Tidal_%28service%29_logo.svg",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Audible", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/32/Audible_logo.svg",
    category: "streaming",
    defaultAmount: 15
  },
  
  // Software & Productivity
  { 
    name: "Microsoft 365", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Microsoft_365_logo.svg",
    category: "software",
    defaultAmount: 7
  },
  { 
    name: "Adobe Creative Cloud", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Adobe_Creative_Cloud_rainbow_icon.svg",
    category: "software",
    defaultAmount: 55
  },
  { 
    name: "ChatGPT Pro", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    category: "software",
    defaultAmount: 20
  },
  { 
    name: "GitHub Pro", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
    category: "software",
    defaultAmount: 4
  },
  { 
    name: "Notion", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg",
    category: "software",
    defaultAmount: 8
  },
  { 
    name: "Canva Pro", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg",
    category: "software",
    defaultAmount: 13
  },
  { 
    name: "Grammarly Premium", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Grammarly_Logo.svg",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "Zoom Pro", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg",
    category: "software",
    defaultAmount: 15
  },
  { 
    name: "Slack", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
    category: "software",
    defaultAmount: 8
  },
  
  // Cloud Storage
  { 
    name: "Dropbox", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Dropbox_logo_2017.svg",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "Google One", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/49/Google_One_icon.svg",
    category: "software",
    defaultAmount: 3
  },
  { 
    name: "iCloud+", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/98/ICloud_logo.svg",
    category: "software",
    defaultAmount: 1
  },
  
  // Education
  { 
    name: "Coursera Plus", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Coursera_logo.svg",
    category: "education",
    defaultAmount: 59
  },
  { 
    name: "Udemy", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Udemy_logo.svg",
    category: "education",
    defaultAmount: 17
  },
  { 
    name: "Skillshare", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/75/Skillshare_logo_2020.svg",
    category: "education",
    defaultAmount: 14
  },
  { 
    name: "MasterClass", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6b/MasterClass_logo.svg",
    category: "education",
    defaultAmount: 20
  },
  { 
    name: "Duolingo Plus", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Duolingo_logo.svg",
    category: "education",
    defaultAmount: 7
  },
  { 
    name: "LinkedIn Learning", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    category: "education",
    defaultAmount: 30
  },
  
  // Gaming
  { 
    name: "PlayStation Plus", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Xbox Game Pass", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg",
    category: "streaming",
    defaultAmount: 15
  },
  { 
    name: "Nintendo Switch Online", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/76/Nintendo_switch_logo.svg",
    category: "streaming",
    defaultAmount: 4
  },
  { 
    name: "EA Play", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/89/EA_Play_logo.svg",
    category: "streaming",
    defaultAmount: 5
  },
  
  // News & Media
  { 
    name: "The New York Times", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/58/NewYorkTimes.svg",
    category: "other",
    defaultAmount: 17
  },
  { 
    name: "Medium", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Medium_logo_Monogram.svg",
    category: "other",
    defaultAmount: 5
  },
  
  // Social Media
  { 
    name: "X Premium", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png",
    category: "other",
    defaultAmount: 8
  },
  { 
    name: "LinkedIn Premium", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    category: "software",
    defaultAmount: 30
  },
  
  // VPN & Security
  { 
    name: "NordVPN", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/3d/NordVPN_logo.svg",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "ExpressVPN", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e6/ExpressVPN_Logo.svg",
    category: "software",
    defaultAmount: 13
  },
  
  // Fitness
  { 
    name: "Peloton", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/64/Peloton_logo.svg",
    category: "fitness",
    defaultAmount: 44
  },
  { 
    name: "Strava Premium", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg",
    category: "fitness",
    defaultAmount: 8
  },
];


export const CreateSubscriptionDialog = ({ open, onOpenChange }: CreateSubscriptionDialogProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<string>("custom");
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    currency: "SAR",
    billing_cycle: "monthly",
    category: "other",
    is_shared: false,
    next_renewal_date: new Date(),
    logo_url: "",
  });


  const handleServiceSelect = (value: string) => {
    setSelectedService(value);
    if (value !== "custom") {
      const subscription = POPULAR_SUBSCRIPTIONS.find(s => s.name === value);
      if (subscription) {
        setFormData({
          ...formData,
          name: subscription.name,
          amount: subscription.defaultAmount.toString(),
          category: subscription.category,
          logo_url: subscription.logo,
        });
      }
    } else {
      setFormData({
        ...formData,
        name: "",
        amount: "",
        category: "other",
        logo_url: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error(t('errors.notAuthenticated'));
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .insert([{
        name: formData.name,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        category: formData.category,
        is_shared: formData.is_shared,
        next_renewal_date: format(formData.next_renewal_date, "yyyy-MM-dd"),
        user_id: user.id,
        logo_url: formData.logo_url || null,
      }]);

    if (error) {
      toast.error(t('errors.genericError'));
      return;
    }

    toast.success(t('toast.subscriptionCreated'));
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    onOpenChange(false);
    setSelectedService("custom");
    setFormData({
      name: "",
      amount: "",
      currency: "SAR",
      billing_cycle: "monthly",
      category: "other",
      is_shared: false,
      next_renewal_date: new Date(),
      logo_url: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('subscriptions.addSubscription')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="service">{t('subscriptions.selectService')}</Label>
            <Select value={selectedService} onValueChange={handleServiceSelect}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {POPULAR_SUBSCRIPTIONS.map((sub) => (
                  <SelectItem key={sub.name} value={sub.name}>
                    <div className="flex items-center gap-2">
                      <img src={sub.logo} alt={sub.name} className="w-5 h-5 object-contain" />
                      <span>{sub.name}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs">?</div>
                    <span>{t('subscriptions.customService')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedService === "custom" && (
            <div>
              <Label htmlFor="name">{t('subscriptions.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('subscriptions.namePlaceholder')}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">{t('subscriptions.amount')}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="currency">{t('subscriptions.currency')}</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="billing_cycle">{t('subscriptions.billingCycle')}</Label>
            <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t('subscriptions.monthly')}</SelectItem>
                <SelectItem value="yearly">{t('subscriptions.yearly')}</SelectItem>
                <SelectItem value="weekly">{t('subscriptions.weekly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">{t('subscriptions.category')}</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streaming">{t('subscriptions.streaming')}</SelectItem>
                <SelectItem value="software">{t('subscriptions.software')}</SelectItem>
                <SelectItem value="fitness">{t('subscriptions.fitness')}</SelectItem>
                <SelectItem value="education">{t('subscriptions.education')}</SelectItem>
                <SelectItem value="other">{t('subscriptions.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('subscriptions.nextRenewalDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {formatDate(formData.next_renewal_date, i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.next_renewal_date}
                  onSelect={(date) => date && setFormData({ ...formData, next_renewal_date: date })}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_shared">{t('subscriptions.sharedSubscription')}</Label>
            <Switch
              id="is_shared"
              checked={formData.is_shared}
              onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1">{t('subscriptions.create')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};