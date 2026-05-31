import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Users, Volume2, ZoomIn, ZoomOut, 
  RefreshCw, Maximize2, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Room {
  id: string;
  name: string;
  type: "quiet" | "group";
  capacity: number;
  status: "available" | "almost-full" | "booked";
  points: string;
  cx: number;
  cy: number;
  floor: string;
  amenities?: string[];
  rating?: number;
}

// Aligned precisely to the widescreen 3D isometric floor plan render (1000x573 scale)
const isometricLayouts: Record<string, { points: string; cx: number; cy: number }> = {
  // Study/Teaching Rooms on the left diagonal column
  "Quiet Zone A1": {
    points: "70,230 115,198 135,215 90,247",
    cx: 102,
    cy: 222
  },
  "Quiet Zone A2": {
    points: "90,247 135,215 155,232 110,264",
    cx: 122,
    cy: 239
  },
  "Quiet Zone A3": {
    points: "110,264 155,232 175,249 130,281",
    cx: 142,
    cy: 256
  },
  
  // Café Lounge area (Upper left, cozy group space)
  "Group Room B1": {
    points: "180,185 240,140 290,175 230,220",
    cx: 235,
    cy: 180
  },
  
  // Bookable Teaching Space (1) 0.25 (Bottom center)
  "Group Room B2": {
    points: "550,420 625,360 670,410 595,470",
    cx: 610,
    cy: 415
  },
  
  // Bookable Teaching Space (2) 0.26 (Bottom center, near stairs/lifts)
  "Group Room B3": {
    points: "480,360 550,305 590,350 520,405",
    cx: 535,
    cy: 355
  },
  
  // Large quiet stack partitioned desks (Bottom right stacks)
  "Quiet Zone C1": {
    points: "600,280 750,170 850,230 700,340",
    cx: 725,
    cy: 255
  },
  
  // Student IT Help Centre / core desk (Middle center)
  "Group Room C2": {
    points: "415,220 480,170 520,210 455,260",
    cx: 467,
    cy: 215
  }
};

const statusColors = {
  available: { 
    fill: "rgba(16, 185, 129, 0.04)", 
    stroke: "stroke-emerald-400 border-emerald-400", 
    dot: "bg-emerald-400", 
    label: "Available",
    glow: "rgba(16, 185, 129, 0.55)",
    gradient: "from-emerald-500/20 to-transparent"
  },
  "almost-full": { 
    fill: "rgba(245, 158, 11, 0.04)", 
    stroke: "stroke-amber-400 border-amber-400", 
    dot: "bg-amber-400", 
    label: "Almost Full",
    glow: "rgba(245, 158, 11, 0.55)",
    gradient: "from-amber-500/20 to-transparent"
  },
  booked: { 
    fill: "rgba(239, 68, 68, 0.02)", 
    stroke: "stroke-red-400 border-red-400", 
    dot: "bg-red-400", 
    label: "Booked",
    glow: "rgba(239, 68, 68, 0.3)",
    gradient: "from-red-500/10 to-transparent"
  },
};

