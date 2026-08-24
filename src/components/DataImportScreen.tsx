import { Badge } from "./ui/badge";
import { Upload } from "lucide-react";
import { useDataImport } from "../hooks/useDataImport";
import { ImportDropzoneCard } from "./data-import/ImportDropzoneCard";
import { ImportValidationPreview } from "./data-import/ImportValidationPreview";

interface DataImportScreenProps {
  onImportComplete?: () => void | Promise<void>;
}

export function DataImportScreen({ onImportComplete }: DataImportScreenProps) {
  const imp = useDataImport({ onImportComplete });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Data Import & Sync Engine</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold">
              CSV & Biometric Sync
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Import volunteer rosters, attendance spreadsheets, and biometric clock-in logs safely.
          </p>
        </div>
      </div>

      <ImportDropzoneCard
        file={imp.file}
        importType={imp.importType}
        setImportType={imp.setImportType}
        isDragging={imp.isDragging}
        fileInputRef={imp.fileInputRef}
        onFileChange={imp.handleFileChange}
        onDragOver={imp.handleDragOver}
        onDragLeave={imp.handleDragLeave}
        onDrop={imp.handleDrop}
        onValidate={imp.handleValidate}
        onRemoveFile={imp.handleRemoveFile}
      />

      {imp.parseResult && (
        <ImportValidationPreview
          parseResult={imp.parseResult}
          importing={imp.importing}
          onConfirmImport={imp.handleConfirmImport}
        />
      )}
    </div>
  );
}
