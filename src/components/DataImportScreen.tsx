import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { processFileUpload, parseCSVText, CSVParseResult, ValidationError, ValidationWarning } from "../utils/csvParser";
import { DeviceImportRequest, importDeviceClockInRecords } from "../utils/api";

type ImportStatus = "idle" | "validating" | "success" | "error";
type ImportType = "attendance" | "workers";

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
  const [deviceImportMessage, setDeviceImportMessage] = useState<string | null>(null);
  const [deviceImportError, setDeviceImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit");
        return;
      }
      
      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileName = selectedFile.name.toLowerCase();
      const hasValidType = validTypes.some((type) => fileName.endsWith(type));
      
      if (!hasValidType) {
        alert("Invalid file format. Please upload CSV or Excel files only.");
        return;
      }
      
      setFile(selectedFile);
      setStatus("idle");
      setParseResult(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    
    setStatus("validating");
    
    try {
      const result = await processFileUpload(file, importType);
      setParseResult(result);
      setStatus(result.success ? "success" : "error");
    } catch (error) {
      setStatus("error");
      setParseResult({
        success: false,
        data: [],
        errors: [{ row: 0, column: "file", message: `Error processing file: ${error instanceof Error ? error.message : "Unknown error"}` }],
        warnings: [],
        summary: { totalRows: 0, validRows: 0, invalidRows: 0 },
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult?.success) return;

    setImporting(true);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: importType,
          records: parseResult.data,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.ok === false) {
        throw new Error(result.message || 'Import failed');
      }

      alert(`Imported ${result.imported} records successfully!`);
      await onImportComplete?.();
      handleReset();
    } catch (error) {
      alert(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDeviceClockInImport = async (file: File) => {
    setDeviceImportMessage(null);
    setDeviceImportError(null);

    try {
      const text = await file.text();
      const parsedRows = parseCSVText(text);

      if (parsedRows.length === 0) {
        throw new Error('CSV file must contain header and at least one record');
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
        throw new Error('No valid records found in CSV');
      }

      const result = await importDeviceClockInRecords({ records });
      setDeviceImportMessage(`${result.message} Successfully imported ${result.imported} records.`);
      await onImportComplete?.();
    } catch (error) {
      setDeviceImportError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setParseResult(null);
    setExpandedErrors(new Set());
    setExpandedWarnings(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-600">Present</Badge>;
      case "late":
        return <Badge className="bg-yellow-600">Late</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1>Import Data</h1>
        <p className="text-muted-foreground">
          Upload CSV or Excel files for attendance or worker records
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Select a CSV or Excel file containing records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importType"
                value="attendance"
                checked={importType === "attendance"}
                onChange={(e) => setImportType(e.target.value as ImportType)}
              />
              <span>Attendance Data</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="importType"
                value="workers"
                checked={importType === "workers"}
                onChange={(e) => setImportType(e.target.value as ImportType)}
              />
              <span>Workers List</span>
            </label>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-muted-foreground">
                CSV or Excel files (MAX. 10MB)
              </p>
            </label>
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <FileSpreadsheet className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {status !== "validating" && (
                  <Button onClick={handleValidate} size="sm">
                    Validate File
                  </Button>
                )}
                {status === "validating" && (
                  <Badge variant="secondary">Validating...</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Clock-In Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import Clock-In Records from Device</CardTitle>
          <CardDescription>
            Import attendance data from traditional clock-in devices using CSV format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
            <p className="text-sm font-medium mb-2">Expected CSV Format:</p>
            <code className="text-xs block whitespace-pre-wrap font-mono p-2 bg-white dark:bg-slate-900 rounded border">
{`Worker ID,Timestamp,Type
W001,2024-05-26T09:00:00Z,clock-in
W001,2024-05-26T17:30:00Z,clock-out
W002,2024-05-26T08:45:00Z,clock-in`}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              • Worker ID: Must match existing worker records
              • Timestamp: ISO 8601 format (e.g., 2024-05-26T09:00:00Z)
              • Type: Either "clock-in" or "clock-out"
            </p>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleDeviceClockInImport(file);
                }
              }}
              className="hidden"
              id="device-clock-in-upload"
            />
            <label htmlFor="device-clock-in-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="mb-2">Click to upload CSV file</p>
              <p className="text-sm text-muted-foreground">CSV format only (MAX. 10MB)</p>
            </label>
          </div>

          {deviceImportMessage && (
            <Alert>
              <AlertDescription>{deviceImportMessage}</AlertDescription>
            </Alert>
          )}
          {deviceImportError && (
            <Alert variant="destructive">
              <AlertDescription>{deviceImportError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Validation Feedback */}
      {parseResult && (
        <>
          {parseResult.success && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                File validated successfully! {parseResult.summary.validRows} valid records found.
                {parseResult.warnings.length > 0 && ` ${parseResult.warnings.length} warnings detected.`}
              </AlertDescription>
            </Alert>
          )}

          {!parseResult.success && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                File validation failed. {parseResult.errors.length} errors found. Please review and correct the file.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Details */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="errors" className={parseResult.errors.length > 0 ? "text-red-600" : ""}>
                Errors ({parseResult.errors.length})
              </TabsTrigger>
              <TabsTrigger value="warnings" className={parseResult.warnings.length > 0 ? "text-yellow-600" : ""}>
                Warnings ({parseResult.warnings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold">{parseResult.summary.totalRows}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                      <p className="text-sm text-muted-foreground">Valid Records</p>
                      <p className="text-2xl font-bold text-green-600">{parseResult.summary.validRows}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-950">
                      <p className="text-sm text-muted-foreground">Invalid Records</p>
                      <p className="text-2xl font-bold text-red-600">{parseResult.summary.invalidRows}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                      <p className="text-sm text-muted-foreground">File Size</p>
                      <p className="text-2xl font-bold text-blue-600">{file ? (file.size / 1024).toFixed(1) : 0} KB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="errors">
              <Card>
                <CardContent className="pt-6">
                  {parseResult.errors.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No errors found</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {parseResult.errors.map((error, idx) => (
                        <div key={idx} className="p-3 border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 rounded-lg">
                          <button
                            className="w-full text-left flex items-start gap-2 hover:opacity-70"
                            onClick={() => toggleErrorExpanded(idx)}
                          >
                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-red-700 dark:text-red-400">
                                {error.column} (Row {error.row})
                              </p>
                              {expandedErrors.has(idx) && (
                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error.message}</p>
                              )}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="warnings">
              <Card>
                <CardContent className="pt-6">
                  {parseResult.warnings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No warnings found</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {parseResult.warnings.map((warning, idx) => (
                        <div key={idx} className="p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 rounded-lg">
                          <button
                            className="w-full text-left flex items-start gap-2 hover:opacity-70"
                            onClick={() => toggleWarningExpanded(idx)}
                          >
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                                {warning.column} (Row {warning.row})
                              </p>
                              {expandedWarnings.has(idx) && (
                                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">{warning.message}</p>
                              )}
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

          {/* Data Preview */}
          {parseResult.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview ({parseResult.data.slice(0, 5).length} of {parseResult.summary.validRows})</CardTitle>
                <CardDescription>
                  First few records to be imported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(parseResult.data[0] || {}).map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.data.slice(0, 5).map((record, idx) => (
                        <TableRow key={idx}>
                          {Object.values(record).map((value, idx) => (
                            <TableCell key={idx} className="text-sm">{String(value)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleConfirmImport}
              disabled={!parseResult.success || importing}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : `Confirm Import (${parseResult.summary.validRows} records)`}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {/* Import Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            File Format Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Attendance Data</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Required columns: Worker ID, Worker Name, Date, Status</li>
                <li>• Optional columns: Check In Time, Check Out Time, Department</li>
                <li>• Date format: YYYY-MM-DD (e.g., 2025-01-16)</li>
                <li>• Time format: HH:MM (e.g., 09:30)</li>
                <li>• Status values: present, late, or absent</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Workers List</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Required columns: Worker ID, Name, Email, Phone Number, Department</li>
                <li>• Optional columns: Role, Status</li>
                <li>• Worker ID format: W followed by numbers (e.g., W001)</li>
                <li>• Email must be valid format (e.g., user@domain.com)</li>
                <li>• Phone must contain at least 10 digits</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">General Requirements</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• File format: CSV or Excel (.csv, .xlsx, .xls)</li>
                <li>• Maximum file size: 10MB</li>
                <li>• Encoding: UTF-8 recommended</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
