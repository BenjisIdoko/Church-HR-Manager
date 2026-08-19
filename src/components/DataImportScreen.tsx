import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Download,
  Users,
  Calendar,
  Cpu,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { processFileUpload, parseCSVText, CSVParseResult } from "../utils/csvParser";
import { DeviceImportRequest, importDeviceClockInRecords, importRecords } from "../utils/api";

type ImportStatus = "idle" | "validating" | "success" | "error";
type ImportType = "attendance" | "workers" | "device";

interface DataImportScreenProps {
  onImportComplete?: () => void | Promise<void>;
}

export function DataImportScreen({ onImportComplete }: DataImportScreenProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [importType, setImportType] = useState<ImportType>("attendance");
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [expandedWarnings, setExpandedWarnings] = useState<Set<number>>(new Set());
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
    if (selectedFile) {
      handleSelectedFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleSelectedFile(droppedFiles[0]);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    setStatus("validating");

    try {
      if (importType === "device") {
        const text = await file.text();
        const parsedRows = parseCSVText(text);
        if (parsedRows.length === 0) {
          throw new Error("CSV file must contain a header and at least one record.");
        }
        setParseResult({
          success: true,
          data: parsedRows,
          errors: [],
          warnings: [],
          summary: {
            totalRows: parsedRows.length,
            validRows: parsedRows.length,
            invalidRows: 0,
          },
        });
        setStatus("success");
      } else {
        const result = await processFileUpload(file, importType);
        setParseResult(result);
        setStatus(result.success ? "success" : "error");
      }
    } catch (error) {
      setStatus("error");
      setParseResult({
        success: false,
        data: [],
        errors: [{ row: 0, column: "file", message: `Processing error: ${error instanceof Error ? error.message : "Unknown error"}` }],
        warnings: [],
        summary: { totalRows: 0, validRows: 0, invalidRows: 0 },
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setImporting(true);

    try {
      if (importType === "device") {
        await handleDeviceClockInImport(file);
      } else {
        if (!parseResult?.success) return;

        const result = await importRecords(importType, parseResult.data);
        if (result.ok === false) {
          throw new Error(result.message || "Import failed");
        }

        toast.success(`Imported ${result.imported ?? parseResult.summary.validRows} records successfully!`);
        await onImportComplete?.();
        handleReset();
      }
    } catch (error) {
      toast.error(`Import error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDeviceClockInImport = async (fileToImport: File) => {
    setDeviceImportMessage(null);
    setDeviceImportError(null);

    try {
      const text = await fileToImport.text();
      const parsedRows = parseCSVText(text);

      if (parsedRows.length === 0) {
        throw new Error("CSV file must contain header and at least one record");
      }

      const records: DeviceImportRequest["records"] = [];
      for (const row of parsedRows) {
        const workerId = row["Worker ID"] || row.workerId || row.worker_id || "";
        const timestamp = row.Timestamp || row.timestamp || row.Date || row.date || "";
        const rawType = row.Type || row.type || "";
        const normalizedType = rawType.trim().toLowerCase();
        const type =
          normalizedType === "clock-in" || normalizedType === "in"
            ? "clock-in"
            : normalizedType === "clock-out" || normalizedType === "out"
            ? "clock-out"
            : null;

        if (!type) continue;
        if (!workerId.trim() || !timestamp.trim()) continue;

        records.push({
          workerId: workerId.trim(),
          timestamp: timestamp.trim(),
          type,
          deviceId: row["Device ID"] || row.deviceId || row.device_id || undefined,
        });
      }

      if (records.length === 0) {
        throw new Error("No valid device clock-in records found in CSV");
      }

      const result = await importDeviceClockInRecords({ records });
      setDeviceImportMessage(`${result.message} Successfully imported ${result.imported} device logs.`);
      toast.success(`Successfully imported ${result.imported} device clock-in logs!`);
      await onImportComplete?.();
      handleReset();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setDeviceImportError(msg);
      toast.error(`Device import error: ${msg}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setParseResult(null);
    setExpandedErrors(new Set());
    setExpandedWarnings(new Set());
    setDeviceImportMessage(null);
    setDeviceImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadSampleCSV = (type: "workers" | "attendance" | "device") => {
    let csvContent = "";
    let fileName = "";

    if (type === "workers") {
      csvContent = `Worker ID,Name,Email,Phone Number,Department,Role,Status
W001,Samuel Sonayon,samuel@church.org,08012345678,Media,superadmin,active
W002,Deborah Okafor,deborah@church.org,08087654321,Intercessors,manager,active
W003,John Doe,john@church.org,08099887766,Hospitality,member,active`;
      fileName = "Sample_Volunteers_Roster.csv";
    } else if (type === "attendance") {
      csvContent = `Worker ID,Worker Name,Date,Check In Time,Check Out Time,Status,Department
W001,Samuel Sonayon,2026-08-16,08:45,12:30,present,Media
W002,Deborah Okafor,2026-08-16,09:15,12:30,late,Intercessors
W003,John Doe,2026-08-16,,,absent,Hospitality`;
      fileName = "Sample_Service_Attendance.csv";
    } else {
      csvContent = `Worker ID,Timestamp,Type,Device ID
W001,2026-08-16T08:45:00Z,clock-in,DEV-KIOSK-01
W001,2026-08-16T12:30:00Z,clock-out,DEV-KIOSK-01
W002,2026-08-16T09:15:00Z,clock-in,DEV-KIOSK-02`;
      fileName = "Sample_Device_ClockIn_Logs.csv";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded template: ${fileName}`);
  };

  const toggleErrorExpanded = (index: number) => {
    const newSet = new Set(expandedErrors);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedErrors(newSet);
  };

  const toggleWarningExpanded = (index: number) => {
    const newSet = new Set(expandedWarnings);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedWarnings(newSet);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="gradient-hero-card p-6 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1c1917]">Import Ministry Records</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e0e7ff] px-3 py-0.5 text-xs font-semibold text-[#3730a3]">
              <Sparkles className="h-3.5 w-3.5 text-[#4f46e5]" /> Bulk Upload Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-[#78716c]">
            Upload volunteers rosters, service attendance logs, or biometrics hardware device exports seamlessly.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadSampleCSV("workers")}
            className="rounded-xl border-[#e7e2d8] text-xs hover:bg-[#e0e7ff]/30 text-slate-700"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#4f46e5]" />
            Volunteers CSV Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadSampleCSV("attendance")}
            className="rounded-xl border-[#e7e2d8] text-xs hover:bg-[#e0e7ff]/30 text-slate-700"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#4f46e5]" />
            Attendance CSV Template
          </Button>
        </div>
      </div>

      {/* Main Upload Card */}
      <Card className="border-0 shadow-xs bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-[#1c1917]">1. Select Data Type & File</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Choose what type of records you are uploading, then drag or select your file.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Data Type Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setImportType("attendance");
                setParseResult(null);
                setStatus("idle");
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                importType === "attendance"
                  ? "border-[#4f46e5] bg-[#e0e7ff]/30 shadow-xs ring-2 ring-[#4f46e5]/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${importType === "attendance" ? "bg-[#4f46e5] text-white" : "bg-slate-100 text-slate-600"}`}>
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1c1917]">Service Attendance</p>
                <p className="text-xs text-slate-500 mt-0.5">Logs for Thursday & Sunday services</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportType("workers");
                setParseResult(null);
                setStatus("idle");
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                importType === "workers"
                  ? "border-[#4f46e5] bg-[#e0e7ff]/30 shadow-xs ring-2 ring-[#4f46e5]/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${importType === "workers" ? "bg-[#4f46e5] text-white" : "bg-slate-100 text-slate-600"}`}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1c1917]">Volunteers Roster</p>
                <p className="text-xs text-slate-500 mt-0.5">Member info, emails & departments</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportType("device");
                setParseResult(null);
                setStatus("idle");
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                importType === "device"
                  ? "border-[#4f46e5] bg-[#e0e7ff]/30 shadow-xs ring-2 ring-[#4f46e5]/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${importType === "device" ? "bg-[#4f46e5] text-white" : "bg-slate-100 text-slate-600"}`}>
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1c1917]">Hardware Devices</p>
                <p className="text-xs text-slate-500 mt-0.5">Biometric clock-in CSV logs</p>
              </div>
            </button>
          </div>

          {/* Interactive Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer relative overflow-hidden ${
              isDragging
                ? "border-[#4f46e5] bg-[#e0e7ff]/30 scale-[1.01] shadow-lg shadow-[#4f46e5]/10"
                : file
                ? "border-[#4f46e5]/60 bg-[#e0e7ff]/20"
                : "border-slate-300 bg-gradient-to-b from-slate-50/50 to-white hover:border-[#4f46e5] hover:bg-[#e0e7ff]/10"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className={`p-4 rounded-2xl transition-transform ${isDragging ? "scale-110 bg-[#4f46e5] text-white" : "bg-[#e0e7ff] text-[#4f46e5]"}`}>
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="text-base font-bold text-[#1c1917]">
                  {isDragging ? "Drop your file here to upload" : "Click to upload or drag & drop"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports CSV, Excel (.xlsx, .xls) files up to 10MB
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <Badge variant="outline" className="border-slate-200 text-slate-600 bg-white text-[11px]">
                  UTF-8 CSV
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-600 bg-white text-[11px]">
                  Excel .xlsx
                </Badge>
              </div>
            </div>
          </div>

          {/* Active File Card */}
          {file && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[#4f46e5]/30 rounded-2xl bg-[#e0e7ff]/30">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 bg-[#4f46e5] text-white rounded-xl shrink-0">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1c1917] truncate text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {importType.toUpperCase()} MODE
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {status !== "validating" && !parseResult && (
                  <Button onClick={handleValidate} size="sm" className="bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-xs">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Validate & Preview
                  </Button>
                )}
                {status === "validating" && (
                  <Badge className="bg-[#4f46e5] text-white px-3 py-1 text-xs animate-pulse">
                    Validating File...
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleReset} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Feedback & Metrics Grid */}
      {parseResult && (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          {parseResult.success ? (
            <Alert className="border-[#4f46e5]/30 bg-[#e0e7ff]/30 text-[#3730a3] rounded-2xl p-4">
              <CheckCircle className="h-5 w-5 text-[#4f46e5] shrink-0" />
              <AlertDescription className="text-xs font-semibold ml-2">
                File validated successfully! {parseResult.summary.validRows} record(s) ready to import.
                {parseResult.warnings.length > 0 && ` (${parseResult.warnings.length} warning(s) detected).`}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="rounded-2xl p-4">
              <XCircle className="h-5 w-5 shrink-0" />
              <AlertDescription className="text-xs font-semibold ml-2">
                File validation failed with {parseResult.errors.length} error(s). Please review and fix issues before importing.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Metrics */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="summary" className="rounded-lg text-xs font-semibold">Summary Metrics</TabsTrigger>
              <TabsTrigger value="errors" className={`rounded-lg text-xs font-semibold ${parseResult.errors.length > 0 ? "text-red-600" : ""}`}>
                Errors ({parseResult.errors.length})
              </TabsTrigger>
              <TabsTrigger value="warnings" className={`rounded-lg text-xs font-semibold ${parseResult.warnings.length > 0 ? "text-amber-600" : ""}`}>
                Warnings ({parseResult.warnings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-3">
              <Card className="border-0 shadow-xs bg-white rounded-2xl">
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500 font-medium">Total Records</p>
                      <p className="text-2xl font-bold text-[#1c1917] mt-1">{parseResult.summary.totalRows}</p>
                    </div>
                    <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/60">
                      <p className="text-xs text-emerald-700 font-medium">Valid Records</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">{parseResult.summary.validRows}</p>
                    </div>
                    <div className="p-4 border border-rose-200 rounded-xl bg-rose-50/60">
                      <p className="text-xs text-rose-700 font-medium">Invalid Records</p>
                      <p className="text-2xl font-bold text-rose-600 mt-1">{parseResult.summary.invalidRows}</p>
                    </div>
                    <div className="p-4 border border-indigo-200 rounded-xl bg-indigo-50/60">
                      <p className="text-xs text-indigo-700 font-medium">File Size</p>
                      <p className="text-2xl font-bold text-indigo-600 mt-1">{file ? (file.size / 1024).toFixed(1) : 0} KB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors" className="mt-3">
              <Card className="border-0 shadow-xs bg-white rounded-2xl">
                <CardContent className="p-5">
                  {parseResult.errors.length === 0 ? (
                    <p className="text-center text-slate-500 text-xs py-6">No validation errors detected.</p>
                  ) : (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {parseResult.errors.map((error, idx) => (
                        <div key={idx} className="p-3 border border-rose-200 bg-rose-50/70 rounded-xl">
                          <button
                            type="button"
                            className="w-full text-left flex items-start gap-2"
                            onClick={() => toggleErrorExpanded(idx)}
                          >
                            <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-rose-800 text-xs">
                                Column: {error.column} (Row {error.row})
                              </p>
                              <p className="text-xs text-rose-700 mt-0.5">{error.message}</p>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="warnings" className="mt-3">
              <Card className="border-0 shadow-xs bg-white rounded-2xl">
                <CardContent className="p-5">
                  {parseResult.warnings.length === 0 ? (
                    <p className="text-center text-slate-500 text-xs py-6">No warnings detected.</p>
                  ) : (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {parseResult.warnings.map((warning, idx) => (
                        <div key={idx} className="p-3 border border-amber-200 bg-amber-50/70 rounded-xl">
                          <button
                            type="button"
                            className="w-full text-left flex items-start gap-2"
                            onClick={() => toggleWarningExpanded(idx)}
                          >
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-amber-800 text-xs">
                                Column: {warning.column} (Row {warning.row})
                              </p>
                              <p className="text-xs text-amber-700 mt-0.5">{warning.message}</p>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Data Preview Table */}
          {parseResult.data.length > 0 && (
            <Card className="border-0 shadow-xs bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <CardTitle className="text-base font-bold text-[#1c1917]">
                  2. Preview Records ({parseResult.data.slice(0, 5).length} of {parseResult.summary.validRows})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Review the first few records before finalizing the bulk import.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        {Object.keys(parseResult.data[0] || {}).map((key) => (
                          <TableHead key={key} className="text-xs font-bold text-slate-700 uppercase">{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.data.slice(0, 8).map((record, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/60 transition-colors">
                          {Object.values(record).map((val, cellIdx) => (
                            <TableCell key={cellIdx} className="text-xs text-slate-800 py-3 font-medium">
                              {String(val || "—")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleConfirmImport}
              disabled={(!parseResult.success && importType !== "device") || importing}
              className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl py-5 font-bold shadow-xs text-xs"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {importing ? "Processing Import..." : `Confirm & Commit Import (${parseResult.summary.validRows} records)`}
            </Button>
            <Button variant="outline" onClick={handleReset} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 py-5 text-xs">
              Cancel & Start Over
            </Button>
          </div>
        </div>
      )}

      {/* Format Requirements Guide */}
      <Card className="border-0 shadow-xs bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#4f46e5]" />
            <CardTitle className="text-base font-bold text-[#1c1917]">File Format Requirements Guide</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-[#1c1917] flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4 text-[#4f46e5]" /> Service Attendance
              </h4>
              <ul className="space-y-1 text-slate-600">
                <li><strong className="text-slate-800">Required:</strong> Worker ID, Worker Name, Date, Status</li>
                <li><strong className="text-slate-800">Optional:</strong> Check In Time, Check Out Time, Department</li>
                <li><strong className="text-slate-800">Date Format:</strong> YYYY-MM-DD (e.g. 2026-08-16)</li>
                <li><strong className="text-slate-800">Status Values:</strong> present, late, absent</li>
              </ul>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-[#1c1917] flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4 text-[#4f46e5]" /> Volunteers Roster
              </h4>
              <ul className="space-y-1 text-slate-600">
                <li><strong className="text-slate-800">Required:</strong> Worker ID, Name, Email, Phone Number, Department</li>
                <li><strong className="text-slate-800">Optional:</strong> Role, Status</li>
                <li><strong className="text-slate-800">Worker ID:</strong> W001, W002, etc.</li>
                <li><strong className="text-slate-800">Department:</strong> Supports comma-separated for multiple</li>
              </ul>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-[#1c1917] flex items-center gap-1.5 text-sm">
                <Cpu className="h-4 w-4 text-[#4f46e5]" /> Hardware Devices
              </h4>
              <ul className="space-y-1 text-slate-600">
                <li><strong className="text-slate-800">Required:</strong> Worker ID, Timestamp, Type</li>
                <li><strong className="text-slate-800">Optional:</strong> Device ID</li>
                <li><strong className="text-slate-800">Type:</strong> clock-in or clock-out</li>
                <li><strong className="text-slate-800">Timestamp:</strong> ISO 8601 (2026-08-16T08:45:00Z)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
