import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Volume2, Wifi } from "lucide-react";

interface Room {
  id: string;
  name: string;
  type: "quiet" | "group";
  capacity: number;
  status: "available" | "almost-full" | "booked";
  x: number;
  y: number;
  w: number;
  h: number;
  floor: string;
}

const floorRooms: Room[] = [
  { id: "a1", name: "Quiet Zone A1", type: "quiet", capacity: 1, status: "available", x: 20, y: 40, w: 120, h: 80, floor: "1st" },
  { id: "a2", name: "Quiet Zone A2", type: "quiet", capacity: 1, status: "available", x: 160, y: 40, w: 120, h: 80, floor: "1st" },
  { id: "a3", name: "Quiet Zone A3", type: "quiet", capacity: 1, status: "booked", x: 300, y: 40, w: 120, h: 80, floor: "1st" },
  { id: "b1", name: "Group Room B1", type: "group", capacity: 6, status: "available", x: 20, y: 160, w: 180, h: 100, floor: "2nd" },
  { id: "b2", name: "Group Room B2", type: "group", capacity: 8, status: "almost-full", x: 220, y: 160, w: 200, h: 100, floor: "2nd" },
  { id: "c1", name: "Quiet Zone C1", type: "quiet", capacity: 1, status: "available", x: 20, y: 300, w: 120, h: 80, floor: "3rd" },
  { id: "c2", name: "Group Room C2", type: "group", capacity: 10, status: "available", x: 160, y: 300, w: 260, h: 80, floor: "3rd" },
];

const statusColors = {
  available: { fill: "fill-success/20", stroke: "stroke-success", dot: "bg-success", label: "Available" },
  "almost-full": { fill: "fill-warning/20", stroke: "stroke-warning", dot: "bg-warning", label: "Almost Full" },
  booked: { fill: "fill-destructive/20", stroke: "stroke-destructive", dot: "bg-destructive", label: "Booked" },
};

export function FloorMap({ onRoomSelect }: { onRoomSelect?: (roomId: string) => void }) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState("all");

  const filteredRooms = selectedFloor === "all" ? floorRooms : floorRooms.filter((r) => r.floor === selectedFloor);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {["all", "1st", "2nd", "3rd"].map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFloor(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              selectedFloor === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {f === "all" ? "All Floors" : `${f} Floor`}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm">
        <svg viewBox="0 0 440 400" className="w-full" style={{ minHeight: 300 }}>
          {/* Grid lines */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`g${i}`} x1={i * 22} y1={0} x2={i * 22} y2={400} className="stroke-border/30" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 22} x2={440} y2={i * 22} className="stroke-border/30" strokeWidth={0.5} />
          ))}

          {filteredRooms.map((room) => {
            const colors = statusColors[room.status];
            const isHovered = hoveredRoom === room.id;
            return (
              <g
                key={room.id}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
                onClick={() => room.status !== "booked" && onRoomSelect?.(room.id)}
                className={cn("cursor-pointer transition-all", room.status === "booked" && "cursor-not-allowed opacity-60")}
              >
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={8}
                  className={cn(colors.fill, colors.stroke, "transition-all duration-200")}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{ filter: isHovered ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" : undefined }}
                />
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 - 6}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-semibold"
                >
                  {room.name}
                </text>
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 + 10}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  Cap: {room.capacity} · {colors.label}
                </text>
                {room.status === "available" && (
                  <circle cx={room.x + room.w - 12} cy={room.y + 12} r={4} className="fill-success animate-pulse" />
                )}
                {room.status === "almost-full" && (
                  <circle cx={room.x + room.w - 12} cy={room.y + 12} r={4} className="fill-warning animate-pulse" />
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredRoom && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-4 left-4 right-4 rounded-xl border bg-card/95 p-4 shadow-xl backdrop-blur-md"
            >
              {(() => {
                const room = floorRooms.find((r) => r.id === hoveredRoom)!;
                const colors = statusColors[room.status];
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {room.type === "quiet" ? <Volume2 className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-card-foreground">{room.name}</p>
                      <p className="text-xs text-muted-foreground">{room.floor} Floor · Capacity: {room.capacity}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
                      <span className="text-xs font-medium text-muted-foreground">{colors.label}</span>
                    </div>
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {Object.entries(statusColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", val.dot)} />
            <span>{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
