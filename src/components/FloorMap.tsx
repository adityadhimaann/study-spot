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
  amenities?: string[];
  rating?: number;
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
          amenities: r.amenities || [],
          rating: r.rating || 4.5,
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

  const renderFurniture = (room: Room) => {
    const furniture: JSX.Element[] = [];
    
    if (room.type === "quiet") {
      const pad = 16;
      const deskW = 16;
      const deskH = 12;
      
      // Top-Left desk
      furniture.push(
        <g key="carrel-1" className="stroke-indigo-500/20 fill-none" strokeWidth={0.7}>
          <rect x={room.x + pad} y={room.y + pad} width={deskW} height={deskH} rx={1} />
          <circle cx={room.x + pad + deskW/2} cy={room.y + pad + deskH + 4} r={2} className="stroke-indigo-500/30" />
        </g>
      );
      
      // Top-Right desk
      furniture.push(
        <g key="carrel-2" className="stroke-indigo-500/20 fill-none" strokeWidth={0.7}>
          <rect x={room.x + room.w - pad - deskW} y={room.y + pad} width={deskW} height={deskH} rx={1} />
          <circle cx={room.x + room.w - pad - deskW/2} cy={room.y + pad + deskH + 4} r={2} className="stroke-indigo-500/30" />
        </g>
      );

      // Bottom-Right desk
      furniture.push(
        <g key="carrel-3" className="stroke-indigo-500/20 fill-none" strokeWidth={0.7}>
          <rect x={room.x + room.w - pad - deskW} y={room.y + room.h - pad - deskH} width={deskW} height={deskH} rx={1} />
          <circle cx={room.x + room.w - pad - deskW/2} cy={room.y + room.h - pad - deskH - 4} r={2} className="stroke-indigo-500/30" />
        </g>
      );
    } else {
      const tblW = room.w * 0.45;
      const tblH = room.h * 0.35;
      const tblX = room.x + (room.w - tblW) / 2;
      const tblY = room.y + (room.h - tblH) / 2;
      
      furniture.push(
        <g key="group-furniture" className="stroke-indigo-500/20 fill-none" strokeWidth={0.8}>
          <rect x={tblX} y={tblY} width={tblW} height={tblH} rx={tblH/2} className="fill-indigo-500/5 stroke-indigo-500/20" />
          <circle cx={tblX + tblW*0.25} cy={tblY - 4} r={2.5} className="stroke-indigo-500/30" />
          <circle cx={tblX + tblW*0.5} cy={tblY - 4} r={2.5} className="stroke-indigo-500/30" />
          <circle cx={tblX + tblW*0.75} cy={tblY - 4} r={2.5} className="stroke-indigo-500/30" />
          <circle cx={tblX + tblW*0.25} cy={tblY + tblH + 4} r={2.5} className="stroke-indigo-500/30" />
          <circle cx={tblX + tblW*0.5} cy={tblY + tblH + 4} r={2.5} className="stroke-indigo-500/30" />
          <circle cx={tblX + tblW*0.75} cy={tblY + tblH + 4} r={2.5} className="stroke-indigo-500/30" />
          <circle cx={tblX - 4} cy={tblY + tblH/2} r={2.5} className="stroke-indigo-500/30" />
          <circle cx={tblX + tblW + 4} cy={tblY + tblH/2} r={2.5} className="stroke-indigo-500/30" />
        </g>
      );
    }
    
    return furniture;
  };

  const filteredRooms = selectedFloor === "all" ? liveRooms : liveRooms.filter((r) => r.floor === selectedFloor);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-1 rounded-2xl border w-fit backdrop-blur-sm shadow-sm">
        {["all", "1st", "2nd", "3rd"].map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFloor(f)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300",
              selectedFloor === f 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {f === "all" ? "🌐 All Floors" : `🏢 ${f} Floor`}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/15 bg-[#080812] text-white shadow-2xl">
        <svg viewBox="0 0 440 400" className="w-full h-auto max-w-2xl mx-auto aspect-[1.1]">
          {/* Custom SVG CSS Animations */}
          <style>{`
            @keyframes walkwayFlow {
              to {
                stroke-dashoffset: -20;
              }
            }
            .animated-walkway {
              stroke-dasharray: 6 4;
              animation: walkwayFlow 2s linear infinite;
            }
          `}</style>

          {/* Blueprint SVG Gradients Definitions */}
          <defs>
            <linearGradient id="grad-available" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="grad-almost-full" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="grad-booked" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines (Technical layout blueprint) */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`g${i}`} x1={i * 22} y1={0} x2={i * 22} y2={400} className="stroke-indigo-500/10" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 22} x2={440} y2={i * 22} className="stroke-indigo-500/10" strokeWidth={0.5} />
          ))}

          {/* Hallway Walkway Guideline paths (Flowing laser track) */}
          <g className="stroke-indigo-400/25 fill-none animated-walkway" strokeWidth={1.2}>
            <line x1={20} y1={130} x2={420} y2={130} />
            <line x1={20} y1={270} x2={420} y2={270} />
            <line x1={148} y1={20} x2={148} y2={380} />
            <line x1={288} y1={20} x2={288} y2={380} />
          </g>

          {/* Restrooms Block (Detailed with sinks/toilets) */}
          <g className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={0.8}>
            <rect x={180} y={5} width={80} height={22} rx={4} />
            <line x1={220} y1={5} x2={220} y2={27} className="stroke-indigo-500/15" />
            {/* Sinks */}
            <circle cx={194} cy={10} r={2} className="stroke-indigo-500/20" />
            <circle cx={206} cy={10} r={2} className="stroke-indigo-500/20" />
            {/* Toilets */}
            <rect x={228} y={8} width={8} height={10} rx={1} className="stroke-indigo-500/20" />
            <rect x={244} y={8} width={8} height={10} rx={1} className="stroke-indigo-500/20" />
            <text x={220} y={20} textAnchor="middle" className="fill-indigo-400/80 text-[6px] font-black tracking-widest uppercase">RESTROOMS 🚻</text>
          </g>

          {/* Lobby Entrance Info Desk (Curved architectural table) */}
          <g className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={1}>
            <path d="M 180 395 Q 220 380 260 395" className="fill-none stroke-indigo-400" strokeWidth={2} />
            <circle cx={205} cy={392} r={2} className="fill-indigo-500/25 stroke-indigo-500/20" />
            <circle cx={235} cy={392} r={2} className="fill-indigo-500/25 stroke-indigo-500/20" />
            <text x={220} y={375} textAnchor="middle" className="fill-indigo-400 text-[7px] font-black tracking-widest">INFO & RECEPTION</text>
          </g>

          {/* Stairwell and Elevator Bay structural elements */}
          <g className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={1}>
            {/* Stairwell */}
            <rect x={20} y={5} width={70} height={22} rx={4} />
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`st${i}`} x1={20 + (i * 10)} y1={5} x2={20 + (i * 10)} y2={27} className="stroke-indigo-500/20" strokeWidth={0.8} />
            ))}
            <text x={55} y={19} className="fill-indigo-400 text-[8px] font-bold tracking-wider">STAIRS ↗</text>

            {/* Elevator Bay */}
            <rect x={350} y={5} width={70} height={22} rx={4} />
            <line x1={350} y1={5} x2={420} y2={27} className="stroke-indigo-500/20" strokeWidth={0.5} />
            <line x1={420} y1={5} x2={350} y2={27} className="stroke-indigo-500/20" strokeWidth={0.5} />
            <text x={385} y={19} textAnchor="middle" className="fill-indigo-400 text-[8px] font-bold tracking-wider">ELEVATOR 🛗</text>
          </g>

          {filteredRooms.map((room) => {
            const colors = statusColors[room.status];
            const isHovered = hoveredRoom === room.id;
            
            // Map room status colors to SVGs custom gradients
            const roomGradient = `url(#grad-${room.status})`;

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
                className={cn("cursor-pointer transition-all duration-300", room.status === "booked" && "cursor-not-allowed opacity-60")}
              >
                {/* Outer Room Border (Architectural Double-Wall style) */}
                <rect
                  x={room.x - 1.5}
                  y={room.y - 1.5}
                  width={room.w + 3}
                  height={room.h + 3}
                  rx={9}
                  className="fill-none stroke-indigo-500/10"
                  strokeWidth={1}
                />

                {/* Inner Room Rect */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={8}
                  fill={roomGradient}
                  className={cn(colors.stroke, "transition-all duration-300")}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{ filter: isHovered ? "drop-shadow(0 0 16px rgba(99,102,241,0.4))" : undefined }}
                />

                {/* Vector Room Furniture (Visual blueprint desks & tables) */}
                {renderFurniture(room)}

                {/* Architectural Door Swings */}
                <g className="transition-opacity duration-200">
                  {/* Door frame line */}
                  <line 
                    x1={room.x} 
                    y1={room.y + room.h - 12} 
                    x2={room.x} 
                    y2={room.y + room.h} 
                    className="stroke-indigo-400/40" 
                    strokeWidth={1.2} 
                  />
                  {/* Open swinging door */}
                  <line 
                    x1={room.x} 
                    y1={room.y + room.h} 
                    x2={room.x + 10} 
                    y2={room.y + room.h - 8} 
                    className={cn(colors.stroke, "opacity-75")} 
                    strokeWidth={1} 
                  />
                  {/* Swinging Arc */}
                  <path 
                    d={`M ${room.x} ${room.y + room.h - 12} A 12 12 0 0 1 ${room.x + 12} ${room.y + room.h}`} 
                    className="stroke-indigo-400/20 fill-none" 
                    strokeDasharray="2 2" 
                    strokeWidth={0.8} 
                  />
                </g>

                {/* Room Name Label */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 - 8}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-black uppercase tracking-wider"
                >
                  {room.name}
                </text>
                
                {/* Room Capacity Badge */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 + 8}
                  textAnchor="middle"
                  className="fill-indigo-200 text-[8px] font-medium tracking-wide"
                >
                  Cap: {room.capacity} · {colors.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip Card */}
        <AnimatePresence>
          {hoveredRoom && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl z-30"
            >
              {(() => {
                const room = liveRooms.find((r) => r.id === hoveredRoom)!;
                const colors = statusColors[room.status];
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                        {room.type === "quiet" ? <Volume2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white uppercase tracking-wider">{room.name}</p>
                          <Badge variant={room.status === "available" ? "default" : "destructive"} className="text-[9px] px-1.5 py-0.25">
                            {colors.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{room.floor} Floor · Capacity: {room.capacity} people</p>
                      </div>
                    </div>
                    
                    {/* Stars & Amenities lists */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={cn("text-xs", i < Math.floor(room.rating || 4.5) ? "text-amber-400" : "text-slate-600")}>★</span>
                        ))}
                        <span className="text-[10px] font-bold text-slate-300 ml-1">{(room.rating || 4.5).toFixed(1)}</span>
                      </div>
                      
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex gap-1">
                          {room.amenities.slice(0, 3).map((a) => (
                            <span key={a} className="rounded-md bg-indigo-500/15 border border-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
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
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border bg-card/40 p-3 text-xs text-muted-foreground backdrop-blur-sm">
        <span className="font-bold text-foreground mr-1 uppercase tracking-wider text-[10px]">Room Status:</span>
        {Object.entries(statusColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
            <span className={cn("h-2 w-2 rounded-full", val.dot, key === "available" || key === "almost-full" ? "animate-pulse" : "")} />
            <span className="text-foreground/80">{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
