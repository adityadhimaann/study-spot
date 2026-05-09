import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Volume2, Wifi, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

// Fallback hardcoded initial layouts if DB is empty
const defaultLayouts: Record<string, {x:number, y:number, w:number, h:number}> = {
  "Quiet Zone A1": { x: 20, y: 40, w: 120, h: 80 },
  "Quiet Zone A2": { x: 160, y: 40, w: 120, h: 80 },
  "Quiet Zone A3": { x: 300, y: 40, w: 120, h: 80 },
  "Group Room B1": { x: 20, y: 160, w: 180, h: 100 },
  "Group Room B2": { x: 220, y: 160, w: 200, h: 100 },
  "Quiet Zone C1": { x: 20, y: 300, w: 120, h: 80 },
  "Group Room C2": { x: 160, y: 300, w: 260, h: 80 },
};

const statusColors = {
  available: { fill: "fill-success/20", stroke: "stroke-success", dot: "bg-success", label: "Available" },
  "almost-full": { fill: "fill-warning/20", stroke: "stroke-warning", dot: "bg-warning", label: "Almost Full" },
  booked: { fill: "fill-destructive/20", stroke: "stroke-destructive", dot: "bg-destructive", label: "Booked" },
};

export function FloorMap({ onRoomSelect, isAdmin = false }: { onRoomSelect?: (roomId: string, roomName: string) => void, isAdmin?: boolean }) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  useEffect(() => {
    fetch(`${API_URL}/api/rooms`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const mappedRooms = data.map((r: any) => ({
          id: r._id,
          name: r.name,
          type: r.type,
          capacity: r.capacity,
          status: r.status,
          floor: r.floor,
          x: r.x || defaultLayouts[r.name]?.x || 0,
          y: r.y || defaultLayouts[r.name]?.y || 0,
          w: r.w || defaultLayouts[r.name]?.w || 100,
          h: r.h || defaultLayouts[r.name]?.h || 80,
        }));
        setLiveRooms(mappedRooms);
      })
      .catch(console.error);
  }, []);

  const handleSaveEdit = async () => {
    if (!editingRoom) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/rooms/${editingRoom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          x: editingRoom.x,
          y: editingRoom.y,
          w: editingRoom.w,
          h: editingRoom.h,
        })
      });
      if (res.ok) {
        setLiveRooms(liveRooms.map(r => r.id === editingRoom.id ? editingRoom : r));
        setEditingRoom(null);
        toast.success("Map coordinates saved successfully!");
      } else {
        toast.error("Failed to save map changes.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while saving.");
    }
  };

  const handleDeleteRoom = async () => {
    if (!editingRoom) return;
    if (!window.confirm(`Are you sure you want to delete ${editingRoom.name}? This will also delete any associated bookings.`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/rooms/${editingRoom.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (res.ok) {
        setLiveRooms(liveRooms.filter(r => r.id !== editingRoom.id));
        setEditingRoom(null);
        toast.success("Room deleted successfully!");
      } else {
        toast.error("Failed to delete room.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while deleting.");
    }
  };

  const filteredRooms = selectedFloor === "all" ? liveRooms : liveRooms.filter((r) => r.floor === selectedFloor);

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

      <div className="relative overflow-auto rounded-xl border bg-card/50 backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <svg viewBox="0 0 440 400" className="min-w-[800px] md:min-w-[1000px] h-[600px] md:h-[800px] w-full">
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
                onMouseEnter={() => !editingRoom && setHoveredRoom(room.id)}
                onMouseLeave={() => !editingRoom && setHoveredRoom(null)}
                onClick={() => {
                  if (isAdmin) {
                    setEditingRoom(room);
                  } else {
                    if (room.status !== "booked") onRoomSelect?.(room.id, room.name);
                  }
                }}
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
                const room = liveRooms.find((r) => r.id === hoveredRoom)!;
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
        {/* Admin Edit Panel */}
        {isAdmin && editingRoom && (
          <div className="absolute top-4 right-4 rounded-xl border bg-card/95 p-4 shadow-xl backdrop-blur-md w-64 space-y-3 z-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm truncate pr-2">Edit {editingRoom.name}</h3>
              <button onClick={handleDeleteRoom} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors" title="Delete Room">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-muted-foreground">X Pos</label>
                <input type="number" value={editingRoom.x} onChange={e => setEditingRoom({...editingRoom, x: parseInt(e.target.value)||0})} className="w-full bg-background border rounded px-2 py-1 mt-1" />
              </div>
              <div>
                <label className="text-muted-foreground">Y Pos</label>
                <input type="number" value={editingRoom.y} onChange={e => setEditingRoom({...editingRoom, y: parseInt(e.target.value)||0})} className="w-full bg-background border rounded px-2 py-1 mt-1" />
              </div>
              <div>
                <label className="text-muted-foreground">Width</label>
                <input type="number" value={editingRoom.w} onChange={e => setEditingRoom({...editingRoom, w: parseInt(e.target.value)||0})} className="w-full bg-background border rounded px-2 py-1 mt-1" />
              </div>
              <div>
                <label className="text-muted-foreground">Height</label>
                <input type="number" value={editingRoom.h} onChange={e => setEditingRoom({...editingRoom, h: parseInt(e.target.value)||0})} className="w-full bg-background border rounded px-2 py-1 mt-1" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSaveEdit} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium flex-1">Save</button>
              <button onClick={() => setEditingRoom(null)} className="bg-muted text-muted-foreground px-3 py-1.5 rounded text-xs font-medium flex-1">Cancel</button>
            </div>
          </div>
        )}
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
