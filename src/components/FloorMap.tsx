import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { API_URL } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Users, Volume2, ZoomIn, ZoomOut, 
  RefreshCw, Maximize2, Trash2, HelpCircle, Layers
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Room {
  id: string;
  name: string;
  type: "quiet" | "group";
  capacity: number;
  status: "available" | "almost-full" | "booked";
  floor: string;
  amenities?: string[];
  rating?: number;
  
  // 3D coordinates mapped precisely
  posX: number;
  posZ: number;
  width: number;
  depth: number;
  height: number;
}

const room3DLayouts: Record<string, { posX: number; posZ: number; width: number; depth: number; height: number }> = {
  // Study Pods (Left vertical column)
  "Quiet Zone A1": { posX: -5.5, posZ: -4, width: 2.2, depth: 1.6, height: 1.2 },
  "Quiet Zone A2": { posX: -5.5, posZ: -2, width: 2.2, depth: 1.6, height: 1.2 },
  "Quiet Zone A3": { posX: -5.5, posZ: 0, width: 2.2, depth: 1.6, height: 1.2 },
  
  // Center conference/group rooms
  "Group Room B1": { posX: -1.5, posZ: -2, width: 2.6, depth: 2.6, height: 1.5 },
  "Group Room B2": { posX: 1.5, posZ: -2, width: 2.6, depth: 2.6, height: 1.5 },
  "Group Room B3": { posX: -1.5, posZ: 2, width: 2.6, depth: 2.6, height: 1.5 },
  "Group Room C2": { posX: 1.5, posZ: 2, width: 2.6, depth: 2.6, height: 1.5 },
  
  // Bottom Lounge quiet zone
  "Quiet Zone C1": { posX: 0, posZ: 5.5, width: 5.0, depth: 1.8, height: 1.2 }
};

const statusColors3D = {
  available: { 
    color: 0x10b981, 
    glowColor: 0x34d399,
    opacity: 0.15,
    label: "Available"
  },
  "almost-full": { 
    color: 0xf59e0b, 
    glowColor: 0xfbbf24,
    opacity: 0.15,
    label: "Almost Full"
  },
  booked: { 
    color: 0xef4444, 
    glowColor: 0xf87171,
    opacity: 0.08,
    label: "Booked"
  },
};

