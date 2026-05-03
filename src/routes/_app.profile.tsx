import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, GraduationCap, Building } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Profile — StudySpace" }],
  }),
});

function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              JD
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">Jane Doe</h2>
              <p className="text-sm text-muted-foreground">Student · Computer Science</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Mail, label: "Email", value: "jane.doe@university.edu" },
              { icon: GraduationCap, label: "Student ID", value: "STU-2024-0892" },
              { icon: Building, label: "Department", value: "Computer Science" },
              { icon: User, label: "Year", value: "3rd Year" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border p-4">
                <item.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-card-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="mt-6">Edit Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}
