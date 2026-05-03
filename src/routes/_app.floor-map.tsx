import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { FloorMap } from "@/components/FloorMap";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/floor-map")({
  component: FloorMapPage,
  head: () => ({
    meta: [{ title: "Floor Map — StudySpace" }],
  }),
});

function FloorMapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Interactive Floor Map</h1>
        <p className="mt-1 text-muted-foreground">Click on any available room to start booking.</p>
      </div>
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <FloorMap onRoomSelect={(id) => toast.success(`Selected room ${id} — redirecting to booking...`)} />
        </CardContent>
      </Card>
    </div>
  );
}
