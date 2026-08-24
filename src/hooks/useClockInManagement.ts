import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClockInSettings, updateClockInSettings, getClockInsByDate, ClockInSettings } from "../utils/api";
import { getCurrentLocation } from "../utils/clockInService";
import { toast } from "sonner";

const defaultSettings: ClockInSettings = {
  clock_in_portal_enabled: "true",
  clock_in_portal_name: "Church Clock-In Portal",
  clock_in_portal_description: "Use this portal to clock in and out when on church grounds.",
  church_latitude: "9.0765",
  church_longitude: "7.3986",
  geofence_radius_meters: "200",
  geofence_tolerance_meters: "50",
  device_import_enabled: "true",
};

export function validateSettings(s: ClockInSettings): string | null {
  const lat = Number(s.church_latitude);
  const lng = Number(s.church_longitude);
  const rad = Number(s.geofence_radius_meters);
  const tol = Number(s.geofence_tolerance_meters);

  if (isNaN(lat) || lat < -90 || lat > 90) return "Invalid latitude. Must be between -90 and 90.";
  if (isNaN(lng) || lng < -180 || lng > 180) return "Invalid longitude. Must be between -180 and 180.";
  if (isNaN(rad) || rad < 10 || rad > 10000) return "Radius must be between 10 and 10,000 meters.";
  if (isNaN(tol) || tol < 0 || tol > 500) return "GPS tolerance must be between 0 and 500 meters.";
  return null;
}

export function useClockInManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("portal");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState("");
  const [geofenceFilter, setGeofenceFilter] = useState<"all" | "in-range" | "out-of-range">("all");
  const [locating, setLocating] = useState(false);

  const { data: settings = defaultSettings, isLoading: loadingSettings } = useQuery<ClockInSettings>({
    queryKey: ["clockInSettings"],
    queryFn: async () => {
      const res = await getClockInSettings();
      return { ...defaultSettings, ...res.settings };
    },
  });

  const { data: records = [], isLoading: loadingRecords, refetch: refetchRecords } = useQuery<any[]>({
    queryKey: ["clockInLogs", selectedDate],
    queryFn: async () => {
      const data = await getClockInsByDate(selectedDate);
      return Array.isArray(data) ? data : data ? [data] : [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: (newSettings: ClockInSettings) => updateClockInSettings(newSettings),
    onSuccess: (res) => {
      queryClient.setQueryData(["clockInSettings"], res.settings);
      toast.success(res.message || "Clock-in settings updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save settings.");
    },
  });

  const handleFetchCurrentLocation = async (currentFormSettings: ClockInSettings, updateForm: (updated: ClockInSettings) => void) => {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      updateForm({
        ...currentFormSettings,
        church_latitude: loc.latitude.toFixed(6),
        church_longitude: loc.longitude.toFixed(6),
      });
      toast.success("Coordinates captured from your device GPS!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to acquire GPS location.");
    } finally {
      setLocating(false);
    }
  };

  return {
    settings,
    loadingSettings,
    records,
    loadingRecords,
    activeTab, setActiveTab,
    selectedDate, setSelectedDate,
    searchQuery, setSearchQuery,
    geofenceFilter, setGeofenceFilter,
    locating,
    saving: updateMutation.isPending,
    saveSettings: (newSettings: ClockInSettings) => updateMutation.mutate(newSettings),
    handleFetchCurrentLocation,
    refetchRecords,
  };
}
