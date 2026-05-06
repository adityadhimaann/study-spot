import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, GraduationCap, Building, Clock, Star, CalendarDays, BookMarked, TrendingUp, Camera, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — StudySpace" }] }),
});

type UserProfile = {
  _id?: string;
  name?: string;
  email?: string;
  department?: string;
  year?: string;
  studentId?: string;
  profilePicture?: string;
};

type Booking = {
  _id: string;
  room: { name: string; floor: string; rating: number };
  date: string;
  slot: string;
  status: string;
};

function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({});
  const [isUploading, setIsUploading] = useState(false);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setUser(data);
      setEditForm(data);
      localStorage.setItem("user", JSON.stringify({ ...data, id: data._id }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/api/bookings/my-bookings`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(prev => ({ ...prev, ...updatedUser }));
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      // 1. Upload to storage
      const uploadRes = await fetch(`${API_URL}/api/storage/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();

      // 2. Update user profile with the new URL
      const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ profilePicture: uploadData.url })
      });

      if (profileRes.ok) {
        setUser(prev => prev ? { ...prev, profilePicture: uploadData.url } : null);
        toast.success("Profile picture updated!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const name = user?.name || "Student";
  const email = user?.email || "";
  const department = user?.department || "Unassigned";
  const year = user?.year || "1st Year";
  const studentId = user?.studentId || "STU-NEW";
  const profilePicture = user?.profilePicture;

  const initials = name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const totalHours = bookings.length * 2;
  const bookingsMade = bookings.length;
  
  const usageStats = [
    { label: "Total Hours", value: `${totalHours}h`, icon: Clock },
    { label: "Bookings Made", value: bookingsMade.toString(), icon: BookMarked },
    { label: "Avg Rating", value: "4.8", icon: Star },
    { label: "This Month", value: `${bookings.filter(b => new Date(b.date).getMonth() === new Date().getMonth()).length * 2}h`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <CardContent className="p-6 -mt-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative group">
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-card bg-gradient-to-br from-primary to-primary/70 text-4xl font-bold text-primary-foreground shadow-2xl uppercase overflow-hidden">
                {profilePicture ? (
                  <img src={profilePicture} alt={name} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <label htmlFor="profile-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            </div>
            
            <div className="pb-2 text-center sm:text-left">
              <h2 className="text-3xl font-bold text-card-foreground">{name}</h2>
              <p className="text-muted-foreground font-medium">Student · {department} · {year}</p>
            </div>

            <div className="sm:ml-auto flex gap-2 pb-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveProfile}>Save Changes</Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Mail, label: "Email", value: email, field: 'email', editable: false },
              { icon: GraduationCap, label: "Student ID", value: studentId, field: 'studentId', editable: true },
              { icon: Building, label: "Department", value: department, field: 'department', editable: true },
              { icon: User, label: "Year", value: year, field: 'year', editable: true },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/50 p-4 bg-background/40">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                {isEditing && item.editable ? (
                  <input 
                    type="text" 
                    value={(editForm as any)[item.field] || ""} 
                    onChange={e => setEditForm({...editForm, [item.field]: e.target.value})} 
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                ) : (
                  <p className="text-sm font-semibold text-card-foreground">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {usageStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="group border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-card-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
