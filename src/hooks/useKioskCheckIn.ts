import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchKioskCheckins, createKioskCheckin, checkoutKiosk } from "../utils/api";
import { KioskCheckin, User, Worker } from "../types/models";
import { toast } from "sonner";
import { printReport } from "../utils/exportUtils";

interface UseKioskCheckInProps {
  user?: User | null;
  workers?: Worker[];
}

export function useKioskCheckIn({ user, workers = [] }: UseKioskCheckInProps) {
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "superadmin" || user?.role === "manager";
  const [viewMode, setViewMode] = useState<"kiosk" | "admin">(isAdmin ? "admin" : "kiosk");
  const [searchQuery, setSearchQuery] = useState("");

  const [childName, setChildName] = useState("");
  // Shared physical kiosk: fields default empty for walk-up families
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [department, setDepartment] = useState("Junior Church (4-8 yrs)");

  const [lastCheckin, setLastCheckin] = useState<{
    childName: string;
    parentName: string;
    parentPhone: string;
    securityCode: string;
    department: string;
    timestamp: string;
  } | null>(null);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);

  const { data: checkins = [], isLoading: loading } = useQuery<KioskCheckin[]>({
    queryKey: ["kioskCheckins"],
    queryFn: fetchKioskCheckins,
  });

  const checkinMutation = useMutation({
    mutationFn: (payload: { childName: string; parentName: string; parentPhone: string; department: string }) =>
      createKioskCheckin(payload),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kioskCheckins"] });
      setLastCheckin({
        childName: variables.childName,
        parentName: variables.parentName,
        parentPhone: variables.parentPhone,
        securityCode: res.securityCode || "KSK-9999",
        department: variables.department,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      setIsBadgeOpen(true);
      setChildName("");
      toast.success(`Check-in successful! Security Code: ${res.securityCode}`);
    },
    onError: () => {
      toast.error("Failed to complete kiosk check-in.");
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (checkinId: number) => checkoutKiosk(checkinId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kioskCheckins"] });
      toast.success("Child checked out safely!");
    },
  });

  const handleKioskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) { toast.error("Child name is required"); return; }
    if (!parentName.trim()) { toast.error("Parent/Guardian name is required"); return; }
    if (!parentPhone.trim()) { toast.error("Parent phone number is required"); return; }

    checkinMutation.mutate({
      childName: childName.trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      department,
    });
  };

  const handlePrintBadge = () => {
    if (!lastCheckin) return;
    const html = `
      <div style="font-family: sans-serif; padding: 24px; text-align: center; border: 3px dashed #4f46e5; border-radius: 16px;">
        <h2 style="margin: 0; color: #4f46e5;">CHURCH KIDS KIOSK BADGE</h2>
        <h1 style="font-size: 32px; margin: 16px 0 8px 0; font-weight: bold;">${lastCheckin.childName}</h1>
        <p style="font-size: 18px; color: #4b5563; margin: 0;">${lastCheckin.department}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 14px; margin: 4px 0;">Guardian: <strong>${lastCheckin.parentName}</strong> (${lastCheckin.parentPhone})</p>
        <p style="font-size: 14px; margin: 4px 0;">Checked In: <strong>${lastCheckin.timestamp}</strong></p>
        <div style="margin-top: 20px; padding: 12px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">SECURITY PICKUP CODE</p>
          <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: font-mono; font-weight: bold; color: #111827; letter-spacing: 2px;">${lastCheckin.securityCode}</p>
        </div>
      </div>
    `;
    printReport(`Badge-${lastCheckin.childName}`, html);
  };

  const filteredCheckins = checkins.filter(
    (c) =>
      (c.childName || c.child_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.parentName || c.parent_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.securityCode || c.security_code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    isAdmin,
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    childName, setChildName,
    parentName, setParentName,
    parentPhone, setParentPhone,
    department, setDepartment,
    lastCheckin,
    isBadgeOpen, setIsBadgeOpen,
    checkins,
    loading,
    submitting: checkinMutation.isPending,
    handleKioskSubmit,
    handleCheckout: (id: number) => checkoutMutation.mutate(id),
    handlePrintBadge,
    filteredCheckins,
  };
}
