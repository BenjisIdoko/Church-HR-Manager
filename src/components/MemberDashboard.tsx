import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { User as UserIcon, Save, ShieldCheck, Plus, X, Building2, Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { User, Worker } from "../types/models";
import { readAndCompressImage } from "../utils/imageUtils";

interface MemberDashboardProps {
  user: User;
  worker?: Worker;
  departments?: string[];
  onUpdateProfile: (updated: {
    name: string;
    email: string;
    phone: string;
    department?: string;
    departments?: string[];
    profileImage?: string;
  }) => Promise<void>;
}

const DEFAULT_DEPARTMENTS = [
  "Intercessors",
  "Hospitality",
  "Greeters",
  "Ushers",
  "Media",
  "Response Team",
  "Creative Team",
  "Protocol",
  "Logistics",
  "Finance",
  "Welfare",
  "Sanctuary",
  "Events/Program",
  "TCC/Ushafa Children",
];

export function MemberDashboard({ user, worker, departments = DEFAULT_DEPARTMENTS, onUpdateProfile }: MemberDashboardProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(worker?.phone ?? "");
  const [profileImage, setProfileImage] = useState(worker?.profileImage ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse initial departments list
  const initialDepts = worker?.department
    ? worker.department.split(",").map((d) => d.trim()).filter(Boolean)
    : [];
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    initialDepts.length > 0 ? Array.from(new Set(initialDepts)) : ["General Workforce"]
  );
  const [customDept, setCustomDept] = useState("");

  const handleAddDept = (deptName: string) => {
    const trimmed = deptName.trim();
    if (!trimmed) return;
    if (!selectedDepts.includes(trimmed)) {
      setSelectedDepts([...selectedDepts, trimmed]);
    }
    setCustomDept("");
  };

  const handleRemoveDept = (deptName: string) => {
    if (selectedDepts.length <= 1) {
      toast.error("You must belong to at least one department.");
      return;
    }
    setSelectedDepts(selectedDepts.filter((d) => d !== deptName));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = "";

      try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await fetch("/api/upload-profile-image", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result.ok && result.imageUrl) {
          imageUrl = result.imageUrl;
        }
      } catch {
        // Fallback for static deployments (Vercel) or offline mode
      }

      if (!imageUrl) {
        imageUrl = await readAndCompressImage(file);
      }

      setProfileImage(imageUrl);
      toast.success("Profile photo loaded! Click 'Save Profile Updates' to persist.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const departmentString = selectedDepts.join(", ");
      await onUpdateProfile({
        name,
        email,
        phone,
        department: departmentString,
        departments: selectedDepts,
        profileImage,
      });
      toast.success("Your profile, photo, and department details have been updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update your profile.");
    }
  };

  const allAvailableDepts = Array.from(new Set([...departments, ...DEFAULT_DEPARTMENTS]));

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1917]">Volunteer Profile</h1>
          <p className="text-sm text-muted-foreground">
            Update your profile photo, contact details, and active department assignments.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-[#0d9488] text-white hover:bg-[#0f766e] self-start sm:self-auto">
          <Link to="/clock-in">Clock In Now</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#0d9488] p-3 text-white">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Personal & Workforce Profile</CardTitle>
              <CardDescription>Update your avatar photo, email, phone number, and assigned departments.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="relative shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={name}
                  className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-md"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    setProfileImage("");
                  }}
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-[#0d9488]/10 border-4 border-white shadow-md flex items-center justify-center text-[#0d9488]">
                  <UserIcon className="h-10 w-10" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 rounded-xl bg-[#0d9488] p-2 text-white hover:bg-[#0f766e] shadow-sm transition-transform active:scale-95"
                disabled={uploading}
                title="Upload Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <Label className="text-sm font-semibold text-slate-800">Profile Photo</Label>
              <p className="text-xs text-slate-500 max-w-md">
                Upload a JPEG, PNG, or WebP picture. Images are automatically compressed and saved to your profile.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl border-slate-200 hover:bg-slate-100 text-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {uploading ? "Processing..." : "Select New Photo"}
                </Button>
                {profileImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setProfileImage("")}
                    className="rounded-xl text-slate-500 hover:text-red-600 text-xs"
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageFileChange}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-name" className="text-xs font-semibold uppercase text-slate-600">Full Name</Label>
              <Input
                id="member-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="rounded-xl border-slate-200 focus:border-[#c85a32]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-email" className="text-xs font-semibold uppercase text-slate-600">Email Address</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="rounded-xl border-slate-200 focus:border-[#c85a32]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-phone" className="text-xs font-semibold uppercase text-slate-600">Phone Number</Label>
              <Input
                id="member-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="rounded-xl border-slate-200 focus:border-[#c85a32]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-role" className="text-xs font-semibold uppercase text-slate-600">System Role</Label>
              <Input id="member-role" value={worker?.role ?? "Member"} disabled className="bg-slate-50 text-slate-500 rounded-xl" />
            </div>
          </div>

          {/* Multi-Department Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0d9488]" />
                <Label className="text-xs font-semibold uppercase text-slate-700">Assigned Department(s)</Label>
              </div>
              <span className="text-xs text-slate-500">Volunteers can belong to multiple departments</span>
            </div>

            {/* Active Selected Departments */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[48px] items-center">
              {selectedDepts.map((dept) => (
                <Badge
                  key={dept}
                  className="bg-[#0d9488] text-white hover:bg-[#0f766e] px-3 py-1 text-xs flex items-center gap-1.5 rounded-lg shadow-2xs"
                >
                  <span>{dept}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDept(dept)}
                    className="hover:bg-white/20 rounded-full p-0.5"
                    title="Remove department"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Department Picker & Add Custom */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">Add to another department:</p>
              <div className="flex flex-wrap gap-1.5">
                {allAvailableDepts
                  .filter((d) => !selectedDepts.includes(d))
                  .map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => handleAddDept(dept)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-[#ccfbf1]/40 hover:border-[#0d9488] hover:text-[#0d9488] text-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      {dept}
                    </button>
                  ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Or type custom department name..."
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDept(customDept);
                    }
                  }}
                  className="text-xs rounded-xl border-slate-200"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddDept(customDept)}
                  disabled={!customDept.trim()}
                  className="rounded-xl shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Your profile photo, contact info, and department assignments update live across church records.
            </p>
            <Button onClick={handleSave} className="bg-[#0d9488] text-white hover:bg-[#0f766e] rounded-xl px-6">
              <Save className="h-4 w-4 mr-2" />
              Save Profile Updates
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500 p-3 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Security & Authorization</CardTitle>
              <CardDescription>Super admins have administrative oversight while members manage their own contact profile.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-600 leading-relaxed">
            As a volunteer, you have full control over updating your profile picture, email address, phone number, and active department assignments. Deleting worker history is restricted to Super Admin access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
