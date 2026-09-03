import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertCircle, Send } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import { DatePicker } from "./ui/date-picker";
import { submitAbsenceReport } from "../utils/api";

const ABSENCE_REASONS = [
  "School",
  "Work",
  "Health Issues",
  "Travelled",
  "Maternity",
  "Finance",
  "Others"
];

interface AbsenceNotificationProps {
  user?: { name?: string };
  worker?: { department?: string; dept?: string };
}

export function AbsenceNotification({ user, worker }: AbsenceNotificationProps = {}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    department: worker?.department || worker?.dept || "",
    reason: "",
    otherReason: "",
    dateFrom: "",
    dateTo: "",
    message: ""
  });
  const [error, setError] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user?.name || "",
        department: prev.department || worker?.department || worker?.dept || "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await submitAbsenceReport(formData);

      if (!result.ok) {
        throw new Error(result.message || 'Failed to submit absence notification');
      }

      toast.success('Absence notification submitted successfully!');
      setOpen(false);
      setFormData({
        name: "",
        department: "",
        reason: "",
        otherReason: "",
        dateFrom: "",
        dateTo: "",
        message: ""
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#dc5f3d] text-white shadow-sm hover:bg-[#c84f2f] focus-visible:ring-[#dc5f3d]">
          <AlertCircle className="h-4 w-4" />
          Report Absence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Absence</DialogTitle>
          <DialogDescription>
            Let us know if you won't be able to attend church services. This helps us plan accordingly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Your department"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {ABSENCE_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.reason === "Others" && (
            <div className="space-y-2">
              <Label htmlFor="otherReason">Please specify</Label>
              <Input
                id="otherReason"
                value={formData.otherReason}
                onChange={(e) => handleInputChange('otherReason', e.target.value)}
                placeholder="Please specify the reason"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date *</Label>
              <DatePicker
                value={formData.dateFrom}
                onChange={(val) => handleInputChange('dateFrom', val)}
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date (optional)</Label>
              <DatePicker
                value={formData.dateTo}
                onChange={(val) => handleInputChange('dateTo', val)}
                placeholder="Select end date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Any additional information or message..."
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
