import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { useIsRTL, rtlClass } from "@/lib/rtl-utils";

interface SubscriptionTemplateSelectorProps {
  onSelect: (template: any) => void;
  selectedTemplate?: string | null;
}

export const SubscriptionTemplateSelector = ({ 
  onSelect, 
  selectedTemplate 
}: SubscriptionTemplateSelectorProps) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['subscription-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_templates')
        .select('*')
        .order('popularity_score', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryGroups = filteredTemplates.reduce((acc: Record<string, any[]>, template) => {
    const category = template.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
        <Input
          placeholder={t('subscriptions.searchServices')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(categoryGroups).map(([category, categoryTemplates]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground capitalize">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categoryTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => onSelect(template)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          {template.logo_url ? (
                            <img
                              src={template.logo_url}
                              alt={template.name}
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs">
                              {template.name[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{template.name}</p>
                            {template.typical_price && (
                              <p className="text-xs text-muted-foreground">
                                {template.typical_currency} {template.typical_price}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            
            {filteredTemplates.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {t('subscriptions.noServicesFound')}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
