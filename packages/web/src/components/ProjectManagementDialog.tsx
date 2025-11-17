import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ProjectManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: string[];
}

const ProjectManagementDialog = ({ open, onOpenChange, projects }: ProjectManagementDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <span className="font-medium">{project}</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground text-center py-4">
            Project management features coming soon
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectManagementDialog;
