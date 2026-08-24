import { useState, useRef } from "react";
import { toast } from "sonner";
import { processFileUpload, CSVParseResult } from "../utils/csvParser";
import { DeviceImportRequest, importDeviceClockInRecords, importRecords } from "../utils/api";

export type ImportStatus = "idle" | "validating" | "success" | "error";
export type ImportType = "attendance" | "workers" | "device";

interface UseDataImportProps {
  onImportComplete?: () => void | Promise<void>;
}

export function useDataImport({ onImportComplete }: UseDataImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [importType, setImportType] = useState<ImportType>("attendance");
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [deviceImportMessage, setDeviceImportMessage] = useState<string | null>(null);
  const [deviceImportError, setDeviceImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectedFile = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    const validTypes = [".csv", ".xlsx", ".xls"];
    const fileName = selectedFile.name.toLowerCase();
    const hasValidType = validTypes.some((type) => fileName.endsWith(type));

    if (!hasValidType) {
      toast.error("Invalid file format. Please upload CSV or Excel (.xlsx, .xls) files only.");
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setParseResult(null);
    setDeviceImportMessage(null);
    setDeviceImportError(null);
    toast.success(`Selected file: ${selectedFile.name}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleSelectedFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleSelectedFile(droppedFile);
  };

  const handleValidate = async () => {
    if (!file) {
      toast.error("Please select a file to validate.");
      return;
    }

    setStatus("validating");
    try {
      const csvCategory = importType === "workers" ? "workers" : "attendance";
      const result = await processFileUpload(file, csvCategory);
      setParseResult(result);
      if (result.errors.length > 0) {
        setStatus("error");
        toast.error(`Validation found ${result.errors.length} critical errors.`);
      } else {
        setStatus("success");
        toast.success(`File validated successfully! ${result.summary.totalRows} valid rows ready for import.`);
      }
    } catch {
      setStatus("error");
      toast.error("Failed to parse and validate file.");
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.errors.length > 0) {
      toast.error("Cannot import file with validation errors.");
      return;
    }

    setImporting(true);
    setDeviceImportMessage(null);
    setDeviceImportError(null);

    try {
      if (importType === "device") {
        const payloadRecords: DeviceImportRequest["records"] = parseResult.data.map((row: any) => ({
          workerId: row.workerId || row.worker_id || row.Id || row.ID || undefined,
          worker_name: row.workerName || row.worker_name || row.Name || row.name || undefined,
          timestamp: row.timestamp || row.Timestamp || row.date || new Date().toISOString(),
          type: (row.type || row.Type || "clock-in").toString().toLowerCase().includes("out") ? "clock-out" : "clock-in",
        }));

        const result = await importDeviceClockInRecords({ records: payloadRecords });
        setDeviceImportMessage(`Device import processed. Imported: ${result.imported || 0}`);
        toast.success("Device clock-in records imported successfully!");
      } else {
        await importRecords(importType, parseResult.data);
        toast.success(`Successfully imported ${parseResult.summary.totalRows} ${importType} records!`);
      }

      if (onImportComplete) await onImportComplete();
      setFile(null);
      setParseResult(null);
      setStatus("idle");
    } catch (err: any) {
      const msg = err?.message || "Import failed. Please try again.";
      setDeviceImportError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setStatus("idle");
    setParseResult(null);
    setDeviceImportMessage(null);
    setDeviceImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return {
    file,
    status,
    importType, setImportType,
    parseResult,
    importing,
    isDragging,
    deviceImportMessage,
    deviceImportError,
    fileInputRef,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleValidate,
    handleConfirmImport,
    handleRemoveFile,
  };
}
