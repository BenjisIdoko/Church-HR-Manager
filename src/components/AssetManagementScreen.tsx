import { useEffect, useState } from "react";
import { Package, Wrench, ShieldAlert, Plus, Trash2, Search, DollarSign, MapPin, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Asset, AssetMaintenance, Worker } from "../types/models";
import { addAssetMaintenance, createAsset, deleteAsset, fetchAssetMaintenance, fetchAssets, updateAsset } from "../utils/api";
import { toast } from "sonner";
import { DatePicker } from "./ui/date-picker";
import { SearchableWorkerSelect } from "./SearchableWorkerSelect";
import { formatCurrency, getCurrencySymbol } from "../utils/currencyUtils";

interface AssetManagementScreenProps {
  workers: Worker[];
}

export function AssetManagementScreen({ workers }: AssetManagementScreenProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sysCurrency, setSysCurrency] = useState(() => getCurrencySymbol());

  useEffect(() => {
    const handleCurrencyChange = () => {
      setSysCurrency(getCurrencySymbol());
    };
    window.addEventListener("system-currency-changed", handleCurrencyChange);
    return () => window.removeEventListener("system-currency-changed", handleCurrencyChange);
  }, []);

  // Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Asset["category"]>("audio-visual");
  const [location, setLocation] = useState("Main Sanctuary");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState<Asset["status"]>("good");
  const [value, setValue] = useState("0");

  // Maintenance Log Modal State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState<AssetMaintenance[]>([]);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [cost, setCost] = useState("0");
  const [performedBy, setPerformedBy] = useState("Internal Technician");
  const [notes, setNotes] = useState("");

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await fetchAssets();
      setAssets(data);
    } catch {
      toast.error("Failed to load assets inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAssets();
  }, []);

  const handleOpenCreate = () => {
    setEditingAsset(null);
    setName("");
    setCategory("audio-visual");
    setLocation("Main Sanctuary");
    setAssignedTo("");
    setStatus("good");
    setValue("0");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setCategory(asset.category);
    setLocation(asset.location);
    setAssignedTo(asset.assigned_to ? String(asset.assigned_to) : "");
    setStatus(asset.status);
    setValue(String(asset.value));
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) {
      toast.error("Asset Name and Location are required");
      return;
    }

    const selectedWorker = workers.find((w) => String(w.id) === String(assignedTo));
    const assignedWorkerName = selectedWorker?.name;
    const parsedAssignedTo = assignedTo
      ? !isNaN(Number(assignedTo))
        ? Number(assignedTo)
        : (selectedWorker as any)?.dbId || assignedTo
      : undefined;

    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, {
          name,
          category,
          location,
          assigned_to: parsedAssignedTo as any,
          assigned_worker_name: assignedWorkerName,
          status,
          value: Number(value || 0),
        });
        toast.success("Asset updated successfully");
      } else {
        await createAsset({
          name,
          category,
          location,
          assigned_to: parsedAssignedTo as any,
          assigned_worker_name: assignedWorkerName,
          status,
          value: Number(value || 0),
        });
        toast.success("New asset created");
      }
      setIsModalOpen(false);
      await loadAssets();
    } catch {
      toast.error("Failed to save asset");
    }
  };

  const handleDeleteAsset = async (id: number) => {
    if (!confirm("Are you sure you want to delete this asset record?")) return;
    try {
      await deleteAsset(id);
      toast.success("Asset deleted");
      void loadAssets();
    } catch {
      toast.error("Failed to delete asset");
    }
  };

  const handleOpenMaintenance = async (asset: Asset) => {
    setSelectedAsset(asset);
    setIsMaintenanceOpen(true);
    try {
      const records = await fetchAssetMaintenance(asset.id);
      setMaintenanceLogs(records);
    } catch {
      toast.error("Failed to load maintenance logs");
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      await addAssetMaintenance(selectedAsset.id, {
        service_date: serviceDate,
        cost: Number(cost),
        performed_by: performedBy,
        notes,
      });
      toast.success("Maintenance log recorded");
      setCost("0");
      setNotes("");
      const updated = await fetchAssetMaintenance(selectedAsset.id);
      setMaintenanceLogs(updated);
    } catch {
      toast.error("Failed to add maintenance log");
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.assigned_worker_name && a.assigned_worker_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === "all" || a.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Church Asset & Equipment Management</h1>
          <p className="text-slate-500 text-sm">
            Track sound equipment, musical instruments, vehicles, furniture, and maintenance logs.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Plus className="w-4 h-4" /> Add New Asset
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Total Asset Inventory</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{assets.length} items</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Est. Total Asset Value</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalValue)}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              {sysCurrency}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Good Condition</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {assets.filter((a) => a.status === "good").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Needs Service / Repair</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {assets.filter((a) => a.status === "needs-repair" || a.status === "damaged").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Search asset name, tag number, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm bg-white font-medium text-slate-700 w-full sm:w-auto"
        >
          <option value="all">All Categories</option>
          <option value="audio-visual">Audio / Visual System</option>
          <option value="musical-instrument">Musical Instruments</option>
          <option value="furniture">Furniture & Fixtures</option>
          <option value="vehicle">Church Vehicles</option>
          <option value="facility">Building & Facilities</option>
        </select>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading asset inventory...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No assets matching search filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Asset Tag</th>
                  <th className="p-4">Equipment Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Custodian / Assigned</th>
                  <th className="p-4">Condition</th>
                  <th className="p-4">Est. Value</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-semibold text-xs text-slate-700">{asset.asset_tag}</td>
                    <td className="p-4 font-medium text-slate-900">{asset.name}</td>
                    <td className="p-4 capitalize text-xs text-slate-600">{asset.category.replace("-", " ")}</td>
                    <td className="p-4 text-xs text-slate-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {asset.location}
                    </td>
                    <td className="p-4 text-xs text-slate-700">{asset.assigned_worker_name || "Unassigned"}</td>
                    <td className="p-4">
                      <Badge
                        className={`text-xs capitalize ${
                          asset.status === "good"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : asset.status === "needs-repair"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : asset.status === "damaged"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        {asset.status.replace("-", " ")}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium text-slate-900 text-xs">{formatCurrency(asset.value)}</td>
                    <td className="p-4 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenMaintenance(asset)} className="h-8 px-2 text-xs" title="Maintenance Log">
                        <Wrench className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(asset)} className="h-8 px-2 text-xs">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteAsset(asset.id)} className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create/Edit Asset */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset Record" : "Add New Church Asset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAsset} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Equipment / Asset Name *</label>
              <Input placeholder="e.g. Behringer X32 Digital Mixer" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="audio-visual">Audio / Visual System</option>
                  <option value="musical-instrument">Musical Instruments</option>
                  <option value="furniture">Furniture & Fixtures</option>
                  <option value="vehicle">Church Vehicle</option>
                  <option value="facility">Building / Facility</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Status / Condition</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs"
                >
                  <option value="good">Good Working Condition</option>
                  <option value="needs-repair">Needs Repair / Maintenance</option>
                  <option value="damaged">Damaged / Out of Order</option>
                  <option value="disposed">Disposed / Replaced</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Location / Venue *</label>
                <Input placeholder="e.g. Main Sanctuary Sound Booth" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Custodian / Assigned Worker</label>
                <SearchableWorkerSelect
                  workers={workers}
                  value={assignedTo}
                  onChange={(val) => setAssignedTo(val)}
                  placeholder="Search & select custodian worker..."
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Estimated Value ({sysCurrency})</label>
              <Input type="number" placeholder="2500" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 text-white">
                {editingAsset ? "Update Asset" : "Save Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Maintenance Logs */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Maintenance Logs: {selectedAsset?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Form to log service */}
            <form onSubmit={handleAddMaintenance} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-800">Record Service or Repair</p>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker value={serviceDate} onChange={setServiceDate} />
                <Input placeholder={`Service Cost (${sysCurrency})`} type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <Input placeholder="Technician / Company Name" value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} required />
              <textarea
                placeholder="Service notes (e.g. replaced power cable, recalibrated faders)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2 min-h-[60px]"
              />
              <Button type="submit" size="sm" className="w-full bg-slate-900 text-white text-xs">
                Log Maintenance
              </Button>
            </form>

            {/* Logs list */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-slate-700">Maintenance History ({maintenanceLogs.length})</p>
              {maintenanceLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No maintenance logs recorded for this asset.</p>
              ) : (
                maintenanceLogs.map((m) => (
                  <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>Date: {m.service_date} • Tech: {m.performed_by}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(m.cost)}</span>
                    </div>
                    {m.notes ? <p className="text-slate-800">{m.notes}</p> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
