import { Asset, AssetMaintenance, AttendanceRecord, Visitor, Worker } from "../types/models";

// Explicit dev-only mock fallback flag (VITE_ENABLE_MOCK_DATA="true")
export const ENABLE_MOCK_FALLBACK =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_ENABLE_MOCK_DATA === "true");

export const MOCK_WORKERS: Worker[] = [
  { id: "W001", name: "Osarumeh Enobakhare", department: "Intercessors", role: "Member", status: "active", email: "osarumeh.enobakhare@churchhr.org", phone: "+234 800 000 0001" },
  { id: "W002", name: "Samuel Sonayon", department: "Intercessors", role: "Member", status: "active", email: "samuel.sonayon@churchhr.org", phone: "+234 800 000 0002" },
  { id: "W003", name: "Kehinde Ali-Balogun", department: "Intercessors", role: "Member", status: "active", email: "kehinde.ali.balogun@churchhr.org", phone: "+234 800 000 0003" },
  { id: "W004", name: "Austin Kyuinni", department: "Ushering", role: "Member", status: "active", email: "austin.kyuinni@churchhr.org", phone: "+234 800 000 0004" },
  { id: "W005", name: "Femi Tinuala", department: "Media", role: "Member", status: "active", email: "femi.tinuala@churchhr.org", phone: "+234 800 000 0005" },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: "1", workerId: "W001", workerName: "Osarumeh Enobakhare", department: "Intercessors", date: "2026-08-16", status: "absent" },
  { id: "2", workerId: "W002", workerName: "Samuel Sonayon", department: "Intercessors", date: "2026-08-16", status: "present" },
];

export const INITIAL_MOCK_VISITORS: Visitor[] = [
  {
    id: 101,
    name: "Emmanuel Chukwuemeka",
    email: "emmanuel.chukwu@gmail.com",
    phone: "+234 803 123 4567",
    first_visit_date: "2026-08-16",
    assigned_to: "W001",
    assigned_worker_name: "Osarumeh Enobakhare",
    status: "new",
    notes: "First time at Sunday service.",
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_MOCK_ASSETS: Asset[] = [
  {
    id: 1,
    asset_tag: "AST-1001",
    name: "Behringer X32 Digital Sound Console",
    category: "audio-visual",
    location: "Main Sanctuary Sound Booth",
    assigned_to: 1,
    assigned_worker_name: "Austin Kyuinni",
    status: "good",
    purchase_date: "2024-01-15",
    value: 3500,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_MAINTENANCE_LOGS: Record<number, AssetMaintenance[]> = {
  1: [
    {
      id: 1,
      asset_id: 1,
      service_date: "2024-05-12",
      cost: 150,
      performed_by: "SoundCraft Audio Repairs",
      notes: "Replaced antenna connector.",
    },
  ],
};
