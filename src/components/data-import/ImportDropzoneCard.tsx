import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import { ImportType } from "../../hooks/useDataImport";

interface ImportDropzoneCardProps {
  file: File | null;
  importType: ImportType;
  setImportType: (type: ImportType) => void;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onValidate: () => void;
  onRemoveFile: () => void;
}

export function ImportDropzoneCard({
  file,
  importType,
  setImportType,
  isDragging,
  fileInputRef,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onValidate,
  onRemoveFile,
}: ImportDropzoneCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Select Import Data Category</h2>
            <p className="text-xs text-slate-500">Choose the destination model for incoming CSV or Excel records.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <Button
              size="sm"
              variant={importType === "attendance" ? "default" : "ghost"}
              onClick={() => setImportType("attendance")}
              className={`rounded-lg text-xs font-bold ${importType === "attendance" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              Attendance Logs
            </Button>
            <Button
              size="sm"
              variant={importType === "workers" ? "default" : "ghost"}
              onClick={() => setImportType("workers")}
              className={`rounded-lg text-xs font-bold ${importType === "workers" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              Volunteer Roster
            </Button>
            <Button
              size="sm"
              variant={importType === "device" ? "default" : "ghost"}
              onClick={() => setImportType("device")}
              className={`rounded-lg text-xs font-bold ${importType === "device" ? "bg-indigo-600 text-white" : "text-slate-600"}`}
            >
              Biometric Device
            </Button>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50"
              : file
              ? "border-emerald-300 bg-emerald-50/30"
              : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center space-y-2">
              <FileSpreadsheet className="w-12 h-12 text-emerald-600" />
              <p className="text-sm font-bold text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500 font-mono">
                {(file.size / 1024).toFixed(1)} KB • Ready for validation
              </p>
              <div className="pt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" onClick={onValidate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                  Validate File Records
                </Button>
                <Button size="sm" variant="ghost" onClick={onRemoveFile} className="text-rose-600 hover:bg-rose-50 text-xs">
                  <Trash2 className="w-4 h-4" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Drag & Drop CSV or Excel Spreadsheet</p>
                <p className="text-xs text-slate-500 mt-1">Supports .csv, .xlsx, .xls up to 10MB</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl border-slate-200">
                Browse File System
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
