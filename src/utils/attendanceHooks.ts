/**
 * Custom hook for fetching attendance data
 * Supports both Jibble API and mock data fallback
 */

import { useState, useEffect } from "react";
import * as jibbleService from "./jibbleService";
import { mockAttendanceRecords } from "./mockData";

interface UseAttendanceOptions {
  useJibble?: boolean;
  fallbackToMock?: boolean;
  refetchInterval?: number; // milliseconds
}

interface AttendanceData {
  records: any[];
  loading: boolean;
  error: string | null;
  source: "jibble" | "mock";
  lastUpdated: Date | null;
}

/**
 * Hook to fetch attendance records from Jibble or mock data
 */
export function useAttendance(
  startDate: string,
  endDate: string,
  options: UseAttendanceOptions = {}
): AttendanceData {
  const {
    useJibble = process.env.REACT_APP_JIBBLE_ENABLED === "true",
    fallbackToMock = true,
    refetchInterval = 0,
  } = options;

  const [data, setData] = useState<AttendanceData>({
    records: [],
    loading: true,
    error: null,
    source: "mock",
    lastUpdated: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (useJibble) {
          // Try Jibble first
          const jibbleData = await jibbleService.getJibbleAttendance(startDate, endDate);
          if (jibbleData && jibbleData.length > 0) {
            setData({
              records: jibbleData,
              loading: false,
              error: null,
              source: "jibble",
              lastUpdated: new Date(),
            });
            return;
          }
        }

        // Fall back to mock data if Jibble fails or is disabled
        if (fallbackToMock) {
          const mockData = mockAttendanceRecords.filter(
            (r) => r.date >= startDate && r.date <= endDate
          );
          setData({
            records: mockData,
            loading: false,
            error: null,
            source: "mock",
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        console.error("Failed to fetch attendance data:", error);
        if (fallbackToMock) {
          const mockData = mockAttendanceRecords.filter(
            (r) => r.date >= startDate && r.date <= endDate
          );
          setData({
            records: mockData,
            loading: false,
            error: (error as Error).message,
            source: "mock",
            lastUpdated: new Date(),
          });
        } else {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: (error as Error).message,
          }));
        }
      }
    };

    fetchData();

    // Set up auto-refetch if interval is specified
    if (refetchInterval > 0) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [startDate, endDate, useJibble, fallbackToMock, refetchInterval]);

  return data;
}

/**
 * Hook to fetch employee attendance summary
 */
export function useAttendanceSummary(
  startDate: string,
  endDate: string,
  options: UseAttendanceOptions = {}
) {
  const { useJibble = process.env.REACT_APP_JIBBLE_ENABLED === "true", refetchInterval = 0 } =
    options;

  const [summary, setSummary] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0,
    source: "mock" as "jibble" | "mock",
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (useJibble) {
          const jibbleSummary = await jibbleService.getAttendanceSummary(startDate, endDate);
          setSummary({
            ...jibbleSummary,
            source: "jibble",
            loading: false,
            error: null,
          });
          return;
        }

        // Fallback to mock data calculation
        const records = mockAttendanceRecords.filter(
          (r) => r.date >= startDate && r.date <= endDate
        );
        const uniqueEmployees = new Set(records.map((r) => r.workerId)).size;
        const present = records.filter((r) => r.status === "present" || r.status === "late").length;
        const absent = uniqueEmployees - present;

        setSummary({
          totalEmployees: uniqueEmployees,
          presentToday: present,
          absentToday: absent,
          lateToday: records.filter((r) => r.status === "late").length,
          attendanceRate: uniqueEmployees > 0 ? Math.round((present / uniqueEmployees) * 100) : 0,
          source: "mock",
          loading: false,
          error: null,
        });
      } catch (error) {
        setSummary((prev) => ({
          ...prev,
          loading: false,
          error: (error as Error).message,
        }));
      }
    };

    fetchSummary();

    if (refetchInterval > 0) {
      const interval = setInterval(fetchSummary, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [startDate, endDate, useJibble, refetchInterval]);

  return summary;
}

/**
 * Hook to fetch employee real-time status
 */
export function useEmployeeStatus(employeeId: string, refetchInterval = 60000) {
  const [status, setStatus] = useState({
    isCheckedIn: false,
    lastCheckIn: null,
    lastCheckOut: null,
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const employeeStatus = await jibbleService.getEmployeeStatus(employeeId);
        setStatus({
          ...employeeStatus,
          loading: false,
          error: null,
        });
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          loading: false,
          error: (error as Error).message,
        }));
      }
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, refetchInterval);
    return () => clearInterval(interval);
  }, [employeeId, refetchInterval]);

  return status;
}

/**
 * Hook to fetch department-wise attendance
 */
export function useDepartmentAttendance(
  department: string,
  startDate: string,
  endDate: string,
  options: UseAttendanceOptions = {}
) {
  const {
    useJibble = process.env.REACT_APP_JIBBLE_ENABLED === "true",
    fallbackToMock = true,
    refetchInterval = 0,
  } = options;

  const [data, setData] = useState({
    records: [] as any[],
    loading: true,
    error: null as string | null,
    source: "mock" as "jibble" | "mock",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (useJibble) {
          const jibbleData = await jibbleService.getDepartmentAttendance(
            department,
            startDate,
            endDate
          );
          if (jibbleData && jibbleData.length > 0) {
            setData({
              records: jibbleData,
              loading: false,
              error: null,
              source: "jibble",
            });
            return;
          }
        }

        if (fallbackToMock) {
          const mockData = mockAttendanceRecords.filter(
            (r) => r.date >= startDate && r.date <= endDate && r.department === department
          );
          setData({
            records: mockData,
            loading: false,
            error: null,
            source: "mock",
          });
        }
      } catch (error) {
        console.error("Failed to fetch department attendance:", error);
        if (fallbackToMock) {
          const mockData = mockAttendanceRecords.filter(
            (r) => r.date >= startDate && r.date <= endDate && r.department === department
          );
          setData({
            records: mockData,
            loading: false,
            error: (error as Error).message,
            source: "mock",
          });
        }
      }
    };

    fetchData();

    if (refetchInterval > 0) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [department, startDate, endDate, useJibble, fallbackToMock, refetchInterval]);

  return data;
}