export function FloorMap({ onRoomSelect, isAdmin = false }: { onRoomSelect?: (roomId: string, roomName: string) => void; isAdmin?: boolean }) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // High-Performance Zoom & Pan Refs (Direct DOM transform mutation, bypasses React render lags entirely!)
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mapGroupRef = useRef<SVGGElement>(null);

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
          points: isometricLayouts[r.name]?.points || "0,0 10,0 10,10 0,10",
          cx: isometricLayouts[r.name]?.cx || 50,
          cy: isometricLayouts[r.name]?.cy || 50,
          x: r.x || 0,
          y: r.y || 0,
          w: r.w || 100,
          h: r.h || 80,
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

  // Direct DOM mutation for GPU-accelerated 60fps pan/zoom transformations
  const updateMapTransform = () => {
    if (mapGroupRef.current) {
      mapGroupRef.current.setAttribute(
        "transform",
        `translate(${panRef.current.x}, ${panRef.current.y}) scale(${zoomRef.current})`
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAdmin && editingRoom) return;
    const target = e.target as SVGElement;
    if (target.closest(".interactive-room-group") || target.closest(".admin-edit-panel")) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    panRef.current = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    };
    updateMapTransform();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.15;
    let newZoom = zoomRef.current;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoomRef.current * zoomFactor, 4.0);
    } else {
      newZoom = Math.max(zoomRef.current / zoomFactor, 0.5);
    }
    zoomRef.current = newZoom;
    updateMapTransform();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAdmin && editingRoom) return;
    const target = e.target as SVGElement;
    if (target.closest(".interactive-room-group")) return;
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX - panRef.current.x, y: e.touches[0].clientY - panRef.current.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    panRef.current = {
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    };
    updateMapTransform();
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const resetView = () => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    updateMapTransform();
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

  const filteredRooms = selectedFloor === "all" ? liveRooms : liveRooms.filter((r) => r.floor.toLowerCase().startsWith(selectedFloor.toLowerCase()[0]));

  return (
    <div className="space-y-6 w-full">
      {/* Floor Filter & HUD controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
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
              onClick={() => {
                zoomRef.current = Math.min(zoomRef.current * 1.25, 4.0);
                updateMapTransform();
              }}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                zoomRef.current = Math.max(zoomRef.current / 1.25, 0.5);
                updateMapTransform();
              }}
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

      {/* Widescreen 3D Isometric Map Canvas Viewport */}
      <div 
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-[#06060c] text-white shadow-2xl transition-all select-none cursor-grab w-full",
          isDraggingRef.current && "cursor-grabbing",
          isFullscreen ? "h-screen w-screen p-0 m-0 z-50 rounded-none" : "h-[450px] md:h-[580px] lg:h-[680px] w-full max-w-none"
        )}
      >
        <svg
          viewBox="0 0 1000 573"
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
            .pulsing-beacon {
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            @keyframes ping {
              75%, 100% {
                transform: scale(2);
                opacity: 0;
              }
            }
          `}</style>

          {/* SVG Definitions (Neon Outer Room Glow Filters) */}
          <defs>
            <filter id="neon-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Group wrapping interactive Zoom & Pan matrix with ref hook */}
          <g ref={mapGroupRef} className="transition-transform duration-75">
            
            {/* Photorealistic 3D Isometric Library Workspace Image Background */}
            <image 
              href="/floor_map_isometric.png" 
              x="0" 
              y="0" 
              width="1000" 
              height="573" 
            />

            {/* Interactive Workspace Slanted Polygon Glassmorphic Hotspots */}
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
                  {/* Glass Slanted Acoustic Hotspot Overlay fill */}
                  <polygon
                    points={room.points}
                    fill={isHovered ? "rgba(99, 102, 241, 0.09)" : colors.fill}
                    className={cn(colors.stroke, "transition-all duration-200 fill-none stroke-none")}
                  />

                  {/* Slanted Glass Glowing Overlay borders */}
                  <polygon
                    points={room.points}
                    fill="rgba(255, 255, 255, 0.01)"
                    stroke={isHovered ? "#818cf8" : "rgba(255,255,255,0.25)"}
                    strokeWidth={isHovered ? 3.5 : 2}
                    className="transition-all duration-200"
                    filter={isHovered ? "url(#neon-glow)" : undefined}
                    style={{
                      backdropFilter: isHovered ? "blur(3px)" : "none"
                    }}
                  />

                  {/* High-Contrast Bold Room Name text (Centered at centroid) */}
                  <text
                    x={room.cx}
                    y={room.cy - 7}
                    textAnchor="middle"
                    className="fill-white text-[9.5px] font-black uppercase tracking-wider select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                  >
                    {room.name}
                  </text>

                  {/* Room Number text */}
                  <text
                    x={room.cx}
                    y={room.cy + 3}
                    textAnchor="middle"
                    className="fill-indigo-300 text-[8px] font-black tracking-widest uppercase select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                  >
                    {roomNumberText}
                  </text>

                  {/* Capacity text */}
                  <text
                    x={room.cx}
                    y={room.cy + 13}
                    textAnchor="middle"
                    className="fill-indigo-200/90 text-[7px] font-black tracking-wide select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                  >
                    CAP: {room.capacity}
                  </text>

                  {/* Pulsing Active Status Beacon indicators (Centered near centroids) */}
                  {room.status === "available" && (
                    <g transform={`translate(${room.cx + 28}, ${room.cy - 12})`}>
                      <circle cx={0} cy={0} r={5} className="fill-emerald-400/25 pulsing-beacon" style={{ transformOrigin: "0px 0px" }} />
                      <circle cx={0} cy={0} r={2.5} className="fill-emerald-400" />
                    </g>
                  )}
                  {room.status === "almost-full" && (
                    <g transform={`translate(${room.cx + 28}, ${room.cy - 12})`}>
                      <circle cx={0} cy={0} r={5} className="fill-amber-400/25 pulsing-beacon" style={{ transformOrigin: "0px 0px" }} />
                      <circle cx={0} cy={0} r={2.5} className="fill-amber-400" />
                    </g>
                  )}
                  {room.status === "booked" && (
                    <g transform={`translate(${room.cx + 28}, ${room.cy - 12})`}>
                      <circle cx={0} cy={0} r={2.5} className="fill-red-400" />
                    </g>
                  )}
                </g>
              );
            })}

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
                          <Badge variant={room.status === "available" ? "default" : "destructive"} className="text-[9px] px-1.5 py-0.25 border-none">
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

      {/* Modern Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border bg-card/40 p-3 text-xs text-muted-foreground backdrop-blur-sm shadow-sm w-full">
        <span className="font-bold text-foreground mr-1 uppercase tracking-wider text-[10px]">Legend:</span>
        {Object.entries(statusColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
            <span className={cn("h-2.5 w-2.5 rounded-full", val.dot, key !== "booked" && "pulsing-beacon")} />
            <span className="text-foreground/80">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
          <span className="text-emerald-500 font-bold">i</span>
          <span className="text-foreground/80">Information Point Kiosk</span>
        </div>
        <div className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
          <span className="text-primary font-bold">S</span>
          <span className="text-foreground/80">Meeting / Study Pod</span>
        </div>
      </div>
    </div>
  );
}
