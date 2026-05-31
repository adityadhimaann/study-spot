import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Volume2, Wifi, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

// Expanded layout — 4 columns × 3 rows grid across a much larger canvas
const defaultLayouts: Record<string, {x:number, y:number, w:number, h:number}> = {
  // ── ROW 1 (y ≈ 60) ────────────────────────────────
  "Quiet Zone A1": { x: 30,  y: 60,  w: 170, h: 110 },
  "Quiet Zone A2": { x: 230, y: 60,  w: 170, h: 110 },
  "Quiet Zone A3": { x: 430, y: 60,  w: 170, h: 110 },
  "Quiet Zone A4": { x: 630, y: 60,  w: 170, h: 110 },

  // ── ROW 2 (y ≈ 250) ───────────────────────────────
  "Group Room B1": { x: 30,  y: 250, w: 270, h: 140 },
  "Group Room B2": { x: 330, y: 250, w: 270, h: 140 },
  "Group Room B3": { x: 630, y: 250, w: 170, h: 140 },

  // ── ROW 3 (y ≈ 470) ───────────────────────────────
  "Quiet Zone C1": { x: 30,  y: 470, w: 170, h: 110 },
  "Group Room C2": { x: 230, y: 470, w: 270, h: 110 },
  "Quiet Zone C3": { x: 530, y: 470, w: 170, h: 110 },
  "Quiet Zone C4": { x: 730, y: 470, w: 100, h: 110 },
};

const statusColors = {
  available: { fill: "fill-emerald-500/10", stroke: "stroke-emerald-500/40", dot: "bg-emerald-500", label: "Available" },
  "almost-full": { fill: "fill-warning/15", stroke: "stroke-warning/50", dot: "bg-warning", label: "Almost Full" },
  booked: { fill: "fill-destructive/10", stroke: "stroke-destructive/35", dot: "bg-destructive", label: "Booked" },
};

