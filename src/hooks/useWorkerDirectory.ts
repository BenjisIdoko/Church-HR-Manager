import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Worker } from "../types/models";
import { sortData, SortConfig } from "../utils/tableUtils";

export interface UpdateHistoryEntry {
  workerId: string;
  workerName: string;
  timestamp: string;
  changes: string;
}

interface UseWorkerDirectoryProps {
  workers: Worker[];
  departments: string[];
  updateHistory: UpdateHistoryEntry[];
}

export function useWorkerDirectory({ workers, departments }: UseWorkerDirectoryProps) {
  const [searchParams] = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (urlSearchQuery) setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusFilter, roleFilter]);

  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    safeDepartments.forEach((d) => { if (d && d.trim()) set.add(d.trim()); });
    safeWorkers.forEach((w) => {
      if (w?.department) {
        w.department.split(",").forEach((d) => { if (d && d.trim()) set.add(d.trim()); });
      }
      if (Array.isArray(w?.departments)) {
        w.departments.forEach((d) => { if (d && d.trim()) set.add(d.trim()); });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [safeDepartments, safeWorkers]);

  const roleOptions = useMemo(
    () => Array.from(new Set(safeWorkers.map((w) => w?.role).filter((r): r is string => Boolean(r)))),
    [safeWorkers]
  );

  const filteredWorkers = useMemo(() => {
    return safeWorkers.filter((worker) => {
      if (!worker) return false;
      const workerDepts = Array.isArray(worker.departments)
        ? worker.departments
        : (worker.department || "").split(",").map((d) => d.trim()).filter(Boolean);

      const matchesSearch =
        !searchQuery ||
        (worker.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (worker.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (worker.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        workerDepts.some((dept) => dept.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDepartment =
        departmentFilter === "all" ||
        workerDepts.some((dept) => dept.toLowerCase() === departmentFilter.toLowerCase());

      const matchesStatus = statusFilter === "all" || worker.status === statusFilter;
      const matchesRole = roleFilter === "all" || worker.role === roleFilter;

      return matchesSearch && matchesDepartment && matchesStatus && matchesRole;
    });
  }, [safeWorkers, searchQuery, departmentFilter, statusFilter, roleFilter]);

  const sortedWorkers = useMemo(() => {
    return sortData(filteredWorkers, sortConfig);
  }, [filteredWorkers, sortConfig]);

  const totalPages = Math.ceil(sortedWorkers.length / pageSize) || 1;
  const paginatedWorkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedWorkers.slice(start, start + pageSize);
  }, [sortedWorkers, currentPage, pageSize]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setRoleFilter("all");
    setSortConfig(null);
  };

  return {
    searchQuery, setSearchQuery,
    departmentFilter, setDepartmentFilter,
    statusFilter, setStatusFilter,
    roleFilter, setRoleFilter,
    sortConfig,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    selectedWorker, setSelectedWorker,
    departmentOptions,
    roleOptions,
    filteredWorkers,
    sortedWorkers,
    paginatedWorkers,
    totalPages,
    handleSort,
    handleResetFilters,
  };
}
