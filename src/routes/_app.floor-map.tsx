import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();

  return (
    <div className="space-y-6 w-full max-w-none">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm w-full max-w-none overflow-hidden">
        <CardContent className="p-2 md:p-4 w-full">
          <FloorMap onRoomSelect={(id, name) => {
            toast.success(`Selected room ${name} — redirecting to booking...`);
            setTimeout(() => {
              navigate({ to: "/booking", search: { roomId: id } });
            }, 800);
          }} />
        </CardContent>
      </Card>
    </div>
  );
}
