import { useState } from 'react';
import { challengeTemplates, challengeCategories, difficultyLevels, type ChallengeCategory, type ChallengeDifficulty } from '@/types/challenges';
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
import { Sparkles, Calendar, Target, TrendingUp } from 'lucide-react';

interface ChallengeTemplateSelectorProps {
  onSelect: (template: { 
    name: string; 
    description: string;
    category: ChallengeCategory;
    difficulty: ChallengeDifficulty;
    duration: number;
  }) => void;
}

export const ChallengeTemplateSelector = ({ onSelect }: ChallengeTemplateSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | 'all'>('all');

  const filteredTemplates = selectedCategory === 'all' 
    ? challengeTemplates 
    : challengeTemplates.filter(t => t.category === selectedCategory);

  const handleSelect = (template: typeof challengeTemplates[0]) => {
    onSelect({
      name: template.name,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      duration: template.duration,
    });
    setOpen(false);
  };

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    const level = difficultyLevels.find(d => d.value === difficulty);
    return level?.color || 'text-gray-500';
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
            Choose a Challenge Template
          </DialogTitle>
          <DialogDescription>
            Start with a proven challenge and customize it to your goals
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            {challengeCategories.map(cat => (
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{template.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getDifficultyColor(template.difficulty)}`}
                            >
                              <TrendingUp className="mr-1 h-3 w-3" />
                              {difficultyLevels.find(d => d.value === template.difficulty)?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {challengeCategories.find(c => c.value === template.category)?.emoji}{' '}
                              {challengeCategories.find(c => c.value === template.category)?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="mr-1 h-3 w-3" />
                              {template.duration} days
                            </Badge>
                            {template.targetValue && (
                              <Badge variant="outline" className="text-xs">
                                <Target className="mr-1 h-3 w-3" />
                                Goal: {template.targetValue}
                              </Badge>
                            )}
                          </div>
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