export function FloorMap({ onRoomSelect, isAdmin = false }: { onRoomSelect?: (roomId: string, roomName: string) => void; isAdmin?: boolean }) {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for WebGL Canvas
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const requestRef = useRef<number | null>(null);
  const roomsMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());

  // Dragging / Orbit camera states (Zero-dependency Orbiting logic)
  const isDragging = useRef(false);
  const prevMousePosition = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: Math.PI / 4, phi: Math.PI / 3 }); // spherical coordinates
  const cameraRadius = useRef(14); // camera distance

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
          posX: room3DLayouts[r.name]?.posX || 0,
          posZ: room3DLayouts[r.name]?.posZ || 0,
          width: room3DLayouts[r.name]?.width || 2,
          depth: room3DLayouts[r.name]?.depth || 2,
          height: room3DLayouts[r.name]?.height || 1.2,
        }));
        setLiveRooms(mappedRooms);
      })
      .catch(console.error);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasContainerRef.current || liveRooms.length === 0) return;

    // 1. Create Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06060c);
    sceneRef.current = scene;

    // Soft fog for beautiful architectural depth
    scene.fog = new THREE.FogExp2(0x06060c, 0.025);

    const width = canvasContainerRef.current.clientWidth;
    const height = canvasContainerRef.current.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear out container first
    canvasContainerRef.current.innerHTML = "";
    canvasContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Add Ambient & Directional Lights (Shadows & Neon Highlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

    // Beautiful blue neon accent uplights to make the floor plan premium
    const pointLightLeft = new THREE.PointLight(0x6366f1, 3.5, 15);
    pointLightLeft.position.set(-6, 3, -2);
    scene.add(pointLightLeft);

    const pointLightRight = new THREE.PointLight(0x4f46e5, 3.5, 15);
    pointLightRight.position.set(6, 3, 2);
    scene.add(pointLightRight);

    // 3. Add Premium 3D Floor Base
    const floorGeo = new THREE.BoxGeometry(16, 0.15, 14);
    // Dark concrete texture wood composite look
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x11111e, 
      roughness: 0.45, 
      metalness: 0.1 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.075;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add a grid helper overlay to give a blueprint CAD look
    const gridHelper = new THREE.GridHelper(16, 22, 0x4f46e5, 0x1e1e38);
    gridHelper.position.y = 0.08;
    scene.add(gridHelper);

    // 4. Add Green Planters (Botanical detail)
    const potGeo = new THREE.BoxGeometry(0.8, 0.35, 0.8);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(-5, 0.25, 3.5);
    pot.castShadow = true;
    scene.add(pot);

    const plantGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.9 });
    const plant = new THREE.Mesh(plantGeo, plantMat);
    plant.position.set(-5, 0.6, 3.5);
    scene.add(plant);

    // Pot 2
    const pot2 = pot.clone();
    pot2.position.set(5, 0.25, -3.5);
    scene.add(pot2);
    const plant2 = plant.clone();
    plant2.position.set(5, 0.6, -3.5);
    scene.add(plant2);

    // 5. Add Core Lift Shaft
    const liftGeo = new THREE.BoxGeometry(1.6, 2.2, 1.8);
    const liftMat = new THREE.MeshStandardMaterial({ color: 0x181829, metalness: 0.7, roughness: 0.3 });
    const lift = new THREE.Mesh(liftGeo, liftMat);
    lift.position.set(6, 1.1, 0.5);
    lift.castShadow = true;
    scene.add(lift);

    // Elevator Doors
    const doorGeo = new THREE.PlaneGeometry(0.8, 1.6);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xa5b4fc, metalness: 0.9, roughness: 0.1 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(5.19, 0.8, 0.5);
    door.rotation.y = -Math.PI / 2;
    scene.add(door);

    // 6. Draw dynamic 3D Rooms
    roomsMeshMap.current.clear();
    
    liveRooms.forEach((room) => {
      // Floor filter check
      if (selectedFloor !== "all") {
        const floorLetter = selectedFloor[0].toLowerCase();
        if (!room.floor.toLowerCase().startsWith(floorLetter)) return;
      }

      const statusConfig = statusColors3D[room.status];

      // Room Container Mesh group
      const roomGroup = new THREE.Group();
      roomGroup.position.set(room.posX, room.height / 2, room.posZ);

      // Glass partition walls (translucent box)
      const boxGeo = new THREE.BoxGeometry(room.width, room.height, room.depth);
      const boxMat = new THREE.MeshStandardMaterial({
        color: statusConfig.color,
        transparent: true,
        opacity: statusConfig.opacity,
        roughness: 0.15,
        metalness: 0.1,
        depthWrite: false
      });
      const glassRoom = new THREE.Mesh(boxGeo, boxMat);
      glassRoom.userData = { roomId: room.id, roomName: room.name, status: room.status };
      glassRoom.receiveShadow = true;
      roomGroup.add(glassRoom);
      
      // Map it for Raycasting hover retrieval
      roomsMeshMap.current.set(room.id, glassRoom);

      // Glowing Neon outline frame to give premium glassmorphism
      const edges = new THREE.EdgesGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({ 
        color: statusConfig.glowColor, 
        linewidth: 2 
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      roomGroup.add(wireframe);

      // 3D Furniture inside the rooms!
      if (room.type === "quiet") {
        // Study desk
        const deskW = room.width * 0.7;
        const deskD = room.depth * 0.25;
        const deskGeo = new THREE.BoxGeometry(deskW, 0.08, deskD);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.8 });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, -room.height / 2 + 0.5, -room.depth * 0.2);
        desk.castShadow = true;
        roomGroup.add(desk);

        // Desk leg
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
        const leg1 = new THREE.Mesh(legGeo, legMat);
        leg1.position.set(-deskW / 2.2, -room.height / 2 + 0.25, -room.depth * 0.2);
        const leg2 = leg1.clone();
        leg2.position.set(deskW / 2.2, -room.height / 2 + 0.25, -room.depth * 0.2);
        roomGroup.add(leg1);
        roomGroup.add(leg2);

        // Tiny Laptop mesh
        const laptopGeo = new THREE.BoxGeometry(0.4, 0.02, 0.3);
        const laptopMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
        const laptop = new THREE.Mesh(laptopGeo, laptopMat);
        laptop.position.set(0, -room.height / 2 + 0.55, -room.depth * 0.2);
        roomGroup.add(laptop);

        // Tiny Swivel chair
        const chairGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.06);
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        const chairSeat = new THREE.Mesh(chairGeo, chairMat);
        chairSeat.position.set(0, -room.height / 2 + 0.35, 0.1);
        roomGroup.add(chairSeat);

        const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35);
        const stem = new THREE.Mesh(stemGeo, legMat);
        stem.position.set(0, -room.height / 2 + 0.175, 0.1);
        roomGroup.add(stem);
      } else {
        // Conference Room table
        const tblW = room.width * 0.45;
        const tblD = room.depth * 0.45;
        const tblGeo = new THREE.BoxGeometry(tblW, 0.08, tblD);
        const tblMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, roughness: 0.5 });
        const tbl = new THREE.Mesh(tblGeo, tblMat);
        tbl.position.set(0, -room.height / 2 + 0.55, 0);
        tbl.castShadow = true;
        roomGroup.add(tbl);

        const pedGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.55);
        const pedMat = new THREE.MeshStandardMaterial({ color: 0x312e81 });
        const pedestal = new THREE.Mesh(pedGeo, pedMat);
        pedestal.position.set(0, -room.height / 2 + 0.275, 0);
        roomGroup.add(pedestal);

        // Surrounding Chairs (4 chairs around the table)
        const chairGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06);
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.8 });
        
        const posOffsets = [
          { x: 0, z: -room.depth * 0.32 },
          { x: 0, z: room.depth * 0.32 },
          { x: -room.width * 0.32, z: 0 },
          { x: room.width * 0.32, z: 0 }
        ];

        posOffsets.forEach((off, idx) => {
          const seat = new THREE.Mesh(chairGeo, chairMat);
          seat.position.set(off.x, -room.height / 2 + 0.38, off.z);
          roomGroup.add(seat);

          const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.38);
          const stemMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
          const stem = new THREE.Mesh(stemGeo, stemMat);
          stem.position.set(off.x, -room.height / 2 + 0.19, off.z);
          roomGroup.add(stem);
        });
      }

      scene.add(roomGroup);
    });

    // 7. Animation tick loop
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      
      // Let the lights pulse softly for premium ambiance
      const time = Date.now() * 0.002;
      pointLightLeft.intensity = 3.5 + Math.sin(time * 1.5) * 0.5;
      pointLightRight.intensity = 3.5 + Math.cos(time * 1.5) * 0.5;

      renderer.render(scene, camera);
    };
    
    animate();

    // 8. Event listeners for window resizing
    const handleResize = () => {
      if (!canvasContainerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [liveRooms, selectedFloor]);

  // Spherical math for camera coordinate updates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const phi = cameraAngle.current.phi;
    const theta = cameraAngle.current.theta;
    const r = cameraRadius.current;

    // Convert spherical coordinates to Cartesian
    cameraRef.current.position.x = r * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = r * Math.cos(phi);
    cameraRef.current.position.z = r * Math.sin(phi) * Math.cos(theta);

    // Keep camera locked on the center core
    cameraRef.current.lookAt(0, 0.4, 0);
  };

  // Drag-to-Orbit events (liquid smooth 3D orbits)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    prevMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Raycasting hover query
    if (rendererRef.current && cameraRef.current && sceneRef.current) {
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      
      const meshes = Array.from(roomsMeshMap.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitRoom = intersects[0].object as THREE.Mesh;
        const roomId = hitRoom.userData.roomId;
        setHoveredRoomId(roomId);
        
        // Emissive light highlighting on hover!
        meshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mesh.userData.roomId === roomId) {
            mat.opacity = 0.55; // highlight glass opacity
            mat.emissive.setHex(0x6366f1);
            mat.emissiveIntensity = 0.35;
          } else {
            const statusConfig = statusColors3D[mesh.userData.status as "available" | "booked" | "almost-full"];
            mat.opacity = statusConfig.opacity;
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
          }
        });
      } else {
        setHoveredRoomId(null);
        meshes.forEach((mesh) => {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          const statusConfig = statusColors3D[mesh.userData.status as "available" | "booked" | "almost-full"];
          mat.opacity = statusConfig.opacity;
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        });
      }
    }

    // 2. Camera rotation panning
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevMousePosition.current.x;
    const deltaY = e.clientY - prevMousePosition.current.y;

    // Adjust spherical angles
    cameraAngle.current.theta -= deltaX * 0.0075;
    cameraAngle.current.phi = Math.max(
      0.1, 
      Math.min(Math.PI / 2 - 0.05, cameraAngle.current.phi - deltaY * 0.0075)
    ); // lock above ground

    prevMousePosition.current = { x: e.clientX, y: e.clientY };
    updateCameraPosition();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    isDragging.current = false;

    // Click raycasting (room select trigger)
    if (rendererRef.current && cameraRef.current) {
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const meshes = Array.from(roomsMeshMap.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitRoom = intersects[0].object as THREE.Mesh;
        const roomId = hitRoom.userData.roomId;
        const roomName = hitRoom.userData.roomName;
        const status = hitRoom.userData.status;

        if (status !== "booked") {
          onRoomSelect?.(roomId, roomName);
        } else {
          toast.error(`${roomName} is booked. Select an available room.`);
        }
      }
    }
  };

  // Zoom wheel integrations
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.15;
    if (e.deltaY < 0) {
      cameraRadius.current = Math.max(6, cameraRadius.current / zoomFactor);
    } else {
      cameraRadius.current = Math.min(26, cameraRadius.current * zoomFactor);
    }
    updateCameraPosition();
  };

  const resetView = () => {
    cameraRadius.current = 14;
    cameraAngle.current = { theta: Math.PI / 4, phi: Math.PI / 3 };
    updateCameraPosition();
    toast.success("Camera angles reset to blueprint standard");
  };

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
                cameraRadius.current = Math.max(6, cameraRadius.current / 1.25);
                updateCameraPosition();
              }}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                cameraRadius.current = Math.min(26, cameraRadius.current * 1.25);
                updateCameraPosition();
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

      {/* Interactive coded Three.js WebGL Canvas Viewport */}
      <div 
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-[#06060c] text-white shadow-2xl transition-all select-none w-full",
          isFullscreen ? "h-screen w-screen p-0 m-0 z-50 rounded-none" : "h-[450px] md:h-[580px] lg:h-[680px] w-full max-w-none"
        )}
      >
        {/* Three.js Canvas Container */}
        <div 
          ref={canvasContainerRef} 
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Hover details HUD Card overlay */}
        <AnimatePresence>
          {hoveredRoomId && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl z-30 pointer-events-none"
            >
              {(() => {
                const room = liveRooms.find((r) => r.id === hoveredRoomId)!;
                if (!room) return null;
                const colors = statusColors3D[room.status];
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
          🖱️ <span className="font-bold text-white">Left-click + Drag</span> to rotate · ⚙️ <span className="font-bold text-white">Scroll</span> to Zoom · 🎯 <span className="font-bold text-white">Click</span> to Book
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
        <span className="font-bold text-foreground mr-1 uppercase tracking-wider text-[10px]">3D View Legend:</span>
        {Object.entries(statusColors3D).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
            <span className={cn("h-2.5 w-2.5 rounded-full")} style={{ backgroundColor: `#${val.color.toString(16)}` }} />
            <span className="text-foreground/80">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
          <span className="h-2 w-2 bg-indigo-500 rounded-full" />
          <span className="text-foreground/80">3D Swivel Desks & Chairs</span>
        </div>
        <div className="flex items-center gap-2 bg-background/50 border rounded-xl px-2.5 py-1 font-semibold">
          <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />
          <span className="text-foreground/80">3D Planters 🪴</span>
        </div>
      </div>
    </div>
  );
}
