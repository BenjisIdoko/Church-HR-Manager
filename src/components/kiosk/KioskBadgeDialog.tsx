import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Printer, ShieldCheck } from "lucide-react";

interface KioskBadgeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lastCheckin: {
    childName: string;
    parentName: string;
    parentPhone: string;
    securityCode: string;
    department: string;
    timestamp: string;
  } | null;
  onPrintBadge: () => void;
}

export function KioskBadgeDialog({
  isOpen,
  onOpenChange,
  lastCheckin,
  onPrintBadge,
}: KioskBadgeDialogProps) {
  if (!lastCheckin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 text-center border-indigo-200 shadow-2xl">
        <DialogHeader className="items-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">Check-In Complete!</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center space-y-2">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              {lastCheckin.department}
            </p>
            <h3 className="text-2xl font-black text-slate-900">{lastCheckin.childName}</h3>
            <p className="text-xs text-slate-600">
              Guardian: <strong>{lastCheckin.parentName}</strong> ({lastCheckin.parentPhone})
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white text-center space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              SECURITY PICKUP CODE
            </p>
            <p className="text-3xl font-black font-mono tracking-widest text-amber-400">
              {lastCheckin.securityCode}
            </p>
            <p className="text-[11px] text-slate-400">Required when picking up child after service.</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-1/2 rounded-xl"
          >
            Close & Done
          </Button>
          <Button
            onClick={onPrintBadge}
            className="w-full sm:w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold"
          >
            <Printer className="w-4 h-4" /> Print Badge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
