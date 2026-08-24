import { useState } from "react";
import { toast } from "sonner";
import { Worker } from "../types/models";
import { getSystemCurrency, saveSystemCurrency } from "../utils/currencyUtils";

interface UseSettingsProps {
  departments: string[];
  workers?: Worker[];
  onAddDepartment: (department: string) => void;
  onEditDepartment?: (oldDepartment: string, newDepartment: string) => void;
  onRemoveDepartment?: (department: string) => void;
}

export function useSettings({
  departments,
  workers = [],
  onAddDepartment,
  onEditDepartment,
  onRemoveDepartment,
}: UseSettingsProps) {
  const [orgName, setOrgName] = useState("Church HR Manager");
  const [orgTagline, setOrgTagline] = useState("Empowering Ministry Excellence & Volunteer Leadership");
  const [orgAddress, setOrgAddress] = useState("Main Church Auditorium, 14 Allen Avenue, Ikeja, Lagos");
  const [orgPhone, setOrgPhone] = useState("+234 800 123 4567");
  const [orgEmail, setOrgEmail] = useState("contact@churchhr.org");
  const [timezone, setTimezone] = useState("Africa/Lagos (GMT+1)");
  const [currency, setCurrency] = useState(getSystemCurrency());

  const [adminName, setAdminName] = useState("Super Admin");
  const [adminEmail, setAdminEmail] = useState("admin@churchhr.org");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const [newDepartment, setNewDepartment] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");

  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);

  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemCurrency(currency);
    toast.success("Organization profile & system settings saved successfully!");
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    toast.success("Admin account credentials & preferences saved!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleAddDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.trim()) {
      toast.error("Please enter a valid department name.");
      return;
    }
    if (departments.some((d) => d.toLowerCase() === newDepartment.trim().toLowerCase())) {
      toast.error("Department already exists.");
      return;
    }
    onAddDepartment(newDepartment.trim());
    setNewDepartment("");
    toast.success("New department added successfully!");
  };

  const handleOpenEditDepartment = (dept: string) => {
    setEditingDepartment(dept);
    setEditDepartmentName(dept);
    setIsEditDeptModalOpen(true);
  };

  const handleSaveEditDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment || !editDepartmentName.trim()) return;

    const trimmedNew = editDepartmentName.trim();

    if (
      trimmedNew.toLowerCase() !== editingDepartment.toLowerCase() &&
      departments.some((d) => d.toLowerCase() === trimmedNew.toLowerCase())
    ) {
      toast.error(`Department "${trimmedNew}" already exists.`);
      return;
    }

    if (onEditDepartment) {
      onEditDepartment(editingDepartment, trimmedNew);
      toast.success(`Department updated to "${trimmedNew}".`);
    } else {
      toast.success(`Department renamed to "${trimmedNew}".`);
    }

    setIsEditDeptModalOpen(false);
    setEditingDepartment(null);
    setEditDepartmentName("");
  };

  const handleRemoveDepartmentClick = (dept: string) => {
    if (confirm(`Are you sure you want to remove the "${dept}" department?`)) {
      if (onRemoveDepartment) {
        onRemoveDepartment(dept);
        toast.success(`Department "${dept}" removed.`);
      } else {
        toast.info(`Department "${dept}" removal requested.`);
      }
    }
  };

  const getVolunteerCount = (deptName: string) => {
    if (!Array.isArray(workers)) return 0;
    return workers.filter((w) => w?.department && w.department.toLowerCase() === deptName.toLowerCase()).length;
  };

  const filteredDepartments = departments.filter((d) =>
    d.toLowerCase().includes(departmentSearch.toLowerCase().trim())
  );

  return {
    orgName, setOrgName,
    orgTagline, setOrgTagline,
    orgAddress, setOrgAddress,
    orgPhone, setOrgPhone,
    orgEmail, setOrgEmail,
    timezone, setTimezone,
    currency, setCurrency,
    adminName, setAdminName,
    adminEmail, setAdminEmail,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    emailNotifications, setEmailNotifications,
    smsNotifications, setSmsNotifications,
    whatsappReminders, setWhatsappReminders,
    securityAlerts, setSecurityAlerts,
    newDepartment, setNewDepartment,
    departmentSearch, setDepartmentSearch,
    editingDepartment, setEditingDepartment,
    editDepartmentName, setEditDepartmentName,
    isEditDeptModalOpen, setIsEditDeptModalOpen,
    handleSaveOrganization,
    handleSaveAccount,
    handleAddDepartmentSubmit,
    handleOpenEditDepartment,
    handleSaveEditDepartment,
    handleRemoveDepartmentClick,
    getVolunteerCount,
    filteredDepartments,
  };
}