// Deterministic occupancy helper to simulate detailed seating in each room
const getOccupancy = (roomName: string, status: string, totalSeats: number): boolean[] => {
  const occupancy: boolean[] = [];
  let hash = 0;
  for (let i = 0; i < roomName.length; i++) {
    hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  for (let i = 0; i < totalSeats; i++) {
    const seatHash = Math.abs((hash + i) % 100);
    if (status === "booked") {
      occupancy.push(true);
    } else if (status === "almost-full") {
      occupancy.push(seatHash < 75);
    } else {
      occupancy.push(seatHash < 25);
    }
  }
  return occupancy;
};

// High-fidelity office chair drawing in SVG
const renderChair = (
  cx: number, 
  cy: number, 
  orientation: "up" | "down" | "left" | "right", 
  isOccupied: boolean, 
  status: string,
  key: string
) => {
  let chairClass = "stroke-indigo-500/30 fill-none";
  let occupantClass = "fill-none";
  
  if (isOccupied) {
    if (status === "booked") {
      chairClass = "stroke-destructive/60 fill-destructive/5";
      occupantClass = "fill-destructive/40";
    } else if (status === "almost-full") {
      chairClass = "stroke-warning/60 fill-warning/10";
      occupantClass = "fill-warning/50 animate-pulse";
    } else {
      chairClass = "stroke-cyan-500/60 fill-cyan-500/10";
      occupantClass = "fill-cyan-400/60";
    }
  }

  const seatSize = 6.5;
  const hSeat = seatSize / 2;
  let backrestPath = "";
  
  switch (orientation) {
    case "up":
      backrestPath = `M ${cx - 3} ${cy + 3.2} Q ${cx} ${cy + 4.5} ${cx + 3} ${cy + 3.2}`;
      break;
    case "down":
      backrestPath = `M ${cx - 3} ${cy - 3.2} Q ${cx} ${cy - 4.5} ${cx + 3} ${cy - 3.2}`;
      break;
    case "left":
      backrestPath = `M ${cx + 3.2} ${cy - 3} Q ${cx + 4.5} ${cy} ${cx + 3.2} ${cy + 3}`;
      break;
    case "right":
      backrestPath = `M ${cx - 3.2} ${cy - 3} Q ${cx - 4.5} ${cy} ${cx - 3.2} ${cy + 3}`;
      break;
  }

  return (
    <g key={key} className={chairClass} strokeWidth={0.7}>
      <rect x={cx - hSeat} y={cy - hSeat} width={seatSize} height={seatSize} rx={1} />
      <path d={backrestPath} fill="none" />
      {isOccupied && <circle cx={cx} cy={cy} r={1.5} className={occupantClass} />}
    </g>
  );
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
          w: r.w || defaultLayouts[r.name]?.w || 150,
          h: r.h || defaultLayouts[r.name]?.h || 100,
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

  // Helper for nice short technical codes e.g. "QZ-A1"
  const getRoomCode = (name: string) => {
    if (name.includes("Quiet")) return `QZ-${name.slice(-2)}`;
    if (name.includes("Group")) return `GR-${name.slice(-2)}`;
    return `RM-${name.slice(-3).trim()}`;
  };

  const renderFurniture = (room: Room) => {
    const furniture: JSX.Element[] = [];
    
    // 1. AC Vents & Ceiling lights background details
    furniture.push(
      <g key="ac-vents" className="stroke-indigo-500/10 fill-none" strokeWidth={0.4}>
        {/* Top left AC vent */}
        <rect x={room.x + 5} y={room.y + 5} width={7} height={7} rx={0.5} />
        <line x1={room.x + 5} y1={room.y + 5} x2={room.x + 12} y2={room.y + 12} />
        <line x1={room.x + 12} y1={room.y + 5} x2={room.x + 5} y2={room.y + 12} />
        
        {/* Bottom right AC vent */}
        <rect x={room.x + room.w - 12} y={room.y + room.h - 12} width={7} height={7} rx={0.5} />
        <line x1={room.x + room.w - 12} y1={room.y + room.h - 12} x2={room.x - 5 + room.w} y2={room.y - 5 + room.h} />
        <line x1={room.x - 5 + room.w} y1={room.y + room.h - 12} x2={room.x - 12 + room.w} y2={room.y - 5 + room.h} />
      </g>
    );

    // Spotlight ceiling grid
    const spotCoords = room.type === "quiet" 
      ? [{x: 0.3, y: 0.35}, {x: 0.7, y: 0.35}, {x: 0.3, y: 0.65}, {x: 0.7, y: 0.65}]
      : [{x: 0.2, y: 0.25}, {x: 0.5, y: 0.25}, {x: 0.8, y: 0.25}, {x: 0.2, y: 0.75}, {x: 0.5, y: 0.75}, {x: 0.8, y: 0.75}];
      
    furniture.push(
      <g key="lights" className="stroke-indigo-400/15 fill-none" strokeWidth={0.5}>
        {spotCoords.map((coord, i) => (
          <g key={`spot-${i}`}>
            <circle cx={room.x + room.w * coord.x} cy={room.y + room.h * coord.y} r={1.5} />
            <circle cx={room.x + room.w * coord.x} cy={room.y + room.h * coord.y} r={4} strokeDasharray="1.5 1.5" className="stroke-indigo-400/5" />
          </g>
        ))}
      </g>
    );

    // Wall Power/Ethernet Outlets
    furniture.push(
      <g key="outlets" className="stroke-indigo-500/20 fill-none" strokeWidth={0.6}>
        <line x1={room.x + 30} y1={room.y} x2={room.x + 32} y2={room.y} />
        <circle cx={room.x + 31} cy={room.y - 1} r={0.5} className="fill-indigo-500/30" />
        <line x1={room.x + room.w - 30} y1={room.y + room.h} x2={room.x + room.w - 32} y2={room.y + room.h} />
        <circle cx={room.x + room.w - 31} cy={room.y + room.h + 1} r={0.5} className="fill-indigo-500/30" />
      </g>
    );

    // 2. Room furniture grids
    if (room.type === "quiet") {
      const pad = 18;
      const deskW = 22;
      const deskH = 14;
      const occupancies = getOccupancy(room.name, room.status, 4);

      // Top-Left Carrel (Desk 1)
      furniture.push(
        <g key="carrel-1">
          <rect x={room.x + pad} y={room.y + pad} width={deskW} height={deskH} rx={1.5} className="stroke-indigo-500/25 fill-indigo-500/[0.02]" strokeWidth={0.7} />
          <line x1={room.x + pad + 3} y1={room.y + pad + deskH - 3} x2={room.x + pad + deskW - 3} y2={room.y + pad + deskH - 3} className="stroke-indigo-500/10" strokeWidth={0.5} />
          {occupancies[0] && (
            <g className="stroke-cyan-500/30 fill-none" strokeWidth={0.5}>
              <line x1={room.x + pad + deskW/2 - 4} y1={room.y + pad + 2.5} x2={room.x + pad + deskW/2 + 4} y2={room.y + pad + 2.5} />
              <rect x={room.x + pad + deskW/2 - 3} y={room.y + pad + 1} width={6} height={2} rx={0.2} className="fill-cyan-500/5 stroke-cyan-500/40" />
            </g>
          )}
          {renderChair(room.x + pad + deskW/2, room.y + pad + deskH + 5, "up", occupancies[0], room.status, "chair-1")}
        </g>
      );
      
      // Top-Right Carrel (Desk 2)
      furniture.push(
        <g key="carrel-2">
          <rect x={room.x + room.w - pad - deskW} y={room.y + pad} width={deskW} height={deskH} rx={1.5} className="stroke-indigo-500/25 fill-indigo-500/[0.02]" strokeWidth={0.7} />
          <line x1={room.x + room.w - pad - deskW + 3} y1={room.y + pad + deskH - 3} x2={room.x + room.w - pad - 3} y2={room.y + pad + deskH - 3} className="stroke-indigo-500/10" strokeWidth={0.5} />
          {occupancies[1] && (
            <g className="stroke-cyan-500/30 fill-none" strokeWidth={0.5}>
              <line x1={room.x + room.w - pad - deskW/2 - 4} y1={room.y + pad + 2.5} x2={room.x + room.w - pad - deskW/2 + 4} y2={room.y + pad + 2.5} />
              <rect x={room.x + room.w - pad - deskW/2 - 3} y={room.y + pad + 1} width={6} height={2} rx={0.2} className="fill-cyan-500/5 stroke-cyan-500/40" />
            </g>
          )}
          {renderChair(room.x + room.w - pad - deskW/2, room.y + pad + deskH + 5, "up", occupancies[1], room.status, "chair-2")}
        </g>
      );

      // Bottom-Left Carrel (Desk 3)
      furniture.push(
        <g key="carrel-3">
          <rect x={room.x + pad} y={room.y + room.h - pad - deskH} width={deskW} height={deskH} rx={1.5} className="stroke-indigo-500/25 fill-indigo-500/[0.02]" strokeWidth={0.7} />
          <line x1={room.x + pad + 3} y1={room.y + room.h - pad - deskH + 3} x2={room.x + pad + deskW - 3} y2={room.y + room.h - pad - deskH + 3} className="stroke-indigo-500/10" strokeWidth={0.5} />
          {occupancies[2] && (
            <g className="stroke-cyan-500/30 fill-none" strokeWidth={0.5}>
              <line x1={room.x + pad + deskW/2 - 4} y1={room.y + room.h - pad - 2.5} x2={room.x + pad + deskW/2 + 4} y2={room.y + room.h - pad - 2.5} />
              <rect x={room.x + pad + deskW/2 - 3} y={room.y + room.h - pad - 1.5} width={6} height={2} rx={0.2} className="fill-cyan-500/5 stroke-cyan-500/40" />
            </g>
          )}
          {renderChair(room.x + pad + deskW/2, room.y + room.h - pad - deskH - 5, "down", occupancies[2], room.status, "chair-3")}
        </g>
      );

      // Bottom-Right Carrel (Desk 4)
      furniture.push(
        <g key="carrel-4">
          <rect x={room.x + room.w - pad - deskW} y={room.y + room.h - pad - deskH} width={deskW} height={deskH} rx={1.5} className="stroke-indigo-500/25 fill-indigo-500/[0.02]" strokeWidth={0.7} />
          <line x1={room.x + room.w - pad - deskW + 3} y1={room.y + room.h - pad - deskH + 3} x2={room.x + room.w - pad - 3} y2={room.y + room.h - pad - deskH + 3} className="stroke-indigo-500/10" strokeWidth={0.5} />
          {occupancies[3] && (
            <g className="stroke-cyan-500/30 fill-none" strokeWidth={0.5}>
              <line x1={room.x + room.w - pad - deskW/2 - 4} y1={room.y + room.h - pad - 2.5} x2={room.x + room.w - pad - deskW/2 + 4} y2={room.y + room.h - pad - 2.5} />
              <rect x={room.x + room.w - pad - deskW/2 - 3} y={room.y + room.h - pad - 1.5} width={6} height={2} rx={0.2} className="fill-cyan-500/5 stroke-cyan-500/40" />
            </g>
          )}
          {renderChair(room.x + room.w - pad - deskW/2, room.y + room.h - pad - deskH - 5, "down", occupancies[3], room.status, "chair-4")}
        </g>
      );
    } else {
      const tblW = room.w * 0.44;
      const tblH = room.h * 0.28;
      const tblX = room.x + (room.w - tblW) / 2;
      const tblY = room.y + (room.h - tblH) / 2;
      const occupancies = getOccupancy(room.name, room.status, 12);
      
      // Collaborative display boards
      furniture.push(
        <g key="boards">
          {/* Whiteboard / Projector screen on top wall */}
          <rect x={room.x + room.w*0.2} y={room.y + 2} width={room.w*0.6} height={2.5} rx={0.5} className="fill-indigo-400/10 stroke-indigo-400/40" strokeWidth={0.6} />
          {/* Flat TV panel on right wall */}
          <rect x={room.x + room.w - 3.5} y={room.y + room.h*0.3} width={2.5} height={room.h*0.4} rx={0.5} className="fill-cyan-400/10 stroke-cyan-400/40" strokeWidth={0.6} />
        </g>
      );

      // Conference Table & Chairs
      furniture.push(
        <g key="group-furniture">
          {/* Table */}
          <rect x={tblX} y={tblY} width={tblW} height={tblH} rx={tblH/2.5} className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={0.8} />
          {/* Faint technical grid lines on table */}
          <line x1={tblX + 15} y1={tblY + tblH/2} x2={tblX + tblW - 15} y2={tblY + tblH/2} className="stroke-indigo-500/10" strokeWidth={0.4} />
          <circle cx={tblX + tblW/2} cy={tblY + tblH/2} r={3} className="stroke-indigo-500/15 fill-none" strokeWidth={0.4} />

          {/* Micro laptops on table */}
          {occupancies[0] && <rect x={tblX + tblW*0.15 - 2} y={tblY + 2} width={4} height={2} className="stroke-cyan-500/30 fill-none" strokeWidth={0.4} />}
          {occupancies[2] && <rect x={tblX + tblW*0.62 - 2} y={tblY + 2} width={4} height={2} className="stroke-cyan-500/30 fill-none" strokeWidth={0.4} />}
          {occupancies[5] && <rect x={tblX + tblW*0.38 - 2} y={tblY + tblH - 4} width={4} height={2} className="stroke-cyan-500/30 fill-none" strokeWidth={0.4} />}
          {occupancies[7] && <rect x={tblX + tblW*0.85 - 2} y={tblY + tblH - 4} width={4} height={2} className="stroke-cyan-500/30 fill-none" strokeWidth={0.4} />}

          {/* Top row chairs (facing down) */}
          {renderChair(tblX + tblW*0.15, tblY - 5.5, "down", occupancies[0], room.status, "gr-c1")}
          {renderChair(tblX + tblW*0.38, tblY - 5.5, "down", occupancies[1], room.status, "gr-c2")}
          {renderChair(tblX + tblW*0.62, tblY - 5.5, "down", occupancies[2], room.status, "gr-c3")}
          {renderChair(tblX + tblW*0.85, tblY - 5.5, "down", occupancies[3], room.status, "gr-c4")}
          
          {/* Bottom row chairs (facing up) */}
          {renderChair(tblX + tblW*0.15, tblY + tblH + 5.5, "up", occupancies[4], room.status, "gr-c5")}
          {renderChair(tblX + tblW*0.38, tblY + tblH + 5.5, "up", occupancies[5], room.status, "gr-c6")}
          {renderChair(tblX + tblW*0.62, tblY + tblH + 5.5, "up", occupancies[6], room.status, "gr-c7")}
          {renderChair(tblX + tblW*0.85, tblY + tblH + 5.5, "up", occupancies[7], room.status, "gr-c8")}
          
          {/* Left chairs (facing right) */}
          {renderChair(tblX - 5.5, tblY + tblH*0.25, "right", occupancies[8], room.status, "gr-c9")}
          {renderChair(tblX - 5.5, tblY + tblH*0.75, "right", occupancies[9], room.status, "gr-c10")}
          
          {/* Right chairs (facing left) */}
          {renderChair(tblX + tblW + 5.5, tblY + tblH*0.25, "left", occupancies[10], room.status, "gr-c11")}
          {renderChair(tblX + tblW + 5.5, tblY + tblH*0.75, "left", occupancies[11], room.status, "gr-c12")}
        </g>
      );
    }
    
    return furniture;
  };

  const filteredRooms = selectedFloor === "all" ? liveRooms : liveRooms.filter((r) => r.floor === selectedFloor);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center gap-1 bg-[#090915]/60 p-1.5 rounded-2xl border border-indigo-500/10 backdrop-blur-md shadow-inner">
          {["all", "1st", "2nd", "3rd"].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 cursor-pointer",
                selectedFloor === f 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105" 
                  : "text-slate-400 hover:bg-indigo-500/10 hover:text-white"
              )}
            >
              {f === "all" ? "🌐 All Floors" : `🏢 ${f} Floor`}
            </button>
          ))}
        </div>

        {/* Technical HUD Live System Info */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-indigo-400/80 bg-indigo-950/20 border border-indigo-500/10 px-4 py-2 rounded-2xl backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>VAULT DETECT: ACTIVE</span>
          <span className="text-slate-600">|</span>
          <span>SENSORS: ONLINE</span>
          <span className="text-slate-600">|</span>
          <span>GRID SYNC: NOMINAL</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#06060c] text-white shadow-2xl w-full">
        {/* SVG Viewport */}
        <svg viewBox="0 0 860 640" className="w-full h-auto min-h-[500px] md:min-h-[600px] lg:min-h-[700px] select-none">
          {/* Custom SVG CSS Animations */}
          <style>{`
            @keyframes walkwayFlow {
              to { stroke-dashoffset: -20; }
            }
            .animated-walkway {
              stroke-dasharray: 6 4;
              animation: walkwayFlow 2.5s linear infinite;
            }
            @keyframes pulseGlow {
              0%, 100% { opacity: 0.1; }
              50% { opacity: 0.35; }
            }
            .pulse-glow {
              animation: pulseGlow 2.5s ease-in-out infinite;
            }
            @keyframes radarSweep {
              0% { transform: translateX(10px); }
              100% { transform: translateX(840px); }
            }
            .radar-line {
              animation: radarSweep 7s linear infinite;
            }
            @keyframes sweepTrailing {
              0% { transform: translateX(0px); }
              100% { transform: translateX(760px); }
            }
            .radar-sweep {
              animation: sweepTrailing 7s linear infinite;
            }
          `}</style>

          {/* Blueprint SVG Gradients & Filters Definitions */}
          <defs>
            <linearGradient id="grad-available" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="grad-almost-full" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="grad-booked" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="grad-radar-sweep" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.25" />
              <stop offset="40%" stopColor="#00f3ff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad-compass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
            </linearGradient>
            
            {/* Soft futuristic glow filters */}
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-indigo" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Blueprint Grid Lines — Vertical */}
          {Array.from({ length: 43 }).map((_, i) => (
            <line key={`gv${i}`} x1={i * 20} y1={10} x2={i * 20} y2={630} className="stroke-indigo-500/[0.04]" strokeWidth={0.5} />
          ))}
          {/* Blueprint Grid Lines — Horizontal */}
          {Array.from({ length: 32 }).map((_, i) => (
            <line key={`gh${i}`} x1={10} y1={i * 20} x2={850} y2={i * 20} className="stroke-indigo-500/[0.04]" strokeWidth={0.5} />
          ))}

          {/* CAD Blueprint Coordinate Labels Along Border Ticks */}
          <g className="fill-indigo-500/25 stroke-indigo-500/15" strokeWidth={0.4}>
            {/* Top scale ticks */}
            {Array.from({ length: 17 }).map((_, i) => (
              <g key={`tscale-${i}`}>
                <line x1={50 + i * 50} y1={10} x2={50 + i * 50} y2={14} />
                {i > 0 && i < 16 && (
                  <text x={50 + i * 50} y={8} textAnchor="middle" className="font-mono text-[5px] fill-indigo-400/40" stroke="none">
                    {`X:${String((50 + i * 50)).padStart(3, "0")}`}
                  </text>
                )}
              </g>
            ))}
            {/* Left scale ticks */}
            {Array.from({ length: 13 }).map((_, i) => (
              <g key={`lscale-${i}`}>
                <line x1={10} y1={50 + i * 45} x2={14} y2={50 + i * 45} />
                {i > 0 && i < 12 && (
                  <text x={4} y={52 + i * 45} textAnchor="start" className="font-mono text-[5px] fill-indigo-400/40" stroke="none">
                    {`Y:${String((50 + i * 45)).padStart(3, "0")}`}
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* Building Outer Wall (Double lined architectural concrete perimeter) */}
          <rect x="10" y="10" width="840" height="620" rx="12" className="fill-none stroke-indigo-500/20" strokeWidth={2} />
          <rect x="13" y="13" width="834" height="614" rx="10" className="fill-none stroke-indigo-500/10" strokeWidth={0.6} />

          {/* ═══ CYBER RADAR LASER SCANNING SWEEP ═══ */}
          <g className="pointer-events-none">
            {/* Trailing Laser Glow */}
            <rect x={10} y={10} width={80} height={620} fill="url(#grad-radar-sweep)" className="radar-sweep" />
            {/* Scanning Laser Beam */}
            <rect x={10} y={10} width={2} height={620} fill="#00f3ff" className="radar-line" filter="url(#glow-cyan)" opacity={0.7} />
          </g>

          {/* ═══ HALLWAY WALKWAYS (Flowing cyber vector tracks) ═══ */}
          <g className="stroke-indigo-400/20 fill-none animated-walkway" strokeWidth={1}>
            {/* Horizontal corridors */}
            <line x1={20} y1={195} x2={840} y2={195} />
            <line x1={20} y1={420} x2={840} y2={420} />
            {/* Vertical corridors */}
            <line x1={215} y1={20} x2={215} y2={620} />
            <line x1={415} y1={20} x2={415} y2={620} />
            <line x1={615} y1={20} x2={615} y2={620} />
          </g>

          {/* ═══ ECO PLANTER DIVIDERS (Biophilic Indoor zones) ═══ */}
          <g>
            {/* Main corridor intersections */}
            {[
              {cx: 215, cy: 195, r: 8},
              {cx: 615, cy: 195, r: 8},
              {cx: 415, cy: 420, r: 8},
            ].map((p, idx) => (
              <g key={`pdiv-${idx}`} className="stroke-emerald-500/30 fill-none" strokeWidth={0.8}>
                <circle cx={p.cx} cy={p.cy} r={p.r} className="fill-emerald-500/[0.04]" />
                <circle cx={p.cx} cy={p.cy} r={p.r - 3.5} className="stroke-emerald-400/30" strokeDasharray="1.5 1" />
                <circle cx={p.cx} cy={p.cy} r={1.5} className="fill-emerald-400/70 stroke-none" />
                {/* Organic leaf stems */}
                <path d={`M ${p.cx} ${p.cy - p.r + 2.5} Q ${p.cx} ${p.cy} ${p.cx} ${p.cy + p.r - 2.5}`} className="stroke-emerald-400/30" />
                <path d={`M ${p.cx - p.r + 2.5} ${p.cy} Q ${p.cx} ${p.cy} ${p.cx + p.r - 2.5} ${p.cy}`} className="stroke-emerald-400/30" />
              </g>
            ))}
          </g>

          {/* ═══ RESTROOMS (Highly detailed stalls, toilets, division wall) ═══ */}
          <g className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={0.8}>
            {/* Perimeter */}
            <rect x="310" y="14" width="120" height="30" rx={4} className="fill-indigo-950/5" />
            <line x1="370" y1="14" x2="370" y2="44" className="stroke-indigo-500/30" strokeWidth={1} />
            
            {/* Men's Stalls (Left) */}
            <line x1="310" y1="26" x2="340" y2="26" className="stroke-indigo-500/15" strokeWidth={0.6} />
            <line x1="340" y1="14" x2="340" y2="26" className="stroke-indigo-500/15" strokeWidth={0.6} />
            {/* Toilet Bowl Vectors */}
            <circle cx="325" cy="20" r="2.5" className="stroke-indigo-500/20" />
            <rect x="323" y="15" width="4" height="2" rx={0.5} className="stroke-indigo-500/20 fill-none" />
            {/* Men's Sinks */}
            <circle cx="352" cy="38" r="2" className="stroke-indigo-500/20 fill-none" />
            <line x1="352" y1="41" x2="352" y2="43" className="stroke-indigo-500/30" />

            {/* Women's Stalls (Right) */}
            <line x1="400" y1="26" x2="430" y2="26" className="stroke-indigo-500/15" strokeWidth={0.6} />
            <line x1="400" y1="14" x2="400" y2="26" className="stroke-indigo-500/15" strokeWidth={0.6} />
            {/* Toilet Bowl Vectors */}
            <circle cx="415" cy="20" r="2.5" className="stroke-indigo-500/20" />
            <rect x="413" y="15" width="4" height="2" rx={0.5} className="stroke-indigo-500/20 fill-none" />
            {/* Women's Sinks */}
            <circle cx="388" cy="38" r="2" className="stroke-indigo-500/20 fill-none" />
            <line x1="388" y1="41" x2="388" y2="43" className="stroke-indigo-500/30" />

            <text x="370" y="36" textAnchor="middle" className="fill-indigo-400/80 text-[6.5px] font-black tracking-[0.15em] uppercase" stroke="none">RESTROOMS 🚻</text>
          </g>

          {/* ═══ STAIRWELL (Detailed central landing flight stairs) ═══ */}
          <g className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={0.9}>
            <rect x="30" y="14" width="100" height="30" rx={4} />
            {/* Central stair core wall */}
            <line x1="30" y1="29" x2="115" y2="29" className="stroke-indigo-500/30" strokeWidth={1} />
            {/* Steps - top flight */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`st-up-${i}`} x1={35 + (i * 10)} y1="14" x2={35 + (i * 10)} y2="29" className="stroke-indigo-500/20" strokeWidth={0.6} />
            ))}
            {/* Steps - bottom flight */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`st-down-${i}`} x1={35 + (i * 10)} y1="29" x2={35 + (i * 10)} y2="44" className="stroke-indigo-500/20" strokeWidth={0.6} />
            ))}
            {/* Stairwell climb arrows */}
            <path d="M 118 36 L 123 36 L 123 22 M 120 25 L 123 22 L 126 25" className="stroke-indigo-400/55 fill-none" strokeWidth={0.8} />
            <text x="75" y="32" textAnchor="middle" className="fill-indigo-400 text-[7px] font-black tracking-widest" stroke="none">STAIRS ↗</text>
          </g>

          {/* ═══ ELEVATOR BAY (Detailed lift compartments and arrows) ═══ */}
          <g className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={0.9}>
            <rect x="720" y="14" width="120" height="30" rx={4} />
            {/* Elevator shafts divisions */}
            <line x1="760" y1="14" x2="760" y2="44" className="stroke-indigo-500/20" strokeWidth={0.6} />
            <line x1="800" y1="14" x2="800" y2="44" className="stroke-indigo-500/20" strokeWidth={0.6} />
            
            {/* Elevator Door divisions */}
            {/* Shaft 1 */}
            <rect x="727" y="18" width="26" height="22" className="stroke-indigo-500/20 fill-indigo-950/20" />
            <line x1="740" y1="18" x2="740" y2="40" className="stroke-indigo-500/30" />
            {/* Shaft 2 (Active lift) */}
            <rect x="767" y="18" width="26" height="22" className="stroke-cyan-500/30 fill-indigo-950/20" />
            <line x1="780" y1="18" x2="780" y2="40" className="stroke-cyan-400/50" />
            <circle cx="780" cy="16" r="1.2" className="fill-cyan-400 stroke-none" />
            {/* Shaft 3 */}
            <rect x="807" y="18" width="26" height="22" className="stroke-indigo-500/20 fill-indigo-950/20" />
            <line x1="820" y1="18" x2="820" y2="40" className="stroke-indigo-500/30" />

            <text x="780" y="32" textAnchor="middle" className="fill-indigo-400 text-[7px] font-black tracking-widest" stroke="none">ELEVATORS 🛗</text>
          </g>

          {/* ═══ TECH HUB & PRINTER LAB (Workstations, Copiers, glowing server racks) ═══ */}
          <g className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={0.8}>
            <rect x="440" y="14" width="260" height="30" rx={4} className="fill-indigo-950/5" />
            
            {/* 1. Server Stack (Left edge of Tech Hub) */}
            <g>
              <rect x="445" y="18" width="18" height="22" rx={1} className="stroke-indigo-500/30 fill-indigo-950/30" />
              <line x1="445" y1="23" x2="463" y2="23" className="stroke-indigo-500/15" />
              <line x1="445" y1="28" x2="463" y2="28" className="stroke-indigo-500/15" />
              <line x1="445" y1="33" x2="463" y2="33" className="stroke-indigo-500/15" />
              {/* Flashing network ledger lights */}
              <circle cx="449" cy="20.5" r="0.75" className="fill-emerald-400 stroke-none" />
              <circle cx="449" cy="25.5" r="0.75" className="fill-emerald-400 stroke-none animate-pulse" />
              <circle cx="449" cy="30.5" r="0.75" className="fill-destructive stroke-none" />
              <circle cx="459" cy="20.5" r="0.75" className="fill-emerald-400 stroke-none" />
              <circle cx="459" cy="25.5" r="0.75" className="fill-cyan-400 stroke-none" />
              <circle cx="459" cy="30.5" r="0.75" className="fill-emerald-400 stroke-none" />
            </g>

            {/* 2. Photo Copiers / Laser Printers */}
            <g>
              <rect x="471" y="18" width="18" height="15" rx={1.5} className="stroke-indigo-500/30 fill-indigo-950/10" />
              <rect x="473" y="20" width="14" height="4" rx={0.3} />
              <line x1="472" y1="28" x2="488" y2="28" className="stroke-indigo-500/20" />
              <line x1="472" y1="31" x2="488" y2="31" className="stroke-indigo-500/20" />
              <circle cx="484" cy="22" r="0.8" className="fill-cyan-400 stroke-none animate-pulse" />
            </g>

            {/* 3. Cyber workstation terminals (6 inline stations) */}
            {Array.from({ length: 6 }).map((_, i) => {
              const wx = 498 + i * 32;
              const hasUser = (i % 2 === 0);
              return (
                <g key={`workstation-${i}`}>
                  {/* Desks */}
                  <rect x={wx} y={18} width={26} height={11} rx={1} className="stroke-indigo-500/25 fill-indigo-500/[0.02]" />
                  {/* Keyboard lines */}
                  <line x1={wx + 3} y1={25} x2={wx + 23} y2={25} className="stroke-indigo-500/10" strokeWidth={0.5} />
                  {/* Monitors */}
                  <line x1={wx + 7} y1={20} x2={wx + 19} y2={20} className={hasUser ? "stroke-cyan-500/35" : "stroke-indigo-500/20"} strokeWidth={0.8} />
                  <line x1={wx + 13} y1={20} x2={wx + 13} y2={22} className="stroke-indigo-500/15" />
                  
                  {/* Ergonomic chairs with status */}
                  {renderChair(wx + 13, 36, "up", hasUser, "available", `tech-chair-${i}`)}
                </g>
              );
            })}

            <text x="570" y="42" textAnchor="middle" className="fill-indigo-400/80 text-[6.5px] font-black tracking-[0.12em] uppercase" stroke="none">TECH HUB & PRINT STATION 🖥️</text>
          </g>

          {/* ═══ RECEPTION & INFORMATION LOUNGE (Bottom central curve) ═══ */}
          <g className="fill-indigo-500/5 stroke-indigo-500/25" strokeWidth={1}>
            <path d="M 320 625 Q 430 600 540 625" className="fill-none stroke-indigo-400" strokeWidth={2.5} />
            
            {/* Receptionists desk chairs */}
            {renderChair(380, 616, "up", true, "available", "rec-chair-1")}
            {renderChair(430, 611, "up", false, "available", "rec-chair-2")}
            {renderChair(480, 616, "up", true, "available", "rec-chair-3")}
            
            {/* Micro desktop panels on reception curve */}
            <path d="M 368 610 Q 380 608 392 610" className="stroke-cyan-400/40 fill-none" strokeWidth={0.7} />
            <path d="M 468 610 Q 480 608 492 610" className="stroke-cyan-400/40 fill-none" strokeWidth={0.7} />

            <text x="430" y="598" textAnchor="middle" className="fill-indigo-400 text-[8px] font-black tracking-[0.15em]" stroke="none">INFO & RECEPTION</text>
          </g>

          {/* ═══ VENDING FUEL ZONE (Vending machines & water refill station) ═══ */}
          <g className="stroke-indigo-500/20 fill-indigo-500/5" strokeWidth={0.8}>
            <rect x="30" y="592" width="130" height="34" rx={4} className="fill-indigo-950/5" />
            
            {/* Vending 1: Coffee Brewer */}
            <rect x="35" y="595" width="22" height="28" rx={1.5} className="stroke-indigo-500/30 fill-indigo-950/30" />
            <rect x="42" y="612" width="8" height="6" rx={0.5} className="stroke-indigo-500/20 fill-none" />
            <line x1="35" y1="608" x2="57" y2="608" className="stroke-indigo-500/15" />
            <circle cx="50" cy="600" r="1.5" className="fill-warning/60 stroke-none" />
            
            {/* Vending 2: Smart Snacks grid */}
            <rect x="62" y="595" width="22" height="28" rx={1.5} className="stroke-indigo-500/30 fill-indigo-950/30" />
            <line x1="62" y1="602" x2="84" y2="602" className="stroke-indigo-500/15" />
            <line x1="62" y1="609" x2="84" y2="609" className="stroke-indigo-500/15" />
            <line x1="62" y1="616" x2="84" y2="616" className="stroke-indigo-500/15" />
            <circle cx="67" cy="599" r="0.8" className="fill-cyan-400/60 stroke-none" />
            <circle cx="73" cy="606" r="0.8" className="fill-emerald-400/60 stroke-none" />
            <circle cx="79" cy="613" r="0.8" className="fill-warning/60 stroke-none" />

            {/* Vending 3: Drinks Cooler */}
            <rect x="89" y="595" width="22" height="28" rx={1.5} className="stroke-indigo-500/30 fill-indigo-950/30" />
            <line x1="89" y1="608" x2="111" y2="608" className="stroke-indigo-500/15" />
            <rect x="92" y="598" width="16" height="8" rx={0.5} className="stroke-cyan-500/20 fill-none" />
            <circle cx="94" cy="616" r="0.8" className="fill-cyan-400/60 stroke-none animate-pulse" />

            {/* Water Tower Dispenser */}
            <rect x="122" y="595" width="14" height="28" rx={1.5} className="stroke-indigo-500/30 fill-indigo-950/30" />
            <circle cx="129" cy="605" r="3.5" className="stroke-cyan-500/20 fill-none pulse-glow" />
            <path d="M 127 608 Q 129 603 131 608" className="stroke-cyan-400/60 fill-none" strokeWidth={0.6} />

            <text x="156" y="604" textAnchor="start" className="fill-indigo-400/70 text-[6.5px] font-black tracking-wider uppercase" stroke="none">VENDING</text>
            <text x="156" y="614" textAnchor="start" className="fill-indigo-400/70 text-[6px] font-bold tracking-widest" stroke="none">STATION 🥤</text>
          </g>

          {/* ═══ CYBER LOUNGE & CAFE (Coffee counters, stools, group dining tables) ═══ */}
          <g className="stroke-indigo-500/20 fill-indigo-500/5" strokeWidth={0.8}>
            <rect x="580" y="592" width="250" height="34" rx={4} className="fill-indigo-950/5" />
            
            {/* Long Bar Counter */}
            <line x1="586" y1="597" x2="686" y2="597" className="stroke-indigo-500/30" strokeWidth={1.5} />
            {/* Bar stools */}
            <circle cx="598" cy="604" r="2.5" className="stroke-indigo-500/20 fill-indigo-950/40" />
            <circle cx="618" cy="604" r="2.5" className="stroke-indigo-500/20 fill-indigo-950/40" />
            <circle cx="638" cy="604" r="2.5" className="stroke-indigo-500/20 fill-indigo-950/40" />
            <circle cx="658" cy="604" r="2.5" className="stroke-indigo-500/20 fill-indigo-950/40" />
            <circle cx="678" cy="604" r="2.5" className="stroke-indigo-500/20 fill-indigo-950/40" />

            {/* Coffee Tables */}
            {/* Table 1 */}
            <circle cx="718" cy="609" r="6.5" className="stroke-indigo-500/25 fill-indigo-500/5" />
            <circle cx="710" cy="603" r="2" className="stroke-indigo-500/15 fill-none" />
            <circle cx="726" cy="615" r="2" className="stroke-indigo-500/15 fill-none" />
            <circle cx="718" cy="609" r="1.5" className="stroke-none fill-warning/30" /> {/* cup */}

            {/* Table 2 */}
            <circle cx="748" cy="609" r="6.5" className="stroke-indigo-500/25 fill-indigo-500/5" />
            <circle cx="740" cy="615" r="2" className="stroke-indigo-500/15 fill-none" />
            <circle cx="756" cy="603" r="2" className="stroke-indigo-500/15 fill-none" />
            <circle cx="748" cy="609" r="1.5" className="stroke-none fill-warning/30" />

            {/* Table 3 */}
            <circle cx="778" cy="609" r="6.5" className="stroke-indigo-500/25 fill-indigo-500/5" />
            <circle cx="770" cy="603" r="2" className="stroke-indigo-500/15 fill-none" />
            <circle cx="786" cy="615" r="2" className="stroke-indigo-500/15 fill-none" />
            <circle cx="778" cy="609" r="1.5" className="stroke-none fill-warning/30" />

            <text x="800" y="605" textAnchor="start" className="fill-indigo-400/70 text-[6.5px] font-black tracking-wider uppercase" stroke="none">CYBER</text>
            <text x="800" y="615" textAnchor="start" className="fill-indigo-400/70 text-[6px] font-bold tracking-widest" stroke="none">CAFE 🥐</text>
          </g>

          {/* ═══ GEOMETRIC COMPASS ROSE / NORTH ARROW ═══ */}
          <g className="pointer-events-none">
            <circle cx="820" cy="115" r="14" className="stroke-indigo-500/15 fill-none" strokeWidth={0.8} />
            <circle cx="820" cy="115" r="11" className="stroke-indigo-500/10 fill-none" strokeDasharray="1.5 1.5" />
            
            {/* Coordinate cross lines */}
            <line x1="820" y1="96" x2="820" y2="134" className="stroke-indigo-500/10" strokeWidth={0.5} strokeDasharray="2 2" />
            <line x1="801" y1="115" x2="839" y2="115" className="stroke-indigo-500/10" strokeWidth={0.5} strokeDasharray="2 2" />
            
            {/* North Pointing Diamond */}
            <polygon points="820,102 823,115 820,118 817,115" fill="url(#grad-compass)" className="stroke-cyan-400/30" strokeWidth={0.4} />
            {/* South Pointing Diamond */}
            <polygon points="820,128 822.5,115 820,113 817.5,115" className="fill-indigo-950 stroke-indigo-500/25" strokeWidth={0.4} />
            
            <text x="820" y="99" textAnchor="middle" className="fill-cyan-400 font-mono text-[6px] font-bold" stroke="none">N</text>
            <text x="820" y="134" textAnchor="middle" className="fill-indigo-500/50 font-mono text-[5px]" stroke="none">S</text>
            <text x="837" y="117" textAnchor="middle" className="fill-indigo-500/50 font-mono text-[5px]" stroke="none">E</text>
            <text x="803" y="117" textAnchor="middle" className="fill-indigo-500/50 font-mono text-[5px]" stroke="none">W</text>
          </g>

          {/* ═══ TECHNICAL CAD SCALE BAR ═══ */}
          <g className="stroke-indigo-500/25 fill-none" strokeWidth={0.8}>
            <line x1={30} y1={608} x2={110} y2={608} />
            <line x1={30} y1={604} x2={30} y2={612} />
            <line x1={70} y1={606} x2={70} y2={610} />
            <line x1={110} y1={604} x2={110} y2={612} />
            <text x={70} y={602} textAnchor="middle" className="fill-indigo-400/60 text-[5px] font-mono tracking-widest font-black" stroke="none">SCALE 1:125 | 10m</text>
          </g>

          {/* ═══ WATER FOUNTAINS ═══ */}
          <g className="stroke-indigo-500/25 fill-indigo-500/5" strokeWidth={0.8}>
            <circle cx="218" cy="210" r="5" className="pulse-glow fill-indigo-500/5" />
            <circle cx="218" cy="210" r="1.5" className="fill-cyan-400 stroke-none" />
            <text x="228" y="212" textAnchor="start" className="fill-indigo-400/60 font-mono text-[5.5px] font-bold uppercase" stroke="none">H2O 💧</text>
          </g>
          <g className="stroke-indigo-500/25 fill-indigo-500/5" strokeWidth={0.8}>
            <circle cx="618" cy="434" r="5" className="pulse-glow fill-indigo-500/5" />
            <circle cx="618" cy="434" r="1.5" className="fill-cyan-400 stroke-none" />
            <text x="628" y="436" textAnchor="start" className="fill-indigo-400/60 font-mono text-[5.5px] font-bold uppercase" stroke="none">H2O 💧</text>
          </g>

          {/* ═══ FIRE EXITS ═══ */}
          <g>
            <rect x="13" y="280" width="8" height="30" rx={1.5} className="fill-emerald-500/[0.04] stroke-emerald-500/30" strokeWidth={0.9} />
            <text x="18" y="300" textAnchor="middle" className="fill-emerald-400/80 font-mono text-[5px] font-bold tracking-widest" transform="rotate(-90 18 300)" stroke="none">EXIT 🚪</text>
          </g>
          <g>
            <rect x="839" y="280" width="8" height="30" rx={1.5} className="fill-emerald-500/[0.04] stroke-emerald-500/30" strokeWidth={0.9} />
            <text x="844" y="300" textAnchor="middle" className="fill-emerald-400/80 font-mono text-[5px] font-bold tracking-widest" transform="rotate(90 844 300)" stroke="none">EXIT 🚪</text>
          </g>

          {/* ═══ CORRIDOR LIBRARY BOOKSHELVES ═══ */}
          {[90, 130].map((yy) => (
            <g key={`shelf-left-${yy}`} className="stroke-indigo-500/20 fill-indigo-950/15" strokeWidth={0.5}>
              <rect x="218" y={yy} width="3" height="25" rx={0.5} />
              <line x1="219.5" y1={yy} x2="219.5" y2={yy + 25} className="stroke-indigo-500/10" strokeDasharray="1.5 1.5" />
            </g>
          ))}
          {[300, 340, 380].map((yy) => (
            <g key={`shelf-right-${yy}`} className="stroke-indigo-500/20 fill-indigo-950/15" strokeWidth={0.5}>
              <rect x="618" y={yy} width="3" height="25" rx={0.5} />
              <line x1="619.5" y1={yy} x2="619.5" y2={yy + 25} className="stroke-indigo-500/10" strokeDasharray="1.5 1.5" />
            </g>
          ))}

          {/* ═══ DYNAMIC ROOMS ═══ */}
          {filteredRooms.map((room) => {
            const colors = statusColors[room.status];
            const isHovered = hoveredRoom === room.id;
            const roomGradient = `url(#grad-${room.status})`;
            const roomCode = getRoomCode(room.name);

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
                {/* Architectural Double Wall Outer Border */}
                <rect
                  x={room.x - 2.5}
                  y={room.y - 2.5}
                  width={room.w + 5}
                  height={room.h + 5}
                  rx={9}
                  className="fill-none stroke-indigo-500/10"
                  strokeWidth={0.75}
                />

                {/* Inner Room Grid Rectangle */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={7}
                  fill={roomGradient}
                  className={cn(colors.stroke, "transition-all duration-300")}
                  strokeWidth={isHovered ? 2.2 : 1.2}
                  style={{ filter: isHovered ? "drop-shadow(0 0 15px rgba(99,102,241,0.35))" : undefined }}
                />

                {/* Vector Room Furniture & Occupancy Spotlights */}
                {renderFurniture(room)}

                {/* Technical RM Identifier Plate */}
                <g className="opacity-75 select-none pointer-events-none">
                  {/* Badge plate boundary */}
                  <rect x={room.x + room.w - 38} y={room.y + 6} width={32} height={10} rx={1.5} className="fill-indigo-950/80 stroke-indigo-500/20" strokeWidth={0.5} />
                  <text
                    x={room.x + room.w - 22}
                    y={room.y + 13.5}
                    textAnchor="middle"
                    className="fill-indigo-300 font-mono text-[5.5px] font-bold tracking-wider"
                    stroke="none"
                  >
                    {roomCode}
                  </text>
                </g>

                {/* Room Utility Icon Badge */}
                <g className="opacity-75 select-none pointer-events-none">
                  <rect x={room.x + 6} y={room.y + 6} width={13} height={10} rx={1.5} className="fill-indigo-950/80 stroke-indigo-500/20" strokeWidth={0.5} />
                  {room.type === "quiet" ? (
                    /* Headphones path */
                    <path d={`M ${room.x + 10.5} ${room.y + 12.5} a 2 2 0 0 1 4 0 v 1 a 0.5 0.5 0 0 1 -0.5 0.5 h -0.5 v -1 h 1 m -4 0 v 1 a 0.5 0.5 0 0 0 0.5 0.5 h 0.5 v -1 h -1`} className="stroke-indigo-300 fill-none" strokeWidth={0.6} />
                  ) : (
                    /* Double Users path */
                    <path d={`M ${room.x + 10.5} ${room.y + 14} a 1.8 1.8 0 0 1 3.6 0 m -3.2 -2.5 a 1.2 1.2 0 1 1 2.4 0`} className="stroke-indigo-300 fill-none" strokeWidth={0.6} />
                  )}
                </g>

                {/* Architectural Door Swing */}
                <g className="transition-opacity duration-200 pointer-events-none">
                  <line 
                    x1={room.x} 
                    y1={room.y + room.h - 15} 
                    x2={room.x} 
                    y2={room.y + room.h} 
                    className="stroke-indigo-400/40" 
                    strokeWidth={1} 
                  />
                  <line 
                    x1={room.x} 
                    y1={room.y + room.h} 
                    x2={room.x + 12} 
                    y2={room.y + room.h - 9} 
                    className={colors.stroke} 
                    strokeWidth={0.8} 
                  />
                  <path 
                    d={`M ${room.x} ${room.y + room.h - 15} A 15 15 0 0 1 ${room.x + 15} ${room.y + room.h}`} 
                    className="stroke-indigo-400/20 fill-none" 
                    strokeDasharray="1.5 1.5" 
                    strokeWidth={0.6} 
                  />
                </g>

                {/* Room Name Label */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 - 8}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-black uppercase tracking-wider"
                  stroke="none"
                >
                  {room.name}
                </text>
                
                {/* Capacity & Live occupancy text */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 + 8}
                  textAnchor="middle"
                  className="fill-indigo-300/80 text-[7.5px] font-medium tracking-wide"
                  stroke="none"
                >
                  CAP: {room.capacity} · {colors.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip Card */}
        <AnimatePresence>
          {hoveredRoom && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl z-30"
            >
              {(() => {
                const room = liveRooms.find((r) => r.id === hoveredRoom)!;
                if (!room) return null;
                const colors = statusColors[room.status];
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                        {room.type === "quiet" ? <Volume2 className="h-5 w-5 animate-pulse" /> : <Users className="h-5 w-5" />}
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
              <button onClick={handleDeleteRoom} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors cursor-pointer" title="Delete Room">
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
              <button onClick={handleSaveEdit} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium flex-1 cursor-pointer">Save</button>
              <button onClick={() => setEditingRoom(null)} className="bg-muted text-muted-foreground px-3 py-1.5 rounded text-xs font-medium flex-1 cursor-pointer">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border bg-[#090915]/40 p-3 text-xs text-muted-foreground backdrop-blur-sm w-full">
        <span className="font-bold text-indigo-400 mr-1 uppercase tracking-wider text-[10px]">Room Status:</span>
        {Object.entries(statusColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 bg-background/50 border border-indigo-500/10 rounded-xl px-2.5 py-1 font-semibold">
            <span className={cn("h-2 w-2 rounded-full", val.dot, key === "available" || key === "almost-full" ? "animate-pulse" : "")} />
            <span className="text-foreground/80">{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
