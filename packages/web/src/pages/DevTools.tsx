import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { generateTestData } from '@/lib/generateTestData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function DevTools() {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const handleGenerateData = async () => {
    setLoading(true);
    try {
      const result = await generateTestData();
      setStats(result);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL your data (habits, challenges, expenses, etc). This cannot be undone. Continue?')) {
      return;
    }

    setDeleting(true);
    const toastId = toast.loading('Deleting all data...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete in correct order (respect foreign keys)
      await supabase.from('habit_check_ins').delete().eq('user_id', user.id);
      await supabase.from('habits').delete().eq('user_id', user.id);
      
      await supabase.from('challenge_progress_history').delete().eq('user_id', user.id);
      await supabase.from('challenge_participants').delete().eq('user_id', user.id);
      await supabase.from('challenges').delete().eq('creator_id', user.id);
      
      await supabase.from('expense_members').delete().eq('user_id', user.id);
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('expense_group_members').delete().eq('user_id', user.id);
      await supabase.from('expense_groups').delete().eq('created_by', user.id);
      
      await supabase.from('focus_sessions').delete().eq('user_id', user.id);
      await supabase.from('focus_tasks').delete().eq('user_id', user.id);
      
      await supabase.from('notifications').delete().eq('user_id', user.id);

      toast.success('All data deleted successfully', { id: toastId });
      setStats(null);
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Failed to delete data', { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Developer Tools</h1>
        <p className="text-muted-foreground">
          Generate test data and manage your development environment
        </p>
      </div>

      <div className="grid gap-6">
        {/* Test Data Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Test Data Generator
            </CardTitle>
            <CardDescription>
              Generate realistic test data to validate app performance at scale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                This will create:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>50 habits with realistic check-in patterns (30-90 days history)</li>
                  <li>20 challenges with varying progress levels</li>
                  <li>10 expense groups with 100+ expenses total</li>
                  <li>50 focus sessions across different types</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGenerateData}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Generating...' : 'Generate Test Data'}
            </Button>

            {stats && (
              <Alert className="bg-success/10 border-success">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Successfully created: {stats.habits} habits, {stats.checkIns} check-ins, {stats.challenges} challenges, {stats.groups} groups, {stats.expenses} expenses, {stats.sessions} sessions
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Data Cleanup */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete All Data
            </CardTitle>
            <CardDescription>
              Permanently delete all your data (habits, challenges, expenses, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>WARNING:</strong> This action cannot be undone. All your habits, challenges, expenses, focus sessions, and related data will be permanently deleted.
              </AlertDescription>
            </Alert>

            <Button
              variant="destructive"
              onClick={handleDeleteAllData}
              disabled={deleting}
              className="w-full"
              size="lg"
            >
              {deleting ? 'Deleting...' : 'Delete All Data'}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Development Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Test data is created for the currently logged-in user only</p>
            <p>• Database indexes ensure queries remain fast even with large datasets</p>
            <p>• All RLS policies are enforced - data is properly secured</p>
            <p>• Check-ins are realistic (70% completion rate with gaps)</p>
            <p>• Use this to validate UI performance and load times</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
