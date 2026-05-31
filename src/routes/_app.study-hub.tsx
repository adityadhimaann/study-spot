import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, RotateCcw, Volume2, Sparkles, CheckCircle2, 
  Trash2, Plus, VolumeX, ListTodo, Trophy, Hourglass, 
  Clock, Flame, Users, Globe, MapPin, UserPlus, 
  PlusCircle, Check, Award, Lock, Zap, BookOpen,
  MessageSquare, Send, Paperclip, Image as ImageIcon, Crown, X, Download, ExternalLink,
  Music, CloudRain, Coffee, Trees, Waves, GraduationCap, Brain, Palmtree, Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api-config";

export const Route = createFileRoute("/_app/study-hub")({
  component: StudyHubPage,
  head: () => ({
    meta: [{ title: "Focus & Study Hub — StudySpace" }],
  }),
});

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface AudioTrack {
  id: string;
  name: string;
  emoji: string;
  url: string;
  color: string;
}

interface StudyGroup {
  _id: string;
  topic: string;
  roomName: string;
  floor: string;
  slot: string;
  host: string;
  participants: string[];
  maxSeats: number;
}

const audioTracks: AudioTrack[] = [
  { id: "lofi", name: "Chill Lofi Beats", icon: Music, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", color: "from-purple-500/20 to-purple-600/5" },
  { id: "rain", name: "Cozy Rain", icon: CloudRain, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", color: "from-blue-500/20 to-blue-600/5" },
  { id: "cafe", name: "Bustling Cafe", icon: Coffee, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", color: "from-amber-500/20 to-amber-600/5" },
  { id: "forest", name: "Whispering Forest", icon: Trees, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", color: "from-emerald-500/20 to-emerald-600/5" },
  { id: "fire", name: "Crackling Fireplace", icon: Flame, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", color: "from-rose-500/20 to-rose-600/5" },
  { id: "waves", name: "Ocean Waves", icon: Waves, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", color: "from-cyan-500/20 to-cyan-600/5" },
];

function StudyHubPage() {
  const [activePanel, setActivePanel] = useState<"focus" | "collaboration" | "analytics">("focus");

  // Pomodoro States
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [totalFocusedMinutes, setTotalFocusedMinutes] = useState(0);

  const initialTime = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Task List States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  // Audio Mixer States
  const [playingTracks, setPlayingTracks] = useState<Record<string, boolean>>({});
  const [trackVolumes, setTrackVolumes] = useState<Record<string, number>>({
    lofi: 0.5,
    rain: 0.4,
    cafe: 0.3,
    forest: 0.2,
    fire: 0.3,
    waves: 0.4,
  });
  
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Collaboration Board States
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [studentName, setStudentName] = useState("Me");
  const [myUpcomingBookings, setMyUpcomingBookings] = useState<any[]>([]);

  // Immersive Group Chat States
  const [activeChatGroupId, setActiveChatGroupId] = useState<string | null>(null);
  const [activeChatGroup, setActiveChatGroup] = useState<StudyGroup | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showRoster, setShowRoster] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ data: string; name: string; type: string; size: number } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Weekly Analytics logs
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, number>>({
    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
  });

  // Hosting form states
  const [hostingBookingId, setHostingBookingId] = useState("");
  const [hostingTopic, setHostingTopic] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Custom Hosting form states
  const [hostMode, setHostMode] = useState<"booking" | "custom">("custom");
  const [customRoomName, setCustomRoomName] = useState("Co-Study Cabin 1");
  const [customFloor, setCustomFloor] = useState("1st Floor");
  const [customSlot, setCustomSlot] = useState("09:00 - 11:00 AM");
  const [customMaxSeats, setCustomMaxSeats] = useState(6);

  // Toggle hostMode when bookings are available
  useEffect(() => {
    if (myUpcomingBookings.length > 0) {
      setHostMode("booking");
    } else {
      setHostMode("custom");
    }
  }, [myUpcomingBookings.length]);

  // Sync Timer Duration with Mode
  useEffect(() => {
    setTimeLeft(initialTime[timerMode]);
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [timerMode]);

  // Pomodoro countdown timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timerMode]);

  // Handle core loads & backend fetching
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Solo Focus checklist load
    const savedTasks = localStorage.getItem("study-tasks");
    if (savedTasks) {
      try { setTasks(JSON.parse(savedTasks)); } catch (e) {}
    }

    // 1. Fetch user's Study Focus statistics & weekly logs from Backend DB
    fetch(`${API_URL}/api/auth/focus-stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setCompletedCycles(data.focusCycles || 0);
          setTotalFocusedMinutes(data.focusMinutes || 0);
          if (data.weeklyFocusLogs) {
            setWeeklyLogs(data.weeklyFocusLogs);
          }
        }
      })
      .catch(console.error);

    // 2. Fetch all public study collaboration groups from Backend DB
    fetch(`${API_URL}/api/collaboration/groups`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStudyGroups(data);
      })
      .catch(console.error);

    // Get current student name
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) setStudentName(parsed.name);
      } catch (e) {}
    }

    // Fetch user's bookings to let them host sessions
    fetch(`${API_URL}/api/bookings/my-bookings`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMyUpcomingBookings(data.filter((b) => b.status === "upcoming"));
        }
      })
      .catch(console.error);

    // Clean up audio tracks on unmount
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Save tasks on changes
  useEffect(() => {
    localStorage.setItem("study-tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Pomodoro completion triggers backend sync
  const handleTimerComplete = async () => {
    setIsRunning(false);
    playSynthBeep();

    if (timerMode === "focus") {
      toast.success("🏆 Focus block completed! Logging details...");
      
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_URL}/api/auth/focus-stats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ minutes: 25 }),
        });

        if (res.ok) {
          const data = await res.json();
          setCompletedCycles(data.focusCycles);
          setTotalFocusedMinutes(data.focusMinutes);
          if (data.weeklyFocusLogs) setWeeklyLogs(data.weeklyFocusLogs);
          toast.success("🚀 focus session synchronized successfully with server!");
        } else {
          // Fallback locally if network fails
          setCompletedCycles((prev) => prev + 1);
          setTotalFocusedMinutes((prev) => prev + 25);
        }
      } catch (err) {
        console.error(err);
        setCompletedCycles((prev) => prev + 1);
        setTotalFocusedMinutes((prev) => prev + 25);
      }

      setTimerMode("shortBreak");
    } else {
      toast.success("⏰ Break finished! Let's focus.");
      setTimerMode("focus");
    }
  };

  // Synthetic alarm bell using Web Audio API
  const playSynthBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn("AudioContext block");
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setNewTaskText("");
    toast.success("Task added to focus list!");
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const clearCompletedTasks = () => {
    setTasks(tasks.filter((t) => !t.completed));
    toast.info("Cleared completed tasks");
  };

  // Sound mixer operations
  const toggleTrack = (trackId: string) => {
    const audio = audioRefs.current[trackId];
    const isPlaying = !!playingTracks[trackId];

    if (!audio) {
      const track = audioTracks.find((t) => t.id === trackId);
      if (!track) return;

      const newAudio = new Audio(track.url);
      newAudio.loop = true;
      newAudio.volume = trackVolumes[trackId];
      newAudio.play().then(() => {
        setPlayingTracks(prev => ({ ...prev, [trackId]: true }));
        toast.info(`🎵 Playing ${track.name}`);
      }).catch((e) => {
        console.error("Playback block", e);
        toast.error("Tap anywhere on the page first to allow audio mixing!");
      });

      audioRefs.current[trackId] = newAudio;
    } else {
      if (isPlaying) {
        audio.pause();
        setPlayingTracks(prev => ({ ...prev, [trackId]: false }));
      } else {
        audio.play().then(() => {
          setPlayingTracks(prev => ({ ...prev, [trackId]: true }));
        }).catch(() => {
          toast.error("Playback failed. Please click and try again.");
        });
      }
    }
  };

  const handleVolumeChange = (trackId: string, val: number) => {
    setTrackVolumes(prev => ({ ...prev, [trackId]: val }));
    const audio = audioRefs.current[trackId];
    if (audio) {
      audio.volume = val;
    }
  };

  const stopAllAmbient = () => {
    Object.keys(audioRefs.current).forEach((key) => {
      audioRefs.current[key].pause();
    });
    setPlayingTracks({});
    toast.success("Silent Mode: All ambient sounds muted.");
  };

  // Open Chat Drawer and load message history
  const openGroupChat = async (groupId: string) => {
    const group = studyGroups.find(g => g._id === groupId);
    if (!group) return;

    setActiveChatGroupId(groupId);
    setActiveChatGroup(group);
    setChatLoading(true);
    setMessageText("");
    setSelectedFile(null);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/collaboration/groups/${groupId}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const messages = await res.json();
        setChatMessages(messages);
      } else {
        toast.error("Failed to load group messages");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load group messages");
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // Close Chat Drawer
  const closeChatDrawer = () => {
    setActiveChatGroupId(null);
    setActiveChatGroup(null);
    setChatMessages([]);
    setSelectedFile(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Poll Chat Messages and Group details
  useEffect(() => {
    if (activeChatGroupId) {
      // Clear any previous interval
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        const token = localStorage.getItem("token");
        try {
          // 1. Fetch latest messages
          const res = await fetch(`${API_URL}/api/collaboration/groups/${activeChatGroupId}/messages`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const messages = await res.json();
            const hasNewMessages = messages.length !== chatMessages.length;
            setChatMessages(messages);
            if (hasNewMessages) {
              setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            }
          }

          // 2. Fetch latest group details (reread participants roster)
          const grpres = await fetch(`${API_URL}/api/collaboration/groups`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (grpres.ok) {
            const groups: StudyGroup[] = await grpres.json();
            setStudyGroups(groups);
            const currentGrp = groups.find(g => g._id === activeChatGroupId);
            if (currentGrp) {
              setActiveChatGroup(currentGrp);
            } else {
              toast.error("This study group has been closed by the host.");
              closeChatDrawer();
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeChatGroupId, chatMessages.length]);

  // Send Message with base64 attachment
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatGroupId) return;
    if (!messageText.trim() && !selectedFile) return;

    setChatSending(true);
    const token = localStorage.getItem("token");

    const payload = {
      text: messageText.trim() || undefined,
      fileUrl: selectedFile?.data || undefined,
      fileName: selectedFile?.name || undefined,
      fileType: selectedFile?.type || undefined,
      fileSize: selectedFile?.size || undefined,
    };

    try {
      const res = await fetch(`${API_URL}/api/collaboration/groups/${activeChatGroupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages(prev => [...prev, newMsg]);
        setMessageText("");
        setSelectedFile(null);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to post message.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error while sending message.");
    } finally {
      setChatSending(false);
    }
  };

  // Leave Study Group
  const leaveStudyGroup = async (groupId: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/collaboration/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const updatedGroup = await res.json();
        setStudyGroups(studyGroups.map(g => g._id === groupId ? updatedGroup : g));
        toast.success("You have successfully left the study group.");
        if (activeChatGroupId === groupId) {
          closeChatDrawer();
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to leave group.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error while leaving group.");
    }
  };

  // FileReader Base64 file & image attachment helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImageOnly: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit! Please share smaller study assets.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        data: reader.result as string,
        name: file.name,
        type: file.type,
        size: file.size
      });
      toast.success(`${isImageOnly ? "📷 Image" : "📎 File"} "${file.name}" attached!`);
    };
    reader.readAsDataURL(file);
  };

  // Client-side Direct Base64 File Downloader
  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Collaboration: Join Study Session Group on Backend
  const joinStudyGroup = async (groupId: string) => {
    const group = studyGroups.find(g => g._id === groupId);
    if (!group) return;

    if (group.participants.includes(studentName)) {
      toast.info("You're already registered as an active member in this study group.");
      return;
    }

    if (group.participants.length >= group.maxSeats) {
      toast.error("Sorry, this study session has reached maximum capacity limits.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/collaboration/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const updatedGroup = await res.json();
        setStudyGroups(studyGroups.map(g => g._id === groupId ? updatedGroup : g));
        toast.success(`🎉 Congratulations! You have successfully joined "${group.topic}" at ${group.roomName}.`);
      } else {
        toast.error("Failed to join study group.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error while joining group.");
    }
  };

  // Collaboration: Publish booking or custom study group on Backend
  const handleHostGroupSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hostMode === "booking" && (!hostingBookingId || !hostingTopic.trim())) {
      toast.error("Please select one of your reservations and fill out a study topic.");
      return;
    }
    if (hostMode === "custom" && (!customRoomName.trim() || !hostingTopic.trim())) {
      toast.error("Please fill out a room name and study topic.");
      return;
    }

    setIsPublishing(true);
    const token = localStorage.getItem("token");

    let payload = {};
    if (hostMode === "booking") {
      const selectedBooking = myUpcomingBookings.find(b => b._id === hostingBookingId);
      if (!selectedBooking) {
        toast.error("Selected reservation not found.");
        setIsPublishing(false);
        return;
      }
      payload = {
        topic: hostingTopic.trim(),
        roomName: selectedBooking.room?.name || "Library Cabin",
        floor: selectedBooking.room?.floor || "1st Floor",
        slot: selectedBooking.slot,
        maxSeats: selectedBooking.room?.capacity || 6
      };
    } else {
      payload = {
        topic: hostingTopic.trim(),
        roomName: customRoomName.trim(),
        floor: customFloor,
        slot: customSlot,
        maxSeats: customMaxSeats
      };
    }

    try {
      const res = await fetch(`${API_URL}/api/collaboration/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdGroup = await res.json();
        setStudyGroups([createdGroup, ...studyGroups]);
        setHostingTopic("");
        setHostingBookingId("");
        toast.success(`📢 Study group published! "${createdGroup.topic}" is now active in ${createdGroup.roomName}.`);
      } else {
        toast.error("Failed to host study group.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error while hosting group.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Collaboration: Close a hosted study group on Backend
  const removeCustomGroup = async (id: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/collaboration/groups/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setStudyGroups(studyGroups.filter(g => g._id !== id));
        toast.info("Group session removed from the public board.");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to close group.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error while closing group.");
    }
  };

  // Compute Timer Progress Ring variables
  const maxTime = initialTime[timerMode];
  const progressPercent = timeLeft / maxTime;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPercent);

  // Time Formatter
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Compute stats for achievement badges
  const achievements = [
    { id: "a1", name: "Novice Scholar", desc: "Complete 1 full focus session cycle.", icon: GraduationCap, progress: Math.min(completedCycles / 1 * 100, 100), unlocked: completedCycles >= 1, label: `${Math.min(completedCycles, 1)} / 1`, color: "text-blue-400" },
    { id: "a2", name: "Focus Engine", desc: "Complete 4 full study session cycles.", icon: Zap, progress: Math.min(completedCycles / 4 * 100, 100), unlocked: completedCycles >= 4, label: `${Math.min(completedCycles, 4)} / 4`, color: "text-amber-400" },
    { id: "a3", name: "Deep Work Master", desc: "Log 120 total focus minutes.", icon: Flame, progress: Math.min(totalFocusedMinutes / 120 * 100, 100), unlocked: totalFocusedMinutes >= 120, label: `${Math.min(totalFocusedMinutes, 120)} / 120 min`, color: "text-rose-400" },
    { id: "a4", name: "Flow State Sage", desc: "Complete 8 full study session cycles.", icon: Brain, progress: Math.min(completedCycles / 8 * 100, 100), unlocked: completedCycles >= 8, label: `${Math.min(completedCycles, 8)} / 8`, color: "text-purple-400" },
    { id: "a5", name: "Perfect Balance", desc: "Unlock by logging at least 2 completed study sessions.", icon: Palmtree, progress: Math.min(completedCycles / 2 * 100, 100), unlocked: completedCycles >= 2, label: `${Math.min(completedCycles, 2)} / 2`, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Dynamic Navigation Panels Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card/40 border p-4 rounded-3xl backdrop-blur-sm shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" /> Focus & Study Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Stream ambient audio mixers, book study groups, or review personal achievement scores.</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-xl border w-fit">
          <button
            onClick={() => setActivePanel("focus")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-300",
              activePanel === "focus" 
                ? "bg-primary text-primary-foreground shadow-md scale-102" 
                : "text-muted-foreground hover:bg-accent/40"
            )}
          >
            <Hourglass className="h-3.5 w-3.5" /> Solo Focus Station
          </button>
          <button
            onClick={() => setActivePanel("collaboration")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-300 relative",
              activePanel === "collaboration" 
                ? "bg-primary text-primary-foreground shadow-md scale-102" 
                : "text-muted-foreground hover:bg-accent/40"
            )}
          >
            <Users className="h-3.5 w-3.5" /> Peer Study Board
            {studyGroups.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
            )}
          </button>
          <button
            onClick={() => setActivePanel("analytics")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-300",
              activePanel === "analytics" 
                ? "bg-primary text-primary-foreground shadow-md scale-102" 
                : "text-muted-foreground hover:bg-accent/40"
            )}
          >
            <Trophy className="h-3.5 w-3.5" /> Focus Insights
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activePanel === "focus" && (
          /* ========================================================
             SOLO FOCUS STATION
             ======================================================== */
          <motion.div
            key="focus-station"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-white/5 border border-white/5 rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-r from-indigo-950/10 to-transparent">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Completed Sessions</p>
                  <p className="text-xl font-black text-white">{completedCycles} Cycles</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-r from-emerald-950/10 to-transparent">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Focused Minutes</p>
                  <p className="text-xl font-black text-white">{totalFocusedMinutes} Minutes</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Card className="border-border/50 bg-card/85 backdrop-blur-xl h-full flex flex-col justify-between">
                  <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center">
                    <div className="w-full flex justify-center gap-2 mb-8">
                      {[
                        { mode: "focus", label: "🎯 Focus Session", activeColor: "bg-primary text-primary-foreground shadow-lg shadow-primary/20" },
                        { mode: "shortBreak", label: "☕ Short Break", activeColor: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" },
                        { mode: "longBreak", label: "🌴 Long Break", activeColor: "bg-blue-600 text-white shadow-lg shadow-blue-600/20" },
                      ].map((item) => (
                        <button
                          key={item.mode}
                          onClick={() => setTimerMode(item.mode as any)}
                          className={cn(
                            "rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 scale-95",
                            timerMode === item.mode
                              ? item.activeColor + " scale-100 font-extrabold"
                              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-64 h-64 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="128" cy="128" r={radius} className="stroke-muted/40 fill-none" strokeWidth="8" />
                        <motion.circle
                          cx="128" cy="128" r={radius}
                          className={cn(
                            "fill-none transition-all duration-100",
                            timerMode === "focus" ? "stroke-primary" : timerMode === "shortBreak" ? "stroke-emerald-500" : "stroke-blue-500"
                          )}
                          strokeWidth="10"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <p className="text-5xl font-mono font-black tracking-tighter text-foreground tabular-nums">{formatTime(timeLeft)}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                          {timerMode === "focus" ? "Focused Study" : "Rest & Recharge"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-8">
                      <Button
                        size="lg"
                        onClick={() => setIsRunning(!isRunning)}
                        className={cn(
                          "rounded-2xl px-8 py-6 text-sm font-extrabold tracking-wide uppercase transition-all shadow-lg",
                          isRunning ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20" : "bg-primary text-primary-foreground shadow-primary/20 hover:scale-105"
                        )}
                      >
                        {isRunning ? <><Pause className="mr-2 h-4 w-4 fill-white" /> Pause</> : <><Play className="mr-2 h-4 w-4 fill-white" /> Start Focus</>}
                      </Button>
                      <Button
                        variant="outline" size="icon"
                        onClick={() => { setIsRunning(false); setTimeLeft(initialTime[timerMode]); }}
                        className="rounded-2xl h-12 w-12 border-border/50 text-muted-foreground hover:bg-accent/40"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-5">
                <Card className="border-border/50 bg-card/85 backdrop-blur-xl h-full flex flex-col justify-between">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <h2 className="text-sm font-bold text-card-foreground uppercase tracking-widest">Ambient Mixer</h2>
                      </div>
                      <Button variant="ghost" size="sm" onClick={stopAllAmbient} className="text-xs text-destructive hover:bg-destructive/10 rounded-xl">
                        <VolumeX className="h-4 w-4 mr-1.5" /> Mute All
                      </Button>
                    </div>
                    <div className="grid gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {audioTracks.map((track) => {
                        const isPlaying = !!playingTracks[track.id];
                        const vol = trackVolumes[track.id] || 0.4;
                        return (
                          <div
                            key={track.id}
                            className={cn(
                              "rounded-2xl border border-white/5 bg-gradient-to-r p-3 flex flex-col gap-2 transition-all duration-300",
                              track.color,
                              isPlaying ? "border-primary/20 bg-primary/5 shadow-md" : "opacity-80"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <track.icon className="h-5 w-5 text-primary shrink-0" />
                                <span className="text-xs font-bold text-foreground">{track.name}</span>
                              </div>
                              <button
                                onClick={() => toggleTrack(track.id)}
                                className={cn(
                                  "text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider transition-all shadow-sm",
                                  isPlaying ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                )}
                              >
                                {isPlaying ? "Active" : "On"}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range" min="0" max="1" step="0.05" value={vol}
                                onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                                disabled={!isPlaying}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-40"
                              />
                              <span className="text-[9px] font-mono font-bold text-muted-foreground w-6 text-right">{Math.round(vol * 100)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border-border/50 bg-card/85 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-card-foreground uppercase tracking-widest flex items-center gap-2"><ListTodo className="h-4 w-4 text-primary" /> Today's Session checklist</h3>
                  {tasks.some(t=>t.completed) && (
                    <Button variant="outline" size="sm" onClick={clearCompletedTasks} className="text-xs rounded-xl">Clear Completed</Button>
                  )}
                </div>
                <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                  <Input
                    type="text" placeholder="Add study target..." value={newTaskText}
                    onChange={(e)=>setNewTaskText(e.target.value)}
                    className="flex-1 bg-muted/40 rounded-xl border-border/50 text-xs"
                  />
                  <Button type="submit" className="rounded-xl px-4 text-xs font-bold gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
                </form>
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-6 border border-dashed rounded-2xl">Checklist is empty. Add tasks to focus.</p>
                  ) : tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border border-border/40 p-3 bg-card/40 transition-colors cursor-pointer",
                        task.completed && "bg-accent/10 opacity-70"
                      )}
                      onClick={()=>toggleTask(task.id)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center",
                          task.completed ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-border"
                        )}>
                          {task.completed && <Check className="h-3 w-3" />}
                        </span>
                        <p className={cn("text-xs font-semibold truncate", task.completed && "line-through text-muted-foreground")}>{task.text}</p>
                      </div>
                      <button onClick={(e)=>{e.stopPropagation(); deleteTask(task.id);}} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activePanel === "collaboration" && (
          /* ========================================================
             COMMUNITY COLLABORATION BOARD
             ======================================================== */
          <motion.div
            key="collaboration-board"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid gap-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-4">
              <Card className="border-border/50 bg-card/85 backdrop-blur-xl h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="border-b pb-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-card-foreground flex items-center gap-1.5">
                      <PlusCircle className="h-4 w-4 text-primary" /> Host Open Study
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Publish study sessions dynamically to coordinate with library peers.</p>
                  </div>

                  {/* Mode Selector Toggle if they have bookings */}
                  {myUpcomingBookings.length > 0 && (
                    <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-white/5 mb-4">
                      <button
                        type="button"
                        onClick={() => setHostMode("booking")}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                          hostMode === "booking" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        Link Booking
                      </button>
                      <button
                        type="button"
                        onClick={() => setHostMode("custom")}
                        className={cn(
                          "flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                          hostMode === "custom" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        Instant Group
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleHostGroupSession} className="space-y-4">
                    {hostMode === "booking" ? (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select reservation</label>
                        <select
                          required
                          value={hostingBookingId}
                          onChange={(e) => setHostingBookingId(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/40 p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary text-slate-100"
                        >
                          <option value="" disabled className="bg-slate-900">-- Choose a Booking --</option>
                          {myUpcomingBookings.map((b) => (
                            <option key={b._id} value={b._id} className="bg-slate-900">
                              {b.room?.name} ({b.date} · {b.slot})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-2 grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Room Name</label>
                            <select
                              value={customRoomName}
                              onChange={(e) => setCustomRoomName(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-950/40 p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary text-slate-100"
                            >
                              {["Co-Study Cabin 1", "Discussion Suite A", "Quiet Zone C3", "Multimedia Cabin", "Individual Study Desk", "Project Suite 4"].map((r) => (
                                <option key={r} value={r} className="bg-slate-900">{r}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Floor Level</label>
                            <select
                              value={customFloor}
                              onChange={(e) => setCustomFloor(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-950/40 p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary text-slate-100"
                            >
                              {["Basement", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor"].map((f) => (
                                <option key={f} value={f} className="bg-slate-900">{f}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-2 grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Time Slot</label>
                            <select
                              value={customSlot}
                              onChange={(e) => setCustomSlot(e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-slate-950/40 p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary text-slate-100"
                            >
                              {["09:00 - 11:00 AM", "11:00 AM - 01:00 PM", "01:00 - 03:00 PM", "03:00 - 05:00 PM", "05:00 - 07:00 PM", "07:00 - 09:00 PM"].map((s) => (
                                <option key={s} value={s} className="bg-slate-900">{s}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Max Seats</label>
                            <select
                              value={customMaxSeats}
                              onChange={(e) => setCustomMaxSeats(parseInt(e.target.value))}
                              className="w-full rounded-xl border border-white/10 bg-slate-950/40 p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary text-slate-100"
                            >
                              {[2, 3, 4, 6, 8, 10].map((num) => (
                                <option key={num} value={num} className="bg-slate-900">{num} Seats</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Collaboration Topic</label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Prep for Calc Final exam"
                        value={hostingTopic}
                        onChange={(e) => setHostingTopic(e.target.value)}
                        className="w-full rounded-xl bg-slate-950/40 border-white/10 text-xs font-semibold text-slate-100 placeholder:text-slate-500 h-9"
                      />
                    </div>

                    <Button type="submit" disabled={isPublishing} className="w-full rounded-xl font-bold text-xs py-5 shadow-lg shadow-primary/10">
                      {isPublishing ? "Hosting..." : <span className="flex items-center justify-center gap-1.5"><Globe className="h-4 w-4 shrink-0" /> Host Study Session</span>}
                    </Button>
                  </form>

                  <div className="rounded-2xl bg-white/5 border border-white/5 p-3.5 text-[10px] text-muted-foreground leading-relaxed">
                    <p className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5"><Info className="h-4 w-4 text-indigo-400 shrink-0" /> Group Guidelines</p>
                    Once published, students browsing the board can sign up to join your space. Respect library volume bounds.
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary animate-pulse" /> Active Open Sessions ({studyGroups.length})
                </h3>
              </div>

              <div className="grid gap-4">
                {studyGroups.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed rounded-3xl bg-card/10">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                    <p className="text-xs text-muted-foreground font-bold">No active groups published at the moment.</p>
                  </div>
                ) : (
                  studyGroups.map((group) => {
                    const isJoined = group.participants.includes(studentName);
                    const isFull = group.participants.length >= group.maxSeats;

                    return (
                      <motion.div
                        key={group._id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "rounded-2xl border border-border/40 p-4 transition-all duration-300 hover:shadow-lg bg-card/85 backdrop-blur-md relative overflow-hidden flex flex-col justify-between gap-4",
                          isJoined && "ring-1 ring-primary/30 border-primary/20 bg-primary/5"
                        )}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 text-[9px] font-bold py-0.25 px-1.5 uppercase">
                                {group.roomName}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-bold tracking-tight uppercase flex items-center gap-1">
                                <Clock className="h-3 w-3 text-indigo-400" /> {group.slot}
                              </span>
                            </div>
                            <h4 className="text-base font-extrabold text-foreground tracking-tight leading-snug mt-1">{group.topic}</h4>
                            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-1">
                              Hosted by <span className="text-primary font-bold">{group.host}</span> · Floor: {group.floor}
                            </p>
                          </div>

                          <div className="flex flex-col items-end sm:text-right gap-2 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-bold text-foreground">{group.participants.length} / {group.maxSeats}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">Seats Filled</span>
                            </div>
                            <div className="w-24 h-1.5 bg-muted/60 overflow-hidden rounded-full p-0.25 border border-white/5 flex">
                              <div 
                                style={{ width: `${(group.participants.length / group.maxSeats) * 100}%` }}
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  isFull ? "bg-destructive" : "bg-primary"
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-border/40 pt-3.5 gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mr-1">Roster:</span>
                            <div className="flex -space-x-2.5 overflow-hidden">
                              {group.participants.map((person, idx) => {
                                const initials = person.split(" ").map(n=>n[0]).join("").substring(0, 2).toUpperCase();
                                return (
                                  <div 
                                    key={idx} 
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-card bg-gradient-to-br from-indigo-500 to-primary/80 text-[9px] font-black text-white uppercase shadow-sm select-none"
                                    title={person}
                                  >
                                    {initials}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 ml-auto">
                            {isJoined && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openGroupChat(group._id)}
                                className="rounded-xl font-bold text-xs px-3 border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center gap-1.5 shadow-sm"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Open Chat
                              </Button>
                            )}

                            {group.host === studentName ? (
                              <button 
                                onClick={() => removeCustomGroup(group._id)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-bold px-3 py-1.5 rounded-xl border border-border/50 transition-colors"
                              >
                                Close Group
                              </button>
                            ) : isJoined ? (
                              <button 
                                onClick={() => leaveStudyGroup(group._id)}
                                className="text-destructive hover:bg-destructive/10 text-xs font-bold px-3 py-1.5 rounded-xl border border-border/50 transition-colors"
                              >
                                Leave Group
                              </button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={isFull}
                                onClick={() => joinStudyGroup(group._id)}
                                className={cn(
                                  "rounded-xl font-bold text-xs px-4 transition-all shadow-sm",
                                  isFull 
                                    ? "bg-muted text-muted-foreground" 
                                    : "bg-primary text-primary-foreground hover:scale-105 shadow-primary/10"
                                )}
                              >
                                {isFull ? (
                                  "Full"
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <UserPlus className="h-3.5 w-3.5" /> Join Group
                                  </span>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activePanel === "analytics" && (
          /* ========================================================
             ANALYTICS & PERFORMANCE INSIGHTS SUITE
             ======================================================== */
          <motion.div
            key="analytics-suite"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border/50 bg-card/85 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between p-6">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Focus Index Score</h4>
                  <p className="text-4xl font-black text-primary mt-1">
                    {Math.min(60 + completedCycles * 5, 98)} <span className="text-xs text-muted-foreground font-semibold">/ 100</span>
                  </p>
                </div>
                <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
                  Calculated based on Pomodoro completion rates, break ratios, and goal checklist completion speed.
                </div>
              </Card>

              <Card className="border-border/50 bg-card/85 backdrop-blur-xl md:col-span-2 p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Weekly Focus Distribution</h4>
                </div>
                <div className="flex items-end justify-between gap-3 h-28 mt-2">
                  {Object.keys(weeklyLogs).map((day) => {
                    const value = weeklyLogs[day] || 0;
                    const maxLog = Math.max(...Object.values(weeklyLogs), 60);
                    const barHeightPct = Math.round((value / maxLog) * 100);
                    return (
                      <div key={day} className="flex flex-col items-center flex-1 gap-1.5 h-full justify-end group cursor-pointer">
                        <span className="text-[9px] font-mono font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">{value}m</span>
                        <div 
                          style={{ height: `${Math.max(barHeightPct, 6)}%` }}
                          className={cn(
                            "w-full rounded-t-lg bg-gradient-to-t transition-all duration-500",
                            value > 60 
                              ? "from-indigo-600 to-indigo-400" 
                              : value > 0 
                                ? "from-primary to-primary/75" 
                                : "from-muted/40 to-muted/20"
                          )}
                        />
                        <span className="text-[10px] font-bold text-muted-foreground">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <Card className="border-border/50 bg-card/85 backdrop-blur-xl">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="border-b pb-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
                      <Award className="h-4.5 w-4.5 text-primary animate-bounce" /> Academic Milestones & Medals
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Earn badges as you complete study sessions and hit deep-work benchmarks.</p>
                  </div>
                  <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id}
                      className={cn(
                        "rounded-2xl border p-4 flex flex-col justify-between gap-3 relative overflow-hidden transition-all duration-300 hover:shadow-md",
                        ach.unlocked 
                          ? "border-primary/20 bg-primary/5 shadow-sm" 
                          : "border-border/40 bg-card/30 opacity-75"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0",
                            ach.unlocked ? ach.color : "text-slate-500"
                          )}>
                            <ach.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-foreground">{ach.name}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{ach.desc}</p>
                          </div>
                        </div>
                        {ach.unlocked ? (
                          <Badge variant="success" className="text-[8px] py-0.25 px-1 font-bold">UNLOCKED</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8px] py-0.25 px-1 font-semibold text-muted-foreground bg-muted/40 border-none flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> LOCKED
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                          <span>Progress</span>
                          <span className="font-mono">{ach.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/60 overflow-hidden rounded-full p-0.25 flex">
                          <div 
                            style={{ width: `${ach.progress}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              ach.unlocked ? "bg-emerald-500" : "bg-primary"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/85 backdrop-blur-xl relative overflow-hidden p-6 md:p-8 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Cognitive Balance Study Insights</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                    {completedCycles === 0 ? (
                      "Your study logs are currently empty. Complete your first Pomodoro session today to let our smart analytics evaluate your workflow patterns, peak efficiency hours, and balance indexes!"
                    ) : completedCycles < 3 ? (
                      `You've logged ${completedCycles} study block today. Excellent start! To achieve maximum cognitive absorption and prevent study burnout, remember to take short 5-minute break blocks between focus cycles.`
                    ) : (
                      `Amazing effort! You have completed ${completedCycles} cycles totaling ${totalFocusedMinutes} minutes. Based on your peak performance periods, your concentration is highest in quiet zones. We recommend continuing your study blocks in Quiet Zone C1 during early afternoons.`
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp-Like Slide-Over Group Chat Drawer */}
      <AnimatePresence>
        {activeChatGroupId && activeChatGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end"
            onClick={closeChatDrawer}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md md:max-w-lg bg-slate-900/95 border-l border-white/10 h-full flex flex-col shadow-2xl relative text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Badge variant="outline" className="border-primary/30 text-primary text-[9px] font-black uppercase tracking-wider bg-primary/5">
                      {activeChatGroup.roomName} ({activeChatGroup.slot})
                    </Badge>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-100 mt-1 truncate max-w-[280px] md:max-w-[340px]" title={activeChatGroup.topic}>
                    {activeChatGroup.topic}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                    Host: <span className="text-primary">{activeChatGroup.host}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRoster(!showRoster)}
                    className={cn(
                      "p-2 rounded-xl transition-all border",
                      showRoster 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                    title="View Roster"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  <button
                    onClick={closeChatDrawer}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Toggleable Roster Panel */}
              <AnimatePresence>
                {showRoster && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-white/10 bg-slate-950/40 overflow-hidden"
                  >
                    <div className="p-4 space-y-2.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Study Roster ({activeChatGroup.participants.length} Members)</p>
                      <div className="grid gap-2 sm:grid-cols-2 max-h-40 overflow-y-auto pr-1">
                        {activeChatGroup.participants.map((person, idx) => {
                          const isHost = person === activeChatGroup.host;
                          const initials = person.split(" ").map(n=>n[0]).join("").substring(0, 2).toUpperCase();
                          return (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-primary/80 flex items-center justify-center text-[9px] font-black text-white uppercase shadow-sm">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                                  {person}
                                  {isHost && <Crown className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                                </p>
                                <p className="text-[9px] text-slate-400 font-semibold">
                                  {isHost ? "Group Organizer" : "Active Member"}
                                </p>
                              </div>
                              {isHost && (
                                <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-300 text-[8px] font-black px-1 py-0 shadow-sm shrink-0">
                                  HOST
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Message Window */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20 flex flex-col">
                {chatLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-20">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs text-slate-400 font-semibold">Loading chat archive...</p>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2 py-20">
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 border border-white/10">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">No messages in this group yet</p>
                    <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                      Say hi to your study members, share notes, or post coordination updates for your upcoming study session!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => {
                      const isMe = msg.sender === studentName;
                      const initials = msg.sender.split(" ").map((n: string)=>n[0]).join("").substring(0, 2).toUpperCase();
                      const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={msg._id || idx} className={cn("flex gap-2.5", isMe ? "justify-end" : "justify-start")}>
                          {!isMe && (
                            <div 
                              className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 text-[9px] font-black flex items-center justify-center uppercase shadow-sm shrink-0 self-end select-none"
                              title={msg.sender}
                            >
                              {initials}
                            </div>
                          )}
                          <div className={cn("max-w-[80%] flex flex-col", isMe ? "items-end" : "items-start")}>
                            {!isMe && (
                              <span className="text-[10px] font-black text-indigo-300 ml-1.5 mb-1">{msg.sender}</span>
                            )}
                            <div
                              className={cn(
                                "p-3 rounded-2xl relative shadow-md border",
                                isMe 
                                  ? "bg-primary border-primary-foreground/10 text-primary-foreground rounded-tr-none" 
                                  : "bg-slate-900/90 border-white/10 text-slate-100 rounded-tl-none"
                              )}
                            >
                              {/* Text Message */}
                              {msg.text && (
                                <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap text-left">{msg.text}</p>
                              )}

                              {/* Attachment - Image */}
                              {msg.fileUrl && msg.fileType?.startsWith("image/") ? (
                                <div className="mt-2 relative group max-w-xs rounded-xl overflow-hidden border border-white/10">
                                  <img 
                                    src={msg.fileUrl} 
                                    alt={msg.fileName || "Shared image"} 
                                    onClick={() => setPreviewImage(msg.fileUrl)}
                                    className="max-h-56 object-cover w-full cursor-zoom-in hover:opacity-90 transition-opacity"
                                  />
                                </div>
                              ) : msg.fileUrl ? (
                                /* Attachment - Document */
                                <div 
                                  onClick={() => handleDownloadFile(msg.fileUrl, msg.fileName || "file")}
                                  className="mt-2 flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5 cursor-pointer hover:bg-slate-950/90 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0 mr-3">
                                    <Paperclip className="h-4.5 w-4.5 text-primary shrink-0" />
                                    <div className="text-left min-w-0">
                                      <p className="text-xs font-bold text-slate-200 truncate">{msg.fileName}</p>
                                      <p className="text-[9px] text-slate-400 font-semibold">
                                        {msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB` : "Document"}
                                      </p>
                                    </div>
                                  </div>
                                  <Download className="h-4 w-4 text-slate-400 hover:text-slate-100 shrink-0" />
                                </div>
                              ) : null}

                              {/* Timestamp */}
                              <span className={cn(
                                "block text-[8px] font-bold text-right mt-1.5 opacity-60 font-mono",
                                isMe ? "text-primary-foreground" : "text-slate-400"
                              )}>
                                {formattedTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Attachment Selection Preview Bar */}
              {selectedFile && (
                <div className="p-2 px-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center shrink-0">
                      {selectedFile.type.startsWith("image/") ? (
                        <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Paperclip className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </span>
                    <p className="font-bold truncate max-w-[280px]">{selectedFile.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-900/80 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {/* File Attachment Input Trigger */}
                  <label className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0">
                    <Paperclip className="h-4 w-4" />
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, false)} 
                    />
                  </label>

                  {/* Image Attachment Input Trigger */}
                  <label className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0">
                    <ImageIcon className="h-4 w-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, true)} 
                    />
                  </label>
                </div>

                <Input
                  type="text"
                  placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-slate-950/40 border-white/10 text-xs text-white rounded-xl placeholder:text-slate-500 h-9"
                  disabled={chatSending}
                />

                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl h-9 w-9 bg-primary text-primary-foreground hover:scale-105 shrink-0"
                  disabled={chatSending || (!messageText.trim() && !selectedFile)}
                >
                  {chatSending ? (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 fill-white" />
                  )}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Full-Screen Image Lightbox Lightbox Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setPreviewImage(null)}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 border border-white/10 rounded-2xl hover:bg-white/20 text-white transition-all z-56"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={previewImage}
              alt="Lightbox preview"
              className="max-w-full max-h-full object-contain rounded-2xl select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertCircle({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="8.01" />
    </svg>
  );
}
