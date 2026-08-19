import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Check, ChevronDown, User, X } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Worker } from "../types/models";

interface SearchableWorkerSelectProps {
  workers: Worker[];
  value: string;
  onChange: (value: string, worker?: Worker) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  valueType?: "id" | "name";
}

export function SearchableWorkerSelect({
  workers = [],
  value,
  onChange,
  placeholder = "Search volunteer by name, department or role...",
  required = false,
  disabled = false,
  className = "",
  valueType = "id",
}: SearchableWorkerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find currently selected worker
  const selectedWorker = useMemo(() => {
    if (!value) return null;
    return workers.find((w) =>
      valueType === "id" ? String(w.id) === String(value) : w.name.toLowerCase() === value.toLowerCase()
    );
  }, [workers, value, valueType]);

  // Filter workers by search query
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return workers;
    const q = searchQuery.toLowerCase().trim();
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.department.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q) ||
        (w.id && String(w.id).toLowerCase().includes(q))
    );
  }, [workers, searchQuery]);

  const handleSelect = (worker: Worker) => {
    const newValue = valueType === "id" ? String(worker.id) : worker.name;
    onChange(newValue, worker);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button / Display Input */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border rounded-xl px-3.5 py-2.5 text-xs bg-white cursor-pointer transition-all ${
          isOpen ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-300 hover:border-slate-400"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          {selectedWorker ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-900 truncate">{selectedWorker.name}</span>
              <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-600 shrink-0">
                {selectedWorker.department}
              </Badge>
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedWorker && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Hidden input for HTML form validation */}
      <input
        type="text"
        value={value}
        onChange={() => {}}
        required={required}
        tabIndex={-1}
        className="opacity-0 absolute inset-0 pointer-events-none"
      />

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Box Input */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                autoFocus
                placeholder="Type name, department, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Volunteers List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredWorkers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No volunteers found matching "<span className="font-semibold">{searchQuery}</span>"
              </div>
            ) : (
              filteredWorkers.map((worker) => {
                const isSelected =
                  valueType === "id"
                    ? String(worker.id) === String(value)
                    : worker.name.toLowerCase() === value.toLowerCase();

                return (
                  <div
                    key={worker.id}
                    onClick={() => handleSelect(worker)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors text-xs ${
                      isSelected ? "bg-indigo-50 text-indigo-900 font-semibold" : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {worker.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{worker.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {worker.department} • {worker.role}
                        </p>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 text-center">
            Showing {filteredWorkers.length} of {workers.length} volunteers
          </div>
        </div>
      )}
    </div>
  );
}
