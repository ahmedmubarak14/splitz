import { useState } from 'react';
import { habitTemplates, habitCategories, type HabitCategory } from '@/types/habits';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Target } from 'lucide-react';

interface HabitTemplateSelectorProps {
  onSelect: (template: { name: string; icon: string; category: HabitCategory; targetDays: number }) => void;
}

export const HabitTemplateSelector = ({ onSelect }: HabitTemplateSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');

  const filteredTemplates = selectedCategory === 'all' 
    ? habitTemplates 
    : habitTemplates.filter(t => t.category === selectedCategory);

  const handleSelect = (template: typeof habitTemplates[0]) => {
    onSelect({
      name: template.name,
      icon: template.icon,
      category: template.category,
      targetDays: template.targetDays,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Choose a Habit Template
          </DialogTitle>
          <DialogDescription>
            Start with a proven habit template and customize it to your needs
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as HabitCategory | 'all')}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            {habitCategories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                <span className="mr-1">{cat.emoji}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4 space-y-3">
            {filteredTemplates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No templates in this category
              </p>
            ) : (
              <div className="grid gap-3">
                {filteredTemplates.map((template, idx) => (
                  <Card 
                    key={idx} 
                    className="hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handleSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{template.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold">{template.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              <Target className="mr-1 h-3 w-3" />
                              {template.targetDays} days
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {habitCategories.find(c => c.value === template.category)?.emoji}{' '}
                            {habitCategories.find(c => c.value === template.category)?.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
