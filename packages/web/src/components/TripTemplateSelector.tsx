import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface TripTemplateSelectorProps {
  selectedTemplate: string | null;
  onSelectTemplate: (templateId: string | null) => void;
}

export function TripTemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TripTemplateSelectorProps) {
  const { t } = useTranslation();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["trip-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_templates")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center text-sm text-muted-foreground">{t("common.loading")}</div>;
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">{t("trips.templates.selectTemplate")}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Card
          className={`p-4 cursor-pointer transition-all hover:border-primary ${
            selectedTemplate === null ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => onSelectTemplate(null)}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">✨</div>
            <div className="font-medium text-sm">{t("trips.templates.blank")}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("trips.templates.blankDescription")}
            </div>
          </div>
        </Card>

        {templates?.map((template) => (
          <Card
            key={template.id}
            className={`p-4 cursor-pointer transition-all hover:border-primary ${
              selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{template.icon}</div>
              <div className="font-medium text-sm">{template.name}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {template.description}
              </div>
              <Badge variant="secondary" className="mt-2 text-xs">
                {template.category}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
