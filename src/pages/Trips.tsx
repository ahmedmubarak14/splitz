import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TripCard } from "@/components/TripCard";
import { CreateTripDialog } from "@/components/CreateTripDialog";
import { EmptyState } from "@/components/EmptyState";

export default function Trips() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          trip_members(count),
          trip_tasks(id, status)
        `)
        .order("start_date", { ascending: true });

      if (error) {
        toast.error("Failed to load trips");
        throw error;
      }
      return data;
    },
  });

  return (
    <>
      <SEO 
        title="Trips - Splitz"
        description="Plan trips with friends and manage group tasks"
      />
      
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Trips
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan adventures with your crew
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Plan Trip
          </Button>
        </div>

        {/* Trips List */}
        {isLoading ? (
          <div className="text-center py-12">Loading trips...</div>
        ) : !trips || trips.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No trips planned yet"
            description="Start planning your next adventure with friends"
            actionLabel="Plan Your First Trip"
            onAction={() => setCreateDialogOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        <CreateTripDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </>
  );
}