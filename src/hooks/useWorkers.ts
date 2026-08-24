import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWorkers, fetchAttendance, fetchKpis, saveWorker, renameDepartment } from "../utils/api";
import { Worker, AttendanceRecord } from "../types/models";

export function useWorkers(enabled = true) {
  const queryClient = useQueryClient();

  const workersQuery = useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: fetchWorkers,
    enabled,
  });

  const attendanceQuery = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance"],
    queryFn: fetchAttendance,
    enabled,
  });

  const kpisQuery = useQuery<{
    totalWorkers: number;
    attendanceToday: number;
    absent: number;
    lastSync: string;
  }>({
    queryKey: ["kpis"],
    queryFn: fetchKpis,
    enabled,
  });

  const updateWorkerMutation = useMutation({
    mutationFn: (worker: Worker) => saveWorker(worker),
    onSuccess: (updatedWorker) => {
      queryClient.setQueryData<Worker[]>(["workers"], (old = []) =>
        old.map((w) => (w.id === updatedWorker.id ? updatedWorker : w))
      );
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
    },
  });

  const renameDepartmentMutation = useMutation({
    mutationFn: ({ oldDept, newDept }: { oldDept: string; newDept: string }) =>
      renameDepartment(oldDept, newDept),
    onSuccess: (_, { oldDept, newDept }) => {
      queryClient.setQueryData<Worker[]>(["workers"], (old = []) =>
        old.map((w) =>
          w.department && w.department.toLowerCase() === oldDept.toLowerCase()
            ? { ...w, department: newDept }
            : w
        )
      );
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });

  const refreshAll = async () => {
    await Promise.all([
      workersQuery.refetch(),
      attendanceQuery.refetch(),
      kpisQuery.refetch(),
    ]);
  };

  return {
    workers: workersQuery.data || [],
    attendanceRecords: attendanceQuery.data || [],
    kpis: kpisQuery.data,
    lastSync: kpisQuery.data?.lastSync || null,
    isLoading: workersQuery.isLoading || attendanceQuery.isLoading,
    isError: workersQuery.isError || attendanceQuery.isError,
    error: workersQuery.error || attendanceQuery.error,
    updateWorker: updateWorkerMutation.mutateAsync,
    renameDepartment: renameDepartmentMutation.mutateAsync,
    refreshAll,
  };
}
