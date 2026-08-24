import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { CSVParseResult } from "../../utils/csvParser";

interface ImportValidationPreviewProps {
  parseResult: CSVParseResult;
  importing: boolean;
  onConfirmImport: () => void;
}

export function ImportValidationPreview({
  parseResult,
  importing,
  onConfirmImport,
}: ImportValidationPreviewProps) {
  const previewRows = parseResult.data.slice(0, 5);
  const sampleKeys = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold">Validation Preview Summary</CardTitle>
          <p className="text-xs text-slate-500">
            Found {parseResult.summary.totalRows} valid rows ready to be committed into database tables.
          </p>
        </div>

        {parseResult.errors.length === 0 && (
          <Button
            onClick={onConfirmImport}
            disabled={importing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4" />
            {importing ? "Committing Import..." : "Confirm & Import Records"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {parseResult.errors.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" /> Validation Errors ({parseResult.errors.length})
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-rose-700">
              {parseResult.errors.slice(0, 3).map((err, idx) => (
                <li key={idx}>Row {err.row}: {err.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                {sampleKeys.map((key) => (
                  <TableHead key={key} className="font-bold text-slate-700 text-xs uppercase">
                    {key}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/80">
                  {sampleKeys.map((key) => (
                    <TableCell key={key} className="text-xs text-slate-700 font-medium">
                      {String(row[key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
