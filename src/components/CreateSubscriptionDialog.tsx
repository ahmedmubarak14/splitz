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
    logo: "https://logo.clearbit.com/netflix.com",
    category: "streaming",
    defaultAmount: 15
  },
  { 
    name: "Disney+", 
    logo: "https://logo.clearbit.com/disneyplus.com",
    category: "streaming",
    defaultAmount: 8
  },
  { 
    name: "Amazon Prime", 
    logo: "https://logo.clearbit.com/primevideo.com",
    category: "streaming",
    defaultAmount: 14
  },
  { 
    name: "Apple TV+", 
    logo: "https://logo.clearbit.com/apple.com",
    category: "streaming",
    defaultAmount: 7
  },
  { 
    name: "HBO Max", 
    logo: "https://logo.clearbit.com/hbomax.com",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Hulu", 
    logo: "https://logo.clearbit.com/hulu.com",
    category: "streaming",
    defaultAmount: 8
  },
  { 
    name: "Paramount+", 
    logo: "https://logo.clearbit.com/paramountplus.com",
    category: "streaming",
    defaultAmount: 6
  },
  { 
    name: "YouTube Premium", 
    logo: "https://logo.clearbit.com/youtube.com",
    category: "streaming",
    defaultAmount: 12
  },
  { 
    name: "Crunchyroll", 
    logo: "https://logo.clearbit.com/crunchyroll.com",
    category: "streaming",
    defaultAmount: 8
  },
  { 
    name: "Twitch Turbo", 
    logo: "https://logo.clearbit.com/twitch.tv",
    category: "streaming",
    defaultAmount: 9
  },
  { 
    name: "Peacock", 
    logo: "https://logo.clearbit.com/peacocktv.com",
    category: "streaming",
    defaultAmount: 5
  },
  
  // Music Streaming
  { 
    name: "Spotify Premium", 
    logo: "https://logo.clearbit.com/spotify.com",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Apple Music", 
    logo: "https://logo.clearbit.com/apple.com",
    category: "streaming",
    defaultAmount: 11
  },
  { 
    name: "Tidal", 
    logo: "https://logo.clearbit.com/tidal.com",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Audible", 
    logo: "https://logo.clearbit.com/audible.com",
    category: "streaming",
    defaultAmount: 15
  },
  { 
    name: "SoundCloud", 
    logo: "https://logo.clearbit.com/soundcloud.com",
    category: "streaming",
    defaultAmount: 5
  },
  { 
    name: "Deezer", 
    logo: "https://logo.clearbit.com/deezer.com",
    category: "streaming",
    defaultAmount: 10
  },
  
  // Software & Productivity
  { 
    name: "Microsoft 365", 
    logo: "https://logo.clearbit.com/microsoft.com",
    category: "software",
    defaultAmount: 7
  },
  { 
    name: "Adobe Creative Cloud", 
    logo: "https://logo.clearbit.com/adobe.com",
    category: "software",
    defaultAmount: 55
  },
  { 
    name: "ChatGPT Plus", 
    logo: "https://logo.clearbit.com/openai.com",
    category: "software",
    defaultAmount: 20
  },
  { 
    name: "GitHub Pro", 
    logo: "https://logo.clearbit.com/github.com",
    category: "software",
    defaultAmount: 4
  },
  { 
    name: "Notion", 
    logo: "https://logo.clearbit.com/notion.so",
    category: "software",
    defaultAmount: 8
  },
  { 
    name: "Canva Pro", 
    logo: "https://logo.clearbit.com/canva.com",
    category: "software",
    defaultAmount: 13
  },
  { 
    name: "Grammarly Premium", 
    logo: "https://logo.clearbit.com/grammarly.com",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "Zoom Pro", 
    logo: "https://logo.clearbit.com/zoom.us",
    category: "software",
    defaultAmount: 15
  },
  { 
    name: "Slack", 
    logo: "https://logo.clearbit.com/slack.com",
    category: "software",
    defaultAmount: 8
  },
  { 
    name: "Trello", 
    logo: "https://logo.clearbit.com/trello.com",
    category: "software",
    defaultAmount: 10
  },
  { 
    name: "Asana", 
    logo: "https://logo.clearbit.com/asana.com",
    category: "software",
    defaultAmount: 11
  },
  { 
    name: "Monday.com", 
    logo: "https://logo.clearbit.com/monday.com",
    category: "software",
    defaultAmount: 10
  },
  { 
    name: "Figma", 
    logo: "https://logo.clearbit.com/figma.com",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "1Password", 
    logo: "https://logo.clearbit.com/1password.com",
    category: "software",
    defaultAmount: 3
  },
  { 
    name: "LastPass", 
    logo: "https://logo.clearbit.com/lastpass.com",
    category: "software",
    defaultAmount: 3
  },
  { 
    name: "Evernote", 
    logo: "https://logo.clearbit.com/evernote.com",
    category: "software",
    defaultAmount: 8
  },
  
  // Cloud Storage
  { 
    name: "Dropbox", 
    logo: "https://logo.clearbit.com/dropbox.com",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "Google One", 
    logo: "https://logo.clearbit.com/google.com",
    category: "software",
    defaultAmount: 3
  },
  { 
    name: "iCloud+", 
    logo: "https://logo.clearbit.com/icloud.com",
    category: "software",
    defaultAmount: 1
  },
  { 
    name: "OneDrive", 
    logo: "https://logo.clearbit.com/onedrive.com",
    category: "software",
    defaultAmount: 2
  },
  { 
    name: "pCloud", 
    logo: "https://logo.clearbit.com/pcloud.com",
    category: "software",
    defaultAmount: 5
  },
  
  // Education
  { 
    name: "Coursera Plus", 
    logo: "https://logo.clearbit.com/coursera.org",
    category: "education",
    defaultAmount: 59
  },
  { 
    name: "Udemy", 
    logo: "https://logo.clearbit.com/udemy.com",
    category: "education",
    defaultAmount: 17
  },
  { 
    name: "Skillshare", 
    logo: "https://logo.clearbit.com/skillshare.com",
    category: "education",
    defaultAmount: 14
  },
  { 
    name: "MasterClass", 
    logo: "https://logo.clearbit.com/masterclass.com",
    category: "education",
    defaultAmount: 20
  },
  { 
    name: "Duolingo Plus", 
    logo: "https://logo.clearbit.com/duolingo.com",
    category: "education",
    defaultAmount: 7
  },
  { 
    name: "LinkedIn Learning", 
    logo: "https://logo.clearbit.com/linkedin.com",
    category: "education",
    defaultAmount: 30
  },
  { 
    name: "Brilliant", 
    logo: "https://logo.clearbit.com/brilliant.org",
    category: "education",
    defaultAmount: 13
  },
  { 
    name: "Pluralsight", 
    logo: "https://logo.clearbit.com/pluralsight.com",
    category: "education",
    defaultAmount: 29
  },
  { 
    name: "Codecademy Pro", 
    logo: "https://logo.clearbit.com/codecademy.com",
    category: "education",
    defaultAmount: 20
  },
  
  // Gaming
  { 
    name: "PlayStation Plus", 
    logo: "https://logo.clearbit.com/playstation.com",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Xbox Game Pass", 
    logo: "https://logo.clearbit.com/xbox.com",
    category: "streaming",
    defaultAmount: 15
  },
  { 
    name: "Nintendo Switch Online", 
    logo: "https://logo.clearbit.com/nintendo.com",
    category: "streaming",
    defaultAmount: 4
  },
  { 
    name: "EA Play", 
    logo: "https://logo.clearbit.com/ea.com",
    category: "streaming",
    defaultAmount: 5
  },
  { 
    name: "Steam", 
    logo: "https://logo.clearbit.com/steampowered.com",
    category: "streaming",
    defaultAmount: 0
  },
  
  // News & Media
  { 
    name: "The New York Times", 
    logo: "https://logo.clearbit.com/nytimes.com",
    category: "other",
    defaultAmount: 17
  },
  { 
    name: "Medium", 
    logo: "https://logo.clearbit.com/medium.com",
    category: "other",
    defaultAmount: 5
  },
  { 
    name: "Bloomberg", 
    logo: "https://logo.clearbit.com/bloomberg.com",
    category: "other",
    defaultAmount: 35
  },
  { 
    name: "The Wall Street Journal", 
    logo: "https://logo.clearbit.com/wsj.com",
    category: "other",
    defaultAmount: 40
  },
  { 
    name: "The Economist", 
    logo: "https://logo.clearbit.com/economist.com",
    category: "other",
    defaultAmount: 13
  },
  
  // Social Media & Communication
  { 
    name: "X Premium", 
    logo: "https://logo.clearbit.com/twitter.com",
    category: "other",
    defaultAmount: 8
  },
  { 
    name: "LinkedIn Premium", 
    logo: "https://logo.clearbit.com/linkedin.com",
    category: "software",
    defaultAmount: 30
  },
  { 
    name: "Telegram Premium", 
    logo: "https://logo.clearbit.com/telegram.org",
    category: "other",
    defaultAmount: 5
  },
  { 
    name: "Discord Nitro", 
    logo: "https://logo.clearbit.com/discord.com",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "Reddit Premium", 
    logo: "https://logo.clearbit.com/reddit.com",
    category: "other",
    defaultAmount: 6
  },
  
  // VPN & Security
  { 
    name: "NordVPN", 
    logo: "https://logo.clearbit.com/nordvpn.com",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "ExpressVPN", 
    logo: "https://logo.clearbit.com/expressvpn.com",
    category: "software",
    defaultAmount: 13
  },
  { 
    name: "Surfshark", 
    logo: "https://logo.clearbit.com/surfshark.com",
    category: "software",
    defaultAmount: 10
  },
  { 
    name: "ProtonVPN", 
    logo: "https://logo.clearbit.com/protonvpn.com",
    category: "software",
    defaultAmount: 10
  },
  { 
    name: "Malwarebytes", 
    logo: "https://logo.clearbit.com/malwarebytes.com",
    category: "software",
    defaultAmount: 4
  },
  
  // Fitness & Health
  { 
    name: "Peloton", 
    logo: "https://logo.clearbit.com/onepeloton.com",
    category: "fitness",
    defaultAmount: 44
  },
  { 
    name: "Strava Premium", 
    logo: "https://logo.clearbit.com/strava.com",
    category: "fitness",
    defaultAmount: 8
  },
  { 
    name: "MyFitnessPal", 
    logo: "https://logo.clearbit.com/myfitnesspal.com",
    category: "fitness",
    defaultAmount: 10
  },
  { 
    name: "Calm", 
    logo: "https://logo.clearbit.com/calm.com",
    category: "fitness",
    defaultAmount: 15
  },
  { 
    name: "Headspace", 
    logo: "https://logo.clearbit.com/headspace.com",
    category: "fitness",
    defaultAmount: 13
  },
  { 
    name: "Fitbit Premium", 
    logo: "https://logo.clearbit.com/fitbit.com",
    category: "fitness",
    defaultAmount: 10
  },
  
  // Food Delivery
  { 
    name: "Uber Eats Pass", 
    logo: "https://logo.clearbit.com/ubereats.com",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "DoorDash DashPass", 
    logo: "https://logo.clearbit.com/doordash.com",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "Grubhub+", 
    logo: "https://logo.clearbit.com/grubhub.com",
    category: "other",
    defaultAmount: 10
  },
  
  // Finance & Banking
  { 
    name: "Revolut Premium", 
    logo: "https://logo.clearbit.com/revolut.com",
    category: "other",
    defaultAmount: 8
  },
  { 
    name: "N26 You", 
    logo: "https://logo.clearbit.com/n26.com",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "YNAB", 
    logo: "https://logo.clearbit.com/youneedabudget.com",
    category: "software",
    defaultAmount: 15
  },
  { 
    name: "Mint Premium", 
    logo: "https://logo.clearbit.com/mint.com",
    category: "software",
    defaultAmount: 5
  },
  
  // Reading & Books
  { 
    name: "Kindle Unlimited", 
    logo: "https://logo.clearbit.com/amazon.com",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "Scribd", 
    logo: "https://logo.clearbit.com/scribd.com",
    category: "other",
    defaultAmount: 12
  },
  { 
    name: "Blinkist", 
    logo: "https://logo.clearbit.com/blinkist.com",
    category: "other",
    defaultAmount: 9
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
        split_type: formData.is_shared ? 'equal' : null,
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_shared">{t('subscriptions.sharedSubscription')}</Label>
              <Switch
                id="is_shared"
                checked={formData.is_shared}
                onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
              />
            </div>
            {formData.is_shared && (
              <p className="text-xs text-muted-foreground">
                Add contributors and configure split type after creating the subscription.
              </p>
            )}
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