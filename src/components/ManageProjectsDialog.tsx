import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { UserProject } from '@/hooks/useUserProjects';

const EMOJI_OPTIONS = ['📥', '💼', '🏠', '📚', '🎯', '🏋️', '🎨', '🛒', '💡', '🔧', '🌱', '📁', '👋', '🚀', '⭐', '🎮', '📝', '🏖️', '🎵', '❤️'];

interface ManageProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: UserProject[];
  onAdd: (data: { name: string; emoji: string }) => void;
  onUpdate: (data: { id: string; name: string; emoji: string }) => void;
  onDelete: (id: string) => void;
  isAdding?: boolean;
}

const ManageProjectsDialog = ({
  open,
  onOpenChange,
  projects,
  onAdd,
  onUpdate,
  onDelete,
  isAdding,
}: ManageProjectsDialogProps) => {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📁');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error(t('tasks.projects.nameRequired'));
      return;
    }
    onAdd({ name: newName.trim(), emoji: newEmoji });
    setNewName('');
    setNewEmoji('📁');
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    onUpdate({ id, name: editName.trim(), emoji: editEmoji });
    setEditingId(null);
  };

  const startEditing = (project: UserProject) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditEmoji(project.emoji);
    setShowEmojiPicker(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('tasks.projects.manage')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing projects */}
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20"
              >
                {editingId === project.id ? (
                  <>
                    <button
                      onClick={() => setShowEmojiPicker(showEmojiPicker === project.id ? null : project.id)}
                      className="text-lg flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {editEmoji}
                    </button>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(project.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleUpdate(project.id)}>
                      {t('tasks.projects.save')}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                      ✕
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-lg flex-shrink-0">{project.emoji}</span>
                    <span className="text-sm font-medium flex-1">{project.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEditing(project)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/70 hover:text-destructive"
                      onClick={() => onDelete(project.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}

                {/* Inline emoji picker */}
                {showEmojiPicker === project.id && editingId === project.id && (
                  <div className="absolute mt-20 ml-0 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 grid grid-cols-5 gap-1 w-48">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => { setEditEmoji(e); setShowEmojiPicker(null); }}
                        className={cn(
                          'text-lg p-1.5 rounded hover:bg-muted transition-colors',
                          editEmoji === e && 'bg-primary/20'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add new project */}
          <div className="border-t border-border/50 pt-4">
            <Label className="text-sm font-medium mb-2 block">{t('tasks.projects.addNew')}</Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmojiPicker(showEmojiPicker === 'new' ? null : 'new')}
                className="text-lg flex-shrink-0 p-2 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                {newEmoji}
              </button>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('tasks.projects.namePlaceholder')}
                className="h-9 text-sm flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />
              <Button size="sm" onClick={handleAdd} disabled={isAdding}>
                <Plus className="w-4 h-4 mr-1" />
                {t('tasks.projects.add')}
              </Button>
            </div>

            {/* Emoji picker for new */}
            {showEmojiPicker === 'new' && (
              <div className="mt-2 p-2 bg-popover border border-border rounded-lg shadow-lg grid grid-cols-5 gap-1 w-48">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { setNewEmoji(e); setShowEmojiPicker(null); }}
                    className={cn(
                      'text-lg p-1.5 rounded hover:bg-muted transition-colors',
                      newEmoji === e && 'bg-primary/20'
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageProjectsDialog;
