import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Inbox, Briefcase, User, Calendar, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProjectSelectorProps {
  projects: string[];
  selectedProject: string;
  onSelectProject: (project: string) => void;
}

const PROJECT_ICONS: Record<string, any> = {
  'Inbox': Inbox,
  'Today': Calendar,
  'Work': Briefcase,
  'Personal': User,
};

const ProjectSelector = ({ projects, selectedProject, onSelectProject }: ProjectSelectorProps) => {
  const { t } = useTranslation();
  
  const getProjectDisplayName = (project: string) => {
    if (project === 'Inbox') return t('projects.inbox');
    if (project === 'Today') return t('projects.today');
    return project;
  };
  
  return (
    <div className="flex-1 overflow-y-auto p-2">
      <div className="space-y-1">
        {projects.map((project) => {
          const Icon = PROJECT_ICONS[project] || FolderOpen;
          const isSelected = selectedProject === project;

          return (
            <Button
              key={project}
              variant={isSelected ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start text-left font-normal',
                isSelected && 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
              onClick={() => onSelectProject(project)}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span className="flex-1">{getProjectDisplayName(project)}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectSelector;
