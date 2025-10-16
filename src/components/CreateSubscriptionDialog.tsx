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
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/netflix.svg",
    category: "streaming",
    defaultAmount: 15
  },
  { 
    name: "Disney+", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/disneyplus.svg",
    category: "streaming",
    defaultAmount: 8
  },
  { 
    name: "Amazon Prime", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/primevideo.svg",
    category: "streaming",
    defaultAmount: 14
  },
  { 
    name: "Apple TV+", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/appletv.svg",
    category: "streaming",
    defaultAmount: 7
  },
  { 
    name: "HBO Max", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/hbo.svg",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Hulu", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/hulu.svg",
    category: "streaming",
    defaultAmount: 8
  },
  { 
    name: "Paramount+", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/paramount.svg",
    category: "streaming",
    defaultAmount: 6
  },
  { 
    name: "YouTube Premium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg",
    category: "streaming",
    defaultAmount: 12
  },
  { 
    name: "Crunchyroll", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/crunchyroll.svg",
    category: "streaming",
    defaultAmount: 8
  },
  { 
    name: "Twitch Turbo", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitch.svg",
    category: "streaming",
    defaultAmount: 9
  },
  { 
    name: "Peacock", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/peacock.svg",
    category: "streaming",
    defaultAmount: 5
  },
  
  // Music Streaming
  { 
    name: "Spotify Premium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Apple Music", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/applemusic.svg",
    category: "streaming",
    defaultAmount: 11
  },
  { 
    name: "Tidal", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tidal.svg",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Audible", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/audible.svg",
    category: "streaming",
    defaultAmount: 15
  },
  { 
    name: "SoundCloud", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/soundcloud.svg",
    category: "streaming",
    defaultAmount: 5
  },
  { 
    name: "Deezer", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/deezer.svg",
    category: "streaming",
    defaultAmount: 10
  },
  
  // Software & Productivity
  { 
    name: "Microsoft 365", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/microsoft.svg",
    category: "software",
    defaultAmount: 7
  },
  { 
    name: "Adobe Creative Cloud", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/adobe.svg",
    category: "software",
    defaultAmount: 55
  },
  { 
    name: "ChatGPT Plus", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/openai.svg",
    category: "software",
    defaultAmount: 20
  },
  { 
    name: "GitHub Pro", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg",
    category: "software",
    defaultAmount: 4
  },
  { 
    name: "Notion", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/notion.svg",
    category: "software",
    defaultAmount: 8
  },
  { 
    name: "Canva Pro", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/canva.svg",
    category: "software",
    defaultAmount: 13
  },
  { 
    name: "Grammarly Premium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/grammarly.svg",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "Zoom Pro", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/zoom.svg",
    category: "software",
    defaultAmount: 15
  },
  { 
    name: "Slack", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/slack.svg",
    category: "software",
    defaultAmount: 8
  },
  { 
    name: "Trello", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/trello.svg",
    category: "software",
    defaultAmount: 10
  },
  { 
    name: "Asana", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/asana.svg",
    category: "software",
    defaultAmount: 11
  },
  { 
    name: "Monday.com", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/monday.svg",
    category: "software",
    defaultAmount: 10
  },
  { 
    name: "Figma", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/figma.svg",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "1Password", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/1password.svg",
    category: "software",
    defaultAmount: 3
  },
  { 
    name: "LastPass", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/lastpass.svg",
    category: "software",
    defaultAmount: 3
  },
  
  // Cloud Storage
  { 
    name: "Dropbox", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/dropbox.svg",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "Google One", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/google.svg",
    category: "software",
    defaultAmount: 3
  },
  { 
    name: "iCloud+", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/icloud.svg",
    category: "software",
    defaultAmount: 1
  },
  { 
    name: "OneDrive", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/microsoftonedrive.svg",
    category: "software",
    defaultAmount: 2
  },
  
  // Education
  { 
    name: "Coursera Plus", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/coursera.svg",
    category: "education",
    defaultAmount: 59
  },
  { 
    name: "Udemy", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/udemy.svg",
    category: "education",
    defaultAmount: 17
  },
  { 
    name: "Skillshare", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/skillshare.svg",
    category: "education",
    defaultAmount: 14
  },
  { 
    name: "MasterClass", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mastercard.svg",
    category: "education",
    defaultAmount: 20
  },
  { 
    name: "Duolingo Plus", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/duolingo.svg",
    category: "education",
    defaultAmount: 7
  },
  { 
    name: "LinkedIn Learning", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg",
    category: "education",
    defaultAmount: 30
  },
  { 
    name: "Brilliant", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/brilliant.svg",
    category: "education",
    defaultAmount: 13
  },
  
  // Gaming
  { 
    name: "PlayStation Plus", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/playstation.svg",
    category: "streaming",
    defaultAmount: 10
  },
  { 
    name: "Xbox Game Pass", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/xbox.svg",
    category: "streaming",
    defaultAmount: 15
  },
  { 
    name: "Nintendo Switch Online", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nintendo.svg",
    category: "streaming",
    defaultAmount: 4
  },
  { 
    name: "EA Play", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/ea.svg",
    category: "streaming",
    defaultAmount: 5
  },
  { 
    name: "Steam", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/steam.svg",
    category: "streaming",
    defaultAmount: 0
  },
  { 
    name: "Epic Games", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/epicgames.svg",
    category: "streaming",
    defaultAmount: 0
  },
  
  // News & Media
  { 
    name: "The New York Times", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nytimes.svg",
    category: "other",
    defaultAmount: 17
  },
  { 
    name: "Medium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/medium.svg",
    category: "other",
    defaultAmount: 5
  },
  { 
    name: "Bloomberg", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/bloomberg.svg",
    category: "other",
    defaultAmount: 35
  },
  { 
    name: "The Economist", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/theconversation.svg",
    category: "other",
    defaultAmount: 13
  },
  
  // Social Media & Communication
  { 
    name: "X Premium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg",
    category: "other",
    defaultAmount: 8
  },
  { 
    name: "LinkedIn Premium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg",
    category: "software",
    defaultAmount: 30
  },
  { 
    name: "Telegram Premium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg",
    category: "other",
    defaultAmount: 5
  },
  { 
    name: "Discord Nitro", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg",
    category: "other",
    defaultAmount: 10
  },
  
  // VPN & Security
  { 
    name: "NordVPN", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nordvpn.svg",
    category: "software",
    defaultAmount: 12
  },
  { 
    name: "ExpressVPN", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/expressvpn.svg",
    category: "software",
    defaultAmount: 13
  },
  { 
    name: "Surfshark", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/surfshark.svg",
    category: "software",
    defaultAmount: 10
  },
  { 
    name: "ProtonVPN", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/protonvpn.svg",
    category: "software",
    defaultAmount: 10
  },
  
  // Fitness & Health
  { 
    name: "Peloton", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/peloton.svg",
    category: "fitness",
    defaultAmount: 44
  },
  { 
    name: "Strava Premium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/strava.svg",
    category: "fitness",
    defaultAmount: 8
  },
  { 
    name: "MyFitnessPal", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/myfitnesspal.svg",
    category: "fitness",
    defaultAmount: 10
  },
  { 
    name: "Calm", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/calm.svg",
    category: "fitness",
    defaultAmount: 15
  },
  { 
    name: "Headspace", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/headspace.svg",
    category: "fitness",
    defaultAmount: 13
  },
  
  // Food Delivery
  { 
    name: "Uber Eats Pass", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/ubereats.svg",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "DoorDash DashPass", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/doordash.svg",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "Grubhub+", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/grubhub.svg",
    category: "other",
    defaultAmount: 10
  },
  
  // Finance & Banking
  { 
    name: "Revolut Premium", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/revolut.svg",
    category: "other",
    defaultAmount: 8
  },
  { 
    name: "N26 You", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/n26.svg",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "YNAB", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/ynab.svg",
    category: "software",
    defaultAmount: 15
  },
  
  // Reading & Books
  { 
    name: "Kindle Unlimited", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/amazon.svg",
    category: "other",
    defaultAmount: 10
  },
  { 
    name: "Scribd", 
    logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/scribd.svg",
    category: "other",
    defaultAmount: 12
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