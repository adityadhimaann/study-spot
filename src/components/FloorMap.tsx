import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Users, Volume2, Wifi, Trash2, ZoomIn, ZoomOut, 
  RefreshCw, Maximize2, HelpCircle, MapPin, Coffee, 
  Layers, ArrowUpRight, Compass, ShieldAlert
} from "lucide-react";
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

const defaultLayouts: Record<string, { x: number; y: number; w: number; h: number }> = {
  "Quiet Zone A1": { x: 20, y: 40, w: 120, h: 80 },
  "Quiet Zone A2": { x: 160, y: 40, w: 120, h: 80 },
  "Quiet Zone A3": { x: 300, y: 40, w: 120, h: 80 },
  "Group Room B1": { x: 20, y: 160, w: 180, h: 100 },
  "Group Room B2": { x: 220, y: 160, w: 200, h: 100 },
  "Group Room B3": { x: 440, y: 160, w: 140, h: 100 },
  "Quiet Zone C1": { x: 20, y: 300, w: 120, h: 80 },
  "Group Room C2": { x: 160, y: 300, w: 260, h: 80 },
};

const statusColors = {
  available: { 
    fill: "fill-success/15", 
    stroke: "stroke-success", 
    dot: "bg-success", 
    label: "Available",
    glow: "rgba(16, 185, 129, 0.4)",
    gradient: "url(#grad-available)"
  },
  "almost-full": { 
    fill: "fill-warning/15", 
    stroke: "stroke-warning", 
    dot: "bg-warning", 
    label: "Almost Full",
    glow: "rgba(245, 158, 11, 0.4)",
    gradient: "url(#grad-almost-full)"
  },
  booked: { 
    fill: "fill-destructive/10", 
    stroke: "stroke-destructive", 
    dot: "bg-destructive", 
    label: "Booked",
    glow: "rgba(239, 68, 68, 0.2)",
    gradient: "url(#grad-booked)"
  },
};

export function FloorMap({ onRoomSelect, isAdmin = false }: { onRoomSelect?: (roomId: string, roomName: string) => void; isAdmin?: boolean }) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          x: editingRoom.x,
          y: editingRoom.y,
          w: editingRoom.w,
          h: editingRoom.h,
        }),
      });
      if (res.ok) {
        setLiveRooms(liveRooms.map((r) => (r.id === editingRoom.id ? editingRoom : r)));
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setLiveRooms(liveRooms.filter((r) => r.id !== editingRoom.id));
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

  // Drag and zoom event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAdmin && editingRoom) return; // Disable panning when editing
    const target = e.target as SVGElement;
    if (target.closest(".interactive-room-group") || target.closest(".admin-edit-panel")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 3.5);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.7);
    }
    setZoom(newZoom);
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAdmin && editingRoom) return;
    const target = e.target as SVGElement;
    if (target.closest(".interactive-room-group")) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    toast.success("Map view reset successfully");
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Custom detailed room furniture renderer
  const renderFurniture = (room: Room) => {
    const furniture: JSX.Element[] = [];

    if (room.type === "quiet") {
      // Quiet zones feature structured study desks (carrels) with partition glass, chairs, laptops, and mugs
      const desksCount = room.w >= 140 ? 4 : 3;
      const spacing = (room.w - 30) / (desksCount - 1 || 1);

      for (let i = 0; i < desksCount; i++) {
        const deskX = room.x + 15 + i * spacing;
        const deskY = room.y + room.h / 2 - 10;
        const key = `desk-${room.id}-${i}`;

        furniture.push(
          <g key={key} className="furniture-group stroke-indigo-400/25 fill-none" strokeWidth={0.6}>
            {/* Table Top */}
            <rect x={deskX - 10} y={deskY} width={20} height={14} rx={1.5} className="fill-indigo-950/20" />
            {/* Swivel Chair */}
            <circle cx={deskX} cy={deskY + 22} r={3.5} className="fill-slate-900 stroke-indigo-400/35" />
            <path d={`M ${deskX - 4} ${deskY + 24} Q ${deskX} ${deskY + 26} ${deskX + 4} ${deskY + 24}`} className="stroke-indigo-400/30" />
            {/* Laptop shape */}
            <rect x={deskX - 5} y={deskY + 2} width={10} height={7} rx={0.5} className="fill-indigo-500/10 stroke-indigo-400/30" />
            <line x1={deskX - 5} y1={deskY + 9} x2={deskX + 5} y2={deskY + 9} className="stroke-indigo-400/50" strokeWidth={0.8} />
            {/* Small Coffee Cup */}
            <circle cx={deskX + 7} cy={deskY + 3} r={1} className="stroke-amber-400/40 fill-none" />
            {/* Privacy glass partition dividers */}
            {i < desksCount - 1 && (
              <line x1={deskX + spacing / 2 - 5} y1={deskY - 2} x2={deskX + spacing / 2 - 5} y2={deskY + 16} className="stroke-indigo-500/15" strokeDasharray="1 1" />
            )}
          </g>
        );
      }
    } else {
      // Group collaboration rooms feature oval conference table, laptops, notebooks, TV screens, and executive chairs
      const tblW = room.w * 0.5;
      const tblH = Math.min(room.h * 0.4, 25);
      const tblX = room.x + (room.w - tblW) / 2;
      const tblY = room.y + (room.h - tblH) / 2;

      // TV Display on Wall
      const tvX = room.x + room.w / 2 - 15;
      const tvY = room.y + 1;

      furniture.push(
        <g key={`group-furn-${room.id}`} className="stroke-indigo-400/30 fill-none" strokeWidth={0.7}>
          {/* Oval Conference Table */}
          <rect x={tblX} y={tblY} width={tblW} height={tblH} rx={tblH / 2} className="fill-indigo-950/20 stroke-indigo-400/40 shadow-inner" />
          
          {/* Wall TV / Presentation Screen */}
          <rect x={tvX} y={tvY} width={30} height={2} rx={0.5} className="fill-indigo-400/20 stroke-indigo-400/50" />
          <path d={`M ${tvX + 5} ${tvY + 2} L ${tvX + 10} ${tvY + 5} M ${tvX + 25} ${tvY + 2} L ${tvX + 20} ${tvY + 5}`} className="stroke-indigo-500/20" strokeWidth={0.5} />

          {/* Chairs all around */}
          {/* Top chairs */}
          <circle cx={tblX + tblW * 0.25} cy={tblY - 6} r={3.5} className="fill-slate-900 stroke-indigo-500/30" />
          <circle cx={tblX + tblW * 0.5} cy={tblY - 6} r={3.5} className="fill-slate-900 stroke-indigo-500/30" />
          <circle cx={tblX + tblW * 0.75} cy={tblY - 6} r={3.5} className="fill-slate-900 stroke-indigo-500/30" />
          
          {/* Bottom chairs */}
          <circle cx={tblX + tblW * 0.25} cy={tblY + tblH + 6} r={3.5} className="fill-slate-900 stroke-indigo-500/30" />
          <circle cx={tblX + tblW * 0.5} cy={tblY + tblH + 6} r={3.5} className="fill-slate-900 stroke-indigo-500/30" />
          <circle cx={tblX + tblW * 0.75} cy={tblY + tblH + 6} r={3.5} className="fill-slate-900 stroke-indigo-500/30" />

          {/* Left / Right End Chairs */}
          <circle cx={tblX - 6} cy={tblY + tblH / 2} r={3.5} className="fill-slate-900 stroke-indigo-500/30" />
          <circle cx={tblX + tblW + 6} cy={tblY + tblH / 2} r={3.5} className="fill-slate-900 stroke-indigo-500/30" />

          {/* Laptops on table */}
          <rect x={tblX + tblW * 0.3} y={tblY + tblH / 2 - 3} width={5} height={4} rx={0.5} className="stroke-indigo-400/20 fill-none" />
          <rect x={tblX + tblW * 0.65} y={tblY + tblH / 2 - 2} width={5} height={4} rx={0.5} className="stroke-indigo-400/20 fill-none" />
        </g>
      );
    }

    return furniture;
  };

  const filteredRooms = selectedFloor === "all" ? liveRooms : liveRooms.filter((r) => r.floor.toLowerCase().startsWith(selectedFloor.toLowerCase()[0]));

  return (
    <div className="space-y-6">
      {/* Floor Filter & HUD controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-2xl border w-fit backdrop-blur-sm shadow-sm">
          {["all", "1st", "2nd", "3rd"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setSelectedFloor(f);
                toast.success(`Showing ${f === "all" ? "All Floors" : `${f} Floor`}`);
              }}
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

        <div className="flex items-center gap-2">
          {/* Zoom and Navigation controls */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-2xl border w-fit backdrop-blur-sm">
            <button
              onClick={() => setZoom(Math.min(zoom * 1.25, 3.5))}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom / 1.25, 0.7))}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={resetView}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              title="Reset View"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Floor Map Canvas Viewport */}
      <div 
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-[#080815] text-white shadow-2xl transition-all select-none cursor-grab",
          isDragging && "cursor-grabbing",
          isFullscreen ? "h-screen w-screen p-0 m-0 z-50 rounded-none" : "h-[450px] md:h-[500px] w-full"
        )}
      >
        <svg
          viewBox="0 0 740 440"
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Custom SVG Animations & Styling */}
          <style>{`
            @keyframes walkwayFlow {
              to { stroke-dashoffset: -24; }
            }
            .animated-walkway {
              stroke-dasharray: 8 6;
              animation: walkwayFlow 2.5s linear infinite;
            }
            .pulsing-beacon {
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            .compass-needle {
              transform-origin: 690px 75px;
              transition: transform 0.5s ease-in-out;
            }
            .compass-needle:hover {
              transform: rotate(360deg);
            }
            .emergency-exit {
              stroke-dasharray: 4 4;
            }
          `}</style>

          {/* SVG Definitions (Patterns, Filters, Gradients) */}
          <defs>
            {/* Tile Floor Grid Pattern */}
            <pattern id="floor-tiles" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#060611" />
              <rect width="20" height="20" fill="none" stroke="rgba(99, 102, 241, 0.03)" strokeWidth="0.5" />
              <circle cx="20" cy="20" r="0.5" fill="rgba(99, 102, 241, 0.15)" />
            </pattern>

            {/* Hardwood Parquet Parallels Pattern for Lounges */}
            <pattern id="floor-parquet" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#08081a" />
              <line x1="0" y1="0" x2="40" y2="0" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.8" />
              <line x1="0" y1="13.3" x2="40" y2="13.3" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.8" />
              <line x1="0" y1="26.6" x2="40" y2="26.6" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.8" />
              <line x1="13.3" y1="0" x2="13.3" y2="13.3" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.8" />
              <line x1="26.6" y1="13.3" x2="26.6" y2="26.6" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.8" />
              <line x1="20" y1="26.6" x2="20" y2="40" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.8" />
            </pattern>

            {/* Concrete Core Column Hatch */}
            <pattern id="concrete-hatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="1" />
            </pattern>

            {/* Room Available Status Glowing Gradients */}
            <linearGradient id="grad-available" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>

            {/* Room Almost Full Status Gradients */}
            <linearGradient id="grad-almost-full" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>

            {/* Room Booked Status Gradients */}
            <linearGradient id="grad-booked" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
            </linearGradient>

            {/* Neon Outer Room Glow Filters */}
            <filter id="neon-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#6366f1" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Group wrapping interactive Zoom & Pan matrix */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="transition-transform duration-75">
            
            {/* Tile Floor Ground base */}
            <rect x={0} y={0} width={740} height={440} fill="url(#floor-tiles)" />

            {/* Blueprint Fine Grid Lines (CAD Engineering Grid) */}
            <g className="stroke-indigo-500/5" strokeWidth={0.4}>
              {Array.from({ length: 37 }).map((_, i) => (
                <line key={`vert-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={440} />
              ))}
              {Array.from({ length: 22 }).map((_, i) => (
                <line key={`horiz-${i}`} x1={0} y1={i * 20} x2={740} y2={i * 20} />
              ))}
            </g>

            {/* Blueprint Coordinate Axes Border Frame */}
            <rect x={10} y={30} width={720} height={380} rx={16} className="fill-none stroke-indigo-500/20" strokeWidth={2.5} />
            <rect x={8} y={28} width={724} height={384} rx={18} className="fill-none stroke-indigo-500/5" strokeWidth={0.8} />

            {/* Blueprint Coordinate Grid Labels (A-F / 1-5) */}
            <g className="fill-indigo-500/30 text-[7px] font-black tracking-widest text-center" pointerEvents="none">
              {["A", "B", "C", "D", "E", "F"].map((label, idx) => (
                <text key={`ax-${idx}`} x={35 + idx * 125} y={23} textAnchor="middle">{label}</text>
              ))}
              {[1, 2, 3, 4].map((label, idx) => (
                <text key={`ay-${idx}`} x={18} y={65 + idx * 100} textAnchor="middle">{label}</text>
              ))}
            </g>

            {/* Lounge Parquet wood flooring highlights */}
            <rect x={20} y={150} width={560} height={120} fill="url(#floor-parquet)" opacity={0.6} />

            {/* Hallway Walkway Laser Flow Guidelines (Emergency Routes) */}
            <g className="stroke-indigo-500/20 fill-none animated-walkway" strokeWidth={0.8}>
              <line x1={20} y1={130} x2={720} y2={130} />
              <line x1={20} y1={280} x2={720} y2={280} />
              <line x1={148} y1={30} x2={148} y2={410} />
              <line x1={420} y1={30} x2={420} y2={410} />
            </g>

            {/* Double Structural Wall Framing Hatch Core Columns */}
            <rect x={10} y={30} width={720} height={10} fill="url(#concrete-hatch)" className="stroke-indigo-500/30" strokeWidth={0.7} />
            <rect x={10} y={400} width={720} height={10} fill="url(#concrete-hatch)" className="stroke-indigo-500/30" strokeWidth={0.7} />
            <rect x={10} y={30} width={10} height={380} fill="url(#concrete-hatch)" className="stroke-indigo-500/30" strokeWidth={0.7} />
            <rect x={720} y={30} width={10} height={380} fill="url(#concrete-hatch)" className="stroke-indigo-500/30" strokeWidth={0.7} />

            {/* Restrooms Facility block at central back */}
            <g className="fill-indigo-950/20 stroke-indigo-500/25" strokeWidth={0.8}>
              <rect x={180} y={40} width={100} height={30} rx={4} />
              <line x1={230} y1={40} x2={230} y2={70} className="stroke-indigo-500/20" />
              {/* Sinks and Mirrors */}
              <circle cx={194} cy={48} r={2} className="stroke-indigo-400/25" />
              <circle cx={208} cy={48} r={2} className="stroke-indigo-400/25" />
              <circle cx={222} cy={48} r={2} className="stroke-indigo-400/25" />
              {/* Toilet partitions */}
              <rect x={240} y={44} width={10} height={12} rx={1} className="stroke-indigo-500/15" />
              <rect x={256} y={44} width={10} height={12} rx={1} className="stroke-indigo-500/15" />
              <rect x={272} y={44} width={10} height={12} rx={1} className="stroke-indigo-500/15" />
              <text x={230} y={64} textAnchor="middle" className="fill-indigo-400/80 text-[6px] font-black tracking-widest uppercase">RESTROOMS 🚻</text>
            </g>

            {/* Elevator core vertical shafts */}
            <g className="fill-slate-900 stroke-indigo-500/30" strokeWidth={0.8}>
              {/* Shaft Outline */}
              <rect x={600} y={180} width={80} height={60} rx={6} className="fill-indigo-950/30 stroke-indigo-500/40" />
              {/* Lift Box 1 */}
              <rect x={608} y={188} width={28} height={44} rx={3} className="fill-slate-950 stroke-indigo-500/30" />
              {/* Lift Box 2 */}
              <rect x={644} y={188} width={28} height={44} rx={3} className="fill-slate-950 stroke-indigo-500/30" />
              {/* Sliding Double-Doors lines */}
              <line x1={622} y1={232} x2={622} y2={188} strokeDasharray="1 1" />
              <line x1={658} y1={232} x2={658} y2={188} strokeDasharray="1 1" />
              <path d="M 608 210 H 636 M 644 210 H 672" className="stroke-indigo-400/15" />
              <text x={640} y={180} textAnchor="middle" className="fill-indigo-400/80 text-[6px] font-black tracking-widest uppercase">ELEVATORS 🛗</text>
            </g>

            {/* Stairs egress structural block */}
            <g className="fill-none stroke-indigo-500/30" strokeWidth={0.8}>
              {/* Outer boundary */}
              <rect x={600} y={300} width={80} height={80} rx={6} className="fill-indigo-950/20 stroke-indigo-500/40" />
              {/* Stairs tread parallel lines */}
              {Array.from({ length: 9 }).map((_, idx) => (
                <line key={`st-${idx}`} x1={608} y1={308 + idx * 8} x2={672} y2={308 + idx * 8} />
              ))}
              <line x1={640} y1={308} x2={640} y2={372} className="stroke-indigo-400/50" />
              {/* Direction Indicator */}
              <path d="M 640 365 L 640 315 L 637 322 M 640 315 L 643 322" className="stroke-primary fill-none" strokeWidth={1.2} />
              <text x={640} y={296} textAnchor="middle" className="fill-indigo-400/80 text-[6px] font-black tracking-widest uppercase">STAIRWELL 🪜</text>
            </g>

            {/* Lobby & Curved Reception Desk Area */}
            <g className="fill-indigo-950/20 stroke-indigo-500/30" strokeWidth={0.8}>
              {/* Circular desk layout */}
              <path d="M 300 370 A 30 30 0 0 1 360 370" fill="none" className="stroke-indigo-400/45" strokeWidth={3} />
              <circle cx={330} cy={375} r={3} className="fill-slate-900 stroke-indigo-500/30" />
              {/* Computer monitor layout */}
              <rect x={324} y={363} width={12} height={2} rx={0.5} className="fill-indigo-400/30 stroke-none" />
              <circle cx={345} cy={355} r={4.5} className="fill-emerald-500/10 stroke-emerald-500/35" />
              <text x={330} y={392} textAnchor="middle" className="fill-indigo-400/70 text-[6px] font-bold tracking-widest uppercase">RECEPTION 🛎️</text>
            </g>

            {/* Coffee Lounge, Kitchenette & Stools Cafe */}
            <g className="fill-none stroke-indigo-500/25" strokeWidth={0.8}>
              {/* Cafe Boundary area */}
              <rect x={440} y={40} width={240} height={80} rx={8} className="fill-indigo-950/10 stroke-indigo-500/35" />
              <text x={560} y={34} textAnchor="middle" className="fill-indigo-400/80 text-[6px] font-black tracking-widest uppercase">CAFÉ & LOUNGE ☕</text>
              
              {/* Coffee Counter and Sinks */}
              <rect x={448} y={48} width={120} height={14} rx={1} className="fill-indigo-950/30" />
              {/* Coffee Machine */}
              <rect x={456} y={50} width={16} height={10} rx={1} className="stroke-indigo-400/40 fill-none" />
              <circle cx={464} cy={55} r={2} className="stroke-amber-400/40 fill-none" />
              {/* Lounge Dining Tables */}
              <circle cx={600} cy={85} r={12} className="fill-indigo-950/20 stroke-indigo-400/40" />
              <circle cx={600} cy={85} r={3} className="stroke-indigo-500/30 fill-none" />
              
              {/* Cafe Stools */}
              <circle cx={585} cy={85} r={2.5} className="fill-slate-900 stroke-indigo-500/30" />
              <circle cx={615} cy={85} r={2.5} className="fill-slate-900 stroke-indigo-500/30" />
              <circle cx={600} cy={70} r={2.5} className="fill-slate-900 stroke-indigo-500/30" />
              <circle cx={600} cy={100} r={2.5} className="fill-slate-900 stroke-indigo-500/30" />

              <circle cx={645} cy={85} r={12} className="fill-indigo-950/20 stroke-indigo-400/40" />
              <circle cx={645} cy={85} r={2.5} className="fill-slate-900 stroke-indigo-500/30" />
              <circle cx={630} cy={85} r={2.5} className="fill-slate-900 stroke-indigo-500/30" />
              <circle cx={660} cy={85} r={2.5} className="fill-slate-900 stroke-indigo-500/30" />
            </g>

            {/* Planter Palms botanical greenery outlines */}
            <g className="fill-emerald-500/10 stroke-emerald-500/35" strokeWidth={0.8}>
              {/* Leafy plant pot 1 */}
              <circle cx={130} cy={200} r={4.5} className="fill-slate-900" />
              <path d="M 130 200 Q 120 190 114 195 Q 123 203 130 200 Z" />
              <path d="M 130 200 Q 140 190 146 195 Q 137 203 130 200 Z" />
              <path d="M 130 200 Q 130 185 133 182 Q 137 195 130 200 Z" />
              
              {/* Leafy plant pot 2 */}
              <circle cx={410} cy={200} r={4.5} className="fill-slate-900" />
              <path d="M 410 200 Q 400 190 394 195 Q 403 203 410 200 Z" />
              <path d="M 410 200 Q 420 190 426 195 Q 417 203 410 200 Z" />

              {/* Plant Pot 3 Near elevator */}
              <circle cx={585} cy={165} r={4} className="fill-slate-900" />
              <path d="M 585 165 C 580 155 572 158 576 150 C 585 160 585 165 585 165 Z" />
            </g>

            {/* Interactive Workspace Rooms */}
            {filteredRooms.map((room) => {
              const colors = statusColors[room.status];
              const isHovered = hoveredRoom === room.id;
              
              // Resolve active Floor code
              const nameParts = room.name.split(" ");
              const code = nameParts[nameParts.length - 1]; // e.g. "A1", "B2"
              const roomNumberText = `RM ${room.floor.startsWith("2") ? "2" : room.floor.startsWith("3") ? "3" : "1"}${code}`;

              return (
                <g
                  key={room.id}
                  className="interactive-room-group cursor-pointer transition-all duration-300"
                  onMouseEnter={() => !editingRoom && setHoveredRoom(room.id)}
                  onMouseLeave={() => !editingRoom && setHoveredRoom(null)}
                  onClick={() => {
                    if (isAdmin) {
                      setEditingRoom(room);
                    } else {
                      if (room.status !== "booked") onRoomSelect?.(room.id, room.name);
                    }
                  }}
                >
                  {/* Glass Acoustic Partition (Structural Wall Outline) */}
                  <rect
                    x={room.x - 2}
                    y={room.y - 2}
                    width={room.w + 4}
                    height={room.h + 4}
                    rx={10}
                    className={cn(
                      "fill-none stroke-indigo-500/10 transition-all duration-300",
                      isHovered && "stroke-primary/30"
                    )}
                    strokeWidth={isHovered ? 2.5 : 1}
                  />

                  {/* Room Inner Floor Area */}
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.w}
                    height={room.h}
                    rx={8}
                    fill={colors.gradient}
                    className={cn(colors.stroke, "transition-all duration-300")}
                    strokeWidth={isHovered ? 2.8 : 1.6}
                    filter={isHovered ? "url(#neon-glow)" : undefined}
                  />

                  {/* Render desks/swivel chairs/screens interior detail */}
                  {renderFurniture(room)}

                  {/* Realistic Swinging Architectural Doors with sweep lines */}
                  <g className="stroke-indigo-400/40 fill-none" strokeWidth={0.8}>
                    {/* Door Hinge Anchor */}
                    <line x1={room.x} y1={room.y + room.h - 10} x2={room.x} y2={room.y + room.h} />
                    {/* Swing arc representation */}
                    <path d={`M ${room.x} ${room.y + room.h - 10} A 10 10 0 0 1 ${room.x + 10} ${room.y + room.h}`} strokeDasharray="1.5 1.5" />
                    {/* Open Door frame panel */}
                    <line x1={room.x} y1={room.y + room.h} x2={room.x + 8} y2={room.y + room.h - 6} className={colors.stroke} strokeWidth={1} />
                  </g>

                  {/* Dimension Strings (Blueprint-style dimensions in small caps) */}
                  <g className="fill-indigo-400/40 text-[5px] font-mono tracking-tighter" pointerEvents="none">
                    <text x={room.x + room.w / 2} y={room.y + 10} textAnchor="middle">
                      {(room.w * 0.1).toFixed(1)}m × {(room.h * 0.1).toFixed(1)}m
                    </text>
                  </g>

                  {/* High-Contrast Bold Room Name text */}
                  <text
                    x={room.x + room.w / 2}
                    y={room.y + room.h / 2 - 12}
                    textAnchor="middle"
                    className="fill-white text-[9px] font-black uppercase tracking-wider select-none pointer-events-none"
                  >
                    {room.name}
                  </text>

                  {/* Subtitle Room Code RM 1A1 etc. */}
                  <text
                    x={room.x + room.w / 2}
                    y={room.y + room.h / 2 - 1}
                    textAnchor="middle"
                    className="fill-indigo-300/80 text-[7px] font-black tracking-widest uppercase select-none pointer-events-none"
                  >
                    {roomNumberText}
                  </text>

                  {/* Capacity & Live availability status line */}
                  <text
                    x={room.x + room.w / 2}
                    y={room.y + room.h / 2 + 10}
                    textAnchor="middle"
                    className="fill-indigo-200/60 text-[6.5px] font-semibold tracking-wide select-none pointer-events-none"
                  >
                    Cap: {room.capacity} · {colors.label}
                  </text>

                  {/* Pulsing Active Status Beacon indicators */}
                  {room.status === "available" && (
                    <g>
                      <circle cx={room.x + room.w - 10} cy={room.y + 10} r={5} className="fill-emerald-400/20 pulsing-beacon" />
                      <circle cx={room.x + room.w - 10} cy={room.y + 10} r={2.5} className="fill-emerald-400" />
                    </g>
                  )}
                  {room.status === "almost-full" && (
                    <g>
                      <circle cx={room.x + room.w - 10} cy={room.y + 10} r={5} className="fill-amber-400/20 pulsing-beacon" />
                      <circle cx={room.x + room.w - 10} cy={room.y + 10} r={2.5} className="fill-amber-400" />
                    </g>
                  )}
                  {room.status === "booked" && (
                    <g>
                      <circle cx={room.x + room.w - 10} cy={room.y + 10} r={2.5} className="fill-red-400" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Glowing Blueprint Compass Rose (North Arrow) */}
            <g className="stroke-indigo-500/40 fill-none compass-needle cursor-pointer" strokeWidth={0.8}>
              <circle cx={690} cy={75} r={14} className="fill-indigo-950/20 stroke-indigo-500/20" />
              <line x1={690} y1={55} x2={690} y2={95} strokeDasharray="1 1" />
              <line x1={670} y1={75} x2={710} y2={75} strokeDasharray="1 1" />
              {/* Compass Pointer */}
              <polygon points="690,57 686,75 694,75" className="fill-indigo-400 stroke-none" />
              <polygon points="690,93 687,75 693,75" className="fill-indigo-950 stroke-indigo-500/40" />
              <text x={690} y={50} textAnchor="middle" className="fill-indigo-400 text-[8px] font-black">N</text>
            </g>

            {/* Metric Scale Ruler bar */}
            <g className="stroke-indigo-500/40 fill-none" strokeWidth={0.8}>
              <line x1={20} y1={392} x2={100} y2={392} />
              <line x1={20} y1={389} x2={20} y2={395} />
              <line x1={60} y1={389} x2={60} y2={395} />
              <line x1={100} y1={389} x2={100} y2={395} />
              <text x={20} y={383} className="fill-indigo-400/80 text-[5px] font-black" textAnchor="middle">0m</text>
              <text x={60} y={383} className="fill-indigo-400/80 text-[5px] font-black" textAnchor="middle">5m</text>
              <text x={100} y={383} className="fill-indigo-400/80 text-[5px] font-black" textAnchor="middle">10m</text>
            </g>

            {/* Glowing Safety Indicators (WiFi routers, Exits) */}
            <g className="fill-none stroke-indigo-500/20" strokeWidth={0.6}>
              {/* WiFi beacon 1 */}
              <circle cx={250} cy={140} r={8} strokeDasharray="2 2" className="stroke-primary/20 animate-pulse" />
              <circle cx={250} cy={140} r={1.5} className="fill-primary stroke-none" />
              {/* WiFi beacon 2 */}
              <circle cx={500} cy={270} r={8} strokeDasharray="2 2" className="stroke-primary/20 animate-pulse" />
              <circle cx={500} cy={270} r={1.5} className="fill-primary stroke-none" />
              
              {/* Fire Extinguisher positions */}
              <g transform="translate(136, 134)" className="stroke-none fill-destructive">
                <rect x={0} y={-3} width={3} height={6} rx={0.5} />
                <rect x={-0.5} y={-4.5} width={4} height={1.5} />
                <circle cx={0.5} cy={-2} r={3} className="fill-none stroke-destructive" strokeWidth={0.5} />
              </g>
              <text x={143} y={136} className="fill-destructive text-[5px] font-bold uppercase tracking-wider select-none pointer-events-none">🧯 FE</text>
            </g>

          </g>
        </svg>

        {/* Hover details HUD Card overlay */}
        <AnimatePresence>
          {hoveredRoom && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl z-30 pointer-events-none"
            >
              {(() => {
                const room = liveRooms.find((r) => r.id === hoveredRoom)!;
                if (!room) return null;
                const colors = statusColors[room.status];
                const nameParts = room.name.split(" ");
                const code = nameParts[nameParts.length - 1];
                const roomNumberText = `RM ${room.floor.startsWith("2") ? "2" : room.floor.startsWith("3") ? "3" : "1"}${code}`;

                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                        {room.type === "quiet" ? <Volume2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white uppercase tracking-wider">{room.name}</p>
                          <Badge variant="outline" className="text-[8px] tracking-wider uppercase font-black bg-indigo-500/10 text-indigo-300 border-indigo-500/25 px-1.5 py-0.25">
                            {roomNumberText}
                          </Badge>
                          <Badge variant={room.status === "available" ? "default" : "destructive"} className="text-[9px] px-1.5 py-0.25">
                            {colors.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{room.floor} Floor · Capacity: {room.capacity} people</p>
                      </div>
                    </div>

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

        {/* Floating Instruction Guide Banner */}
        <div className="absolute top-4 left-4 rounded-xl border border-white/5 bg-slate-950/70 px-3 py-1.5 text-[9px] text-slate-400 backdrop-blur-md pointer-events-none hidden sm:block">
          🖱️ <span className="font-bold text-white">Left-click + Drag</span> to pan · ⚙️ <span className="font-bold text-white">Scroll</span> to Zoom
        </div>

        {/* Admin Coordinates Editor HUD */}
        {isAdmin && editingRoom && (
          <div className="admin-edit-panel absolute top-4 right-4 rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur-md w-64 space-y-3 z-50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm truncate pr-2 text-foreground">Edit Coordinates</h3>
              <button
                onClick={handleDeleteRoom}
                className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                title="Delete Room"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{editingRoom.name}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-muted-foreground">X Pos</label>
                <input
                  type="number"
                  value={editingRoom.x}
                  onChange={(e) => setEditingRoom({ ...editingRoom, x: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border rounded px-2 py-1 mt-1"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Y Pos</label>
                <input
                  type="number"
                  value={editingRoom.y}
                  onChange={(e) => setEditingRoom({ ...editingRoom, y: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border rounded px-2 py-1 mt-1"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Width</label>
                <input
                  type="number"
                  value={editingRoom.w}
                  onChange={(e) => setEditingRoom({ ...editingRoom, w: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border rounded px-2 py-1 mt-1"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Height</label>
                <input
                  type="number"
                  value={editingRoom.h}
                  onChange={(e) => setEditingRoom({ ...editingRoom, h: parseInt(e.target.value) || 0 })}
                  className="w-full bg-background border rounded px-2 py-1 mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveEdit}
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex-1 shadow-md hover:bg-primary/95 transition-all"
              >
                Save Room
              </button>
              <button
                onClick={() => setEditingRoom(null)}
                className="bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 hover:bg-muted/80 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Blueprint Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border bg-card/40 p-3 text-xs text-muted-foreground backdrop-blur-sm shadow-sm">
        <span className="font-bold text-foreground mr-1 uppercase tracking-wider text-[10px]">Legend:</span>
        {Object.entries(statusColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
            <span className={cn("h-2.5 w-2.5 rounded-full", val.dot, key !== "booked" && "animate-pulse")} />
            <span className="text-foreground/80">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
          <span className="h-2 w-2 bg-indigo-500/40 rounded-full" />
          <span className="text-foreground/80">Swivel Chairs</span>
        </div>
        <div className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
          <span className="text-emerald-500 text-[10px]">🪴</span>
          <span className="text-foreground/80">Planters</span>
        </div>
      </div>
    </div>
  );
}
