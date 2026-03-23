import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import {
  FileText, Plus, Clock, AlertCircle, Edit, Trash2, Eye, Phone, Download, Info,
  Calendar, AlertOctagon, AlertTriangle, CheckCircle, Filter, X, Gauge,
  TrendingUp, TrendingDown, Activity, Bell, Shield, CalendarDays,
  Clock3, Clock4, Clock9, Sparkles, Star, Flame, Upload, FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const documentTypes = ['Insurance', 'PUC', 'Fitness', 'RC', 'Permit', 'Custom'];

// Expiry status categories
const EXPIRY_STATUS = {
  EXPIRED: { label: 'Expired', color: 'rose', icon: AlertOctagon, days: 0, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CRITICAL: { label: 'Critical', color: 'red', icon: Flame, days: 3, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  URGENT: { label: 'Urgent', color: 'orange', icon: AlertTriangle, days: 7, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  WARNING: { label: 'Warning', color: 'amber', icon: AlertCircle, days: 15, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SOON: { label: 'Expiring Soon', color: 'yellow', icon: Clock, days: 30, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  SAFE: { label: 'Safe', color: 'emerald', icon: CheckCircle, days: 31, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

// Expiry Status Badge Component
const ExpiryStatusBadge = ({ daysLeft, size = "md" }) => {
  const getStatus = () => {
    if (daysLeft <= 0) return EXPIRY_STATUS.EXPIRED;
    if (daysLeft <= 3) return EXPIRY_STATUS.CRITICAL;
    if (daysLeft <= 7) return EXPIRY_STATUS.URGENT;
    if (daysLeft <= 15) return EXPIRY_STATUS.WARNING;
    if (daysLeft <= 30) return EXPIRY_STATUS.SOON;
    return EXPIRY_STATUS.SAFE;
  };

  const status = getStatus();
  const Icon = status.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  const colorClasses = {
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    red: "bg-red-100 text-red-700 border-red-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200"
  };

  return (
    <Badge className={`${colorClasses[status.color]} ${sizeClasses[size]} flex items-center gap-1 border font-medium`}>
      <Icon size={size === "sm" ? 12 : 14} />
      {status.label} {daysLeft > 0 && `(${daysLeft}d)`}
    </Badge>
  );
};

// Expiry Progress Bar Component
const ExpiryProgress = ({ expiryDate, issueDate }) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const issue = new Date(issueDate);

  const totalDuration = expiry - issue;
  const elapsed = today - issue;
  const percentageLeft = Math.max(0, Math.min(100, 100 - (elapsed / totalDuration * 100)));
  const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  const getProgressColor = () => {
    if (daysLeft <= 0) return "bg-rose-500";
    if (daysLeft <= 3) return "bg-red-500";
    if (daysLeft <= 7) return "bg-orange-500";
    if (daysLeft <= 15) return "bg-amber-500";
    if (daysLeft <= 30) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getStatusText = () => {
    if (daysLeft <= 0) return "Expired";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-600">
        <span>Expires in</span>
        <span className={`font-medium ${daysLeft <= 0 ? 'text-rose-600' :
          daysLeft <= 3 ? 'text-red-600' :
            daysLeft <= 7 ? 'text-orange-600' :
              daysLeft <= 15 ? 'text-amber-600' :
                daysLeft <= 30 ? 'text-yellow-600' : 'text-emerald-600'
          }`}>
          {getStatusText()}
        </span>
      </div>
      <Progress value={percentageLeft} className={`h-2 ${getProgressColor()}`} />
    </div>
  );
};

// Expiry Summary Card Component
const ExpirySummaryCard = ({ title, count, icon: Icon, color, onClick, total }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  const colorClasses = {
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      textLight: 'text-rose-600',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      progress: 'bg-rose-600',
      progressBg: 'bg-rose-200'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      textLight: 'text-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      progress: 'bg-red-600',
      progressBg: 'bg-red-200'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      textLight: 'text-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      progress: 'bg-orange-600',
      progressBg: 'bg-orange-200'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      textLight: 'text-amber-600',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      progress: 'bg-amber-600',
      progressBg: 'bg-amber-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      textLight: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      progress: 'bg-yellow-600',
      progressBg: 'bg-yellow-200'
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      textLight: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      progress: 'bg-emerald-600',
      progressBg: 'bg-emerald-200'
    }
  };

  const classes = colorClasses[color] || colorClasses.emerald;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer ${classes.bg} border ${classes.border} rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`${classes.text} text-sm font-medium mb-1`}>{title}</p>
          <p className={`${classes.text} text-3xl font-bold`}>{count}</p>
          <p className={`${classes.textLight} text-xs mt-1`}>{percentage}% of total</p>
        </div>
        <div className={`p-3 ${classes.iconBg} rounded-xl`}>
          <Icon size={24} className={classes.iconColor} />
        </div>
      </div>
      <div className={`mt-3 w-full ${classes.progressBg} rounded-full h-1.5`}>
        <div
          className={`${classes.progress} h-1.5 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </motion.div>
  );
};

// Document Form Component
const DocumentForm = ({
  formData,
  vehicles,
  autoFillMessage,
  dateOverlapWarning,
  dateValidationError,
  phoneWarning,
  uploadedFile,
  uploading,
  isAutoFilling,
  onVehicleChange,
  onDocumentTypeChange,
  onInputChange,
  onIssueDateChange,
  onExpiryDateChange,
  onDocumentUpload,
  onPhoneChange,
  onSubmit,
  submitText
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {autoFillMessage && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 text-sm">
            {autoFillMessage}
          </AlertDescription>
        </Alert>
      )}

      {dateOverlapWarning && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 text-sm">
            {dateOverlapWarning}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label>Vehicle *</Label>
        <Select
          value={formData.vehicle_id}
          onValueChange={onVehicleChange}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.registration_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Document Type *</Label>
          <Select
            value={formData.document_type}
            onValueChange={onDocumentTypeChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.document_type === 'Custom' && (
          <div>
            <Label>Document Name *</Label>
            <Input
              required
              value={formData.custom_document_name}
              onChange={(e) => onInputChange('custom_document_name', e.target.value)}
            />
          </div>
        )}

        <div>
          <Label>Policy/Document Number *</Label>
          <Input
            required
            value={formData.policy_number}
            onChange={(e) => onInputChange('policy_number', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Provider *</Label>
        <Input
          required
          value={formData.provider}
          onChange={(e) => onInputChange('provider', e.target.value)}
          placeholder="e.g., ICICI Lombard, HDFC Ergo"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Issue Date *</Label>
          <Input
            type="date"
            required
            value={formData.issue_date}
            onChange={(e) => onIssueDateChange(e.target.value)}
          />
        </div>
        <div>
          <Label>Expiry Date *</Label>
          <Input
            type="date"
            required
            value={formData.expiry_date}
            onChange={(e) => onExpiryDateChange(e.target.value)}
          />
        </div>
        {dateValidationError && (
          <p className="text-amber-600 text-sm mt-1 col-span-2">
            ⚠️ {dateValidationError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>
            {formData.document_type === "Insurance" ? "Premium (Rs)" : "Fee (Rs)"}
          </Label>
          <Input
            type="number"
            step="0.01"
            value={formData.premium}
            placeholder={
              formData.document_type === "Insurance"
                ? "Insurance premium amount"
                : "Document fee amount"
            }
            onChange={(e) => onInputChange('premium', e.target.value)}
          />
        </div>
        <div>
          <Label>Coverage</Label>
          <Input
            value={formData.coverage}
            onChange={(e) => onInputChange('coverage', e.target.value)}
            placeholder="e.g., Comprehensive, Third Party"
          />
        </div>
      </div>

      <div>
        <Label>Phone Number</Label>
        <Input
          type="tel"
          value={formData.phone_number}
          maxLength={10}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '');
            onPhoneChange(value);
          }}
        />
        {phoneWarning && (
          <p className="text-red-600 text-sm mt-1">{phoneWarning}</p>
        )}
      </div>

      <div>
        <Label>Upload Document</Label>
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={onDocumentUpload}
          disabled={uploading}
        />
        <p className="text-xs text-gray-500 mt-1">Max file size: 3MB</p>

        {uploading && (
          <p className="text-sm text-blue-600 mt-1">Uploading file...</p>
        )}

        {uploadedFile && (
          <div className="mt-3">
            {uploadedFile.includes(".pdf") || uploadedFile.includes("/raw/") ? (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                <FileText size={20} className="text-blue-600" />
                <span className="text-sm">PDF Document</span>
              </div>
            ) : (
              <img src={uploadedFile} alt="Preview" className="w-32 rounded border" />
            )}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={uploading || !uploadedFile || isAutoFilling}
        className="w-full bg-blue-800 hover:bg-blue-900 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : submitText}
      </Button>
    </form>
  );
};

export const DocumentsPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedDocHistory, setSelectedDocHistory] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [phoneWarning, setPhoneWarning] = useState("");
  const [dateOverlapWarning, setDateOverlapWarning] = useState("");
  const [autoFillMessage, setAutoFillMessage] = useState("");
  const [previousVersion, setPreviousVersion] = useState(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expiryStats, setExpiryStats] = useState({
    expired: 0,
    critical: 0,
    urgent: 0,
    warning: 0,
    soon: 0,
    safe: 0
  });

  const [formData, setFormData] = useState({
    vehicle_id: '',
    document_type: 'Insurance',
    custom_document_name: '',
    policy_number: '',
    provider: '',
    phone_number: '',
    issue_date: '',
    expiry_date: '',
    premium: '',
    coverage: '',
    status: 'Active',
    file_url: ''
  });

  const [dateValidationError, setDateValidationError] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedVehicle]);

  useEffect(() => {
    calculateExpiryStats();
  }, [documents]);

  const fetchData = async () => {
    try {
      const filter = selectedVehicle !== 'all' ? `?vehicle_id=${selectedVehicle}` : '';
      const [vehiclesRes, docsRes] = await Promise.all([
        api.get('/vehicles'),
        api.get(`/vehicle-documents${filter}`)
      ]);

      setVehicles(vehiclesRes.data.data);
      setDocuments(docsRes.data.data);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateExpiryStats = () => {
    const stats = {
      expired: 0,
      critical: 0,
      urgent: 0,
      warning: 0,
      soon: 0,
      safe: 0
    };

    documents.forEach(doc => {
      const daysLeft = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) stats.expired++;
      else if (daysLeft <= 3) stats.critical++;
      else if (daysLeft <= 7) stats.urgent++;
      else if (daysLeft <= 15) stats.warning++;
      else if (daysLeft <= 30) stats.soon++;
      else stats.safe++;
    });

    setExpiryStats(stats);
  };

  const getFilteredDocuments = () => {
    if (selectedFilter === 'all') return documents;

    return documents.filter(doc => {
      const daysLeft = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

      switch (selectedFilter) {
        case 'expired':
          return daysLeft <= 0;
        case 'critical':
          return daysLeft > 0 && daysLeft <= 3;
        case 'urgent':
          return daysLeft > 3 && daysLeft <= 7;
        case 'warning':
          return daysLeft > 7 && daysLeft <= 15;
        case 'soon':
          return daysLeft > 15 && daysLeft <= 30;
        case 'safe':
          return daysLeft > 30;
        default:
          return true;
      }
    });
  };

  const checkPreviousVersion = async (vehicleId, documentType) => {
    if (!vehicleId || !documentType) return null;

    try {
      const response = await api.get(`/vehicle-documents?vehicle_id=${vehicleId}&current_only=false`);
      const allDocs = response.data.data;

      const typeDocs = allDocs
        .filter(doc => doc.document_type === documentType && doc.is_current)
        .sort((a, b) => b.version - a.version);

      return typeDocs.length > 0 ? typeDocs[0] : null;
    } catch (error) {
      console.error("Error checking previous version:", error);
      return null;
    }
  };

  const validateDateOverlap = (newIssueDate, newExpiryDate, previousDoc) => {
    if (!previousDoc || !newIssueDate || !newExpiryDate) return "";

    const prevExpiry = new Date(previousDoc.expiry_date);
    const newIssue = new Date(newIssueDate);

    if (newIssue < prevExpiry) {
      const daysBeforeExpiry = Math.ceil((prevExpiry - newIssue) / (1000 * 60 * 60 * 24));
      return `Warning: New document starts ${daysBeforeExpiry} days before the previous version expires on ${prevExpiry.toLocaleDateString()}. This may create an overlap period.`;
    }

    return "";
  };

  const validateDates = useCallback(() => {
    if (!formData.issue_date || !formData.expiry_date) {
      setDateValidationError('');
      return true;
    }

    const issue = new Date(formData.issue_date);
    const expiry = new Date(formData.expiry_date);

    if (expiry <= issue) {
      setDateValidationError('Expiry date must be after issue date');
      return false;
    }

    const diffMonths =
      (expiry.getFullYear() - issue.getFullYear()) * 12 +
      (expiry.getMonth() - issue.getMonth());

    let valid = true;
    let message = '';

    switch (formData.document_type) {
      case 'Insurance':
        if (diffMonths !== 12) {
          valid = false;
          message = 'Insurance validity should be exactly 1 year.';
        }
        break;
      case 'PUC':
        if (diffMonths !== 6) {
          valid = false;
          message = 'PUC (Pollution) certificate is usually valid for 6 months.';
        }
        break;
      case 'Fitness':
        if (diffMonths !== 12) {
          valid = false;
          message = 'Fitness certificate is usually valid for 1 year.';
        }
        break;
      case 'Permit':
        if (diffMonths !== 60) {
          valid = false;
          message = 'Permit validity is usually around 5 years.';
        }
        break;
      case 'RC':
        if (diffMonths !== 180) {
          valid = false;
          message = 'RC validity is usually around 15 years.';
        }
        break;
      default:
        valid = true;
    }

    setDateValidationError(valid ? '' : message);
    return valid;
  }, [formData.issue_date, formData.expiry_date, formData.document_type]);

  const handleVehicleChange = async (vehicleId) => {
    setIsAutoFilling(true);
    setFormData(prev => ({ ...prev, vehicle_id: vehicleId }));

    if (vehicleId && formData.document_type) {
      const prevVersion = await checkPreviousVersion(vehicleId, formData.document_type);
      setPreviousVersion(prevVersion);

      if (prevVersion) {
        const nextIssueDate = new Date(prevVersion.expiry_date);
        nextIssueDate.setDate(nextIssueDate.getDate() + 1);

        const nextExpiryDate = new Date(nextIssueDate);
        if (formData.document_type === 'Insurance') {
          nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 1);
        } else if (formData.document_type === 'PUC') {
          nextExpiryDate.setMonth(nextExpiryDate.getMonth() + 6);
        } else if (formData.document_type === 'Fitness') {
          nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 1);
        } else if (formData.document_type === 'Permit') {
          nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 5);
        } else if (formData.document_type === 'RC') {
          nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 15);
        }

        setFormData(prev => ({
          ...prev,
          policy_number: prevVersion.policy_number,
          provider: prevVersion.provider,
          premium: prevVersion.premium?.toString() || '',
          coverage: prevVersion.coverage || '',
          issue_date: nextIssueDate.toISOString().split('T')[0],
          expiry_date: nextExpiryDate.toISOString().split('T')[0]
        }));

        setAutoFillMessage(
          `Auto-filled from previous version (v${prevVersion.version}). ` +
          `Previous expiry was ${new Date(prevVersion.expiry_date).toLocaleDateString()}. ` +
          `You can edit these values before submission.`
        );
      }
    }
    setIsAutoFilling(false);
  };

  const handleDocumentTypeChange = async (docType) => {
    setIsAutoFilling(true);
    setFormData(prev => ({ ...prev, document_type: docType }));

    if (formData.vehicle_id && docType) {
      const prevVersion = await checkPreviousVersion(formData.vehicle_id, docType);
      setPreviousVersion(prevVersion);

      if (prevVersion) {
        const nextIssueDate = new Date(prevVersion.expiry_date);
        nextIssueDate.setDate(nextIssueDate.getDate() + 1);

        const nextExpiryDate = new Date(nextIssueDate);
        if (docType === 'Insurance') {
          nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 1);
        } else if (docType === 'PUC') {
          nextExpiryDate.setMonth(nextExpiryDate.getMonth() + 6);
        } else if (docType === 'Fitness') {
          nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 1);
        } else if (docType === 'Permit') {
          nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 5);
        } else if (docType === 'RC') {
          nextExpiryDate.setFullYear(nextExpiryDate.getFullYear() + 15);
        }

        setFormData(prev => ({
          ...prev,
          policy_number: prevVersion.policy_number,
          provider: prevVersion.provider,
          premium: prevVersion.premium?.toString() || '',
          coverage: prevVersion.coverage || '',
          issue_date: nextIssueDate.toISOString().split('T')[0],
          expiry_date: nextExpiryDate.toISOString().split('T')[0]
        }));

        setAutoFillMessage(
          `Auto-filled from previous version (v${prevVersion.version}). ` +
          `Previous expiry was ${new Date(prevVersion.expiry_date).toLocaleDateString()}. ` +
          `You can edit these values before submission.`
        );
      }
    }
    setIsAutoFilling(false);
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleIssueDateChange = useCallback((date) => {
    setFormData(prev => ({ ...prev, issue_date: date }));

    if (previousVersion) {
      const overlapWarning = validateDateOverlap(date, formData.expiry_date, previousVersion);
      setDateOverlapWarning(overlapWarning);
    }

    setTimeout(validateDates, 0);
  }, [formData.expiry_date, previousVersion, validateDates]);

  const handleExpiryDateChange = useCallback((date) => {
    setFormData(prev => ({ ...prev, expiry_date: date }));

    if (previousVersion) {
      const overlapWarning = validateDateOverlap(formData.issue_date, date, previousVersion);
      setDateOverlapWarning(overlapWarning);
    }

    setTimeout(validateDates, 0);
  }, [formData.issue_date, previousVersion, validateDates]);

  const MAX_FILE_SIZE = 3 * 1024 * 1024;

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum allowed size is 3MB");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      const res = await api.post("/upload-document", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { url } = res.data;
      setUploadedFile(url);
      setFormData(prev => ({
        ...prev,
        file_url: url
      }));

      toast.success("Document uploaded successfully");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (url, name) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      let extension = "jpg";
      const contentType = response.headers.get("content-type");

      if (
        contentType?.includes("pdf") ||
        url.toLowerCase().includes(".pdf") ||
        url.includes("/raw/")
      ) {
        extension = "pdf";
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${name}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error("Download failed");
    }
  };

  let phoneTimer = null;

  const handlePhoneChange = useCallback((value) => {
    handleInputChange('phone_number', value);

    if (!value || value.length !== 10 || !formData.vehicle_id) {
      setPhoneWarning("");
      return;
    }

    clearTimeout(phoneTimer);
    phoneTimer = setTimeout(async () => {
      try {
        const res = await api.get(`/check-phone-usage`, {
          params: {
            vehicle_id: formData.vehicle_id,
            phone_number: value,
            type: "document"
          }
        });

        if (res.data.used_in.length > 0) {
          setPhoneWarning(
            `This number is already used in: ${res.data.used_in.join(", ")} documents for this vehicle`
          );
        } else {
          setPhoneWarning("");
        }
      } catch {
        setPhoneWarning("");
      }
    }, 500);
  }, [formData.vehicle_id, handleInputChange]);

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      document_type: 'Insurance',
      custom_document_name: '',
      policy_number: '',
      provider: '',
      phone_number: '',
      issue_date: '',
      expiry_date: '',
      premium: '',
      coverage: '',
      status: 'Active',
      file_url: ''
    });
    setUploadedFile(null);
    setPhoneWarning("");
    setDateValidationError("");
    setDateOverlapWarning("");
    setAutoFillMessage("");
    setPreviousVersion(null);
    setSelectedDocument(null);
    setIsAutoFilling(false);
  };

  const handleEdit = (doc) => {
    setSelectedDocument(doc);
    setFormData({
      vehicle_id: doc.vehicle_id,
      document_type: doc.document_type,
      custom_document_name: doc.custom_document_name || '',
      policy_number: doc.policy_number,
      provider: doc.provider,
      phone_number: doc.phone_number || '',
      issue_date: doc.issue_date.split('T')[0],
      expiry_date: doc.expiry_date.split('T')[0],
      premium: doc.premium?.toString() || '',
      coverage: doc.coverage || '',
      status: doc.status,
      file_url: doc.file_url || ''
    });
    setUploadedFile(doc.file_url);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (uploading) {
      toast.error("Please wait until the file upload finishes");
      return;
    }

    if (!uploadedFile) {
      toast.error("Please upload a document file");
      return;
    }

    try {
      // Prepare the data
      const updateData = {
        vehicle_id: formData.vehicle_id,
        document_type: formData.document_type,
        custom_document_name: formData.custom_document_name,
        policy_number: formData.policy_number,
        provider: formData.provider,
        phone_number: formData.phone_number,
        issue_date: new Date(formData.issue_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        premium: formData.premium ? parseFloat(formData.premium) : null,
        coverage: formData.coverage,
        status: formData.status,
        file_url: uploadedFile
      };

      // Make the PUT request
      const response = await api.put(`/vehicle-documents/${selectedDocument.id}`, updateData);

      toast.success('Document updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchData(); // Refresh the documents list
    } catch (error) {
      console.error("API Error:", error);

      // Handle error properly
      let errorMessage = 'Failed to update document';

      if (error.response) {
        // Check if it's a validation error (422)
        if (error.response.status === 422) {
          const errorData = error.response.data;
          if (Array.isArray(errorData.detail)) {
            // FastAPI validation error format
            errorMessage = errorData.detail.map(err => err.msg).join(', ');
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploading) {
      toast.error("Please wait until the file upload finishes");
      return;
    }

    if (!uploadedFile) {
      toast.error("Please upload a document first");
      return;
    }

    try {
      await api.post('/vehicle-documents', {
        ...formData,
        file_url: uploadedFile,
        issue_date: new Date(formData.issue_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        premium: formData.premium ? parseFloat(formData.premium) : null
      });

      toast.success('Document added successfully (version tracked)');
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to add document');
    }
  };

  const handleDeleteVersion = async (versionId, versionNumber) => {
    if (!window.confirm(`Are you sure you want to delete version ${versionNumber}?`)) return;

    try {
      await api.delete(`/vehicle-documents/${versionId}/version`);
      toast.success(`Version ${versionNumber} deleted successfully`);

      // Refresh the history
      if (selectedDocHistory) {
        const response = await api.get(`/vehicle-documents/${selectedDocHistory.history[0].id}/history`);
        setSelectedDocHistory(response.data);
      }

      // Refresh the main documents list
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.detail || 'Failed to delete version');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This will delete all versions.')) return;

    try {
      await api.delete(`/vehicle-documents/${docId}`);
      toast.success('Document deleted successfully');
      fetchData(); // Refresh the documents list

      // Close history dialog if open
      if (historyDialogOpen) {
        setHistoryDialogOpen(false);
        setSelectedDocHistory(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.detail || 'Failed to delete document');
    }
  };

  const viewHistory = async (documentId) => {
    try {
      const response = await api.get(`/vehicle-documents/${documentId}/history`);
      setSelectedDocHistory(response.data);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load document history');
    }
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.registration_number : vehicleId;
  };

  const getDaysUntilExpiry = (expiryDate) => {
    return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const handleExportExcel = async (exportType = 'all') => {
    try {
      setExporting(true);

      let response;
      let filename = '';

      if (exportType === 'filtered') {
        // Export current filtered view
        if (!filteredDocuments || filteredDocuments.length === 0) {
          toast.error('No documents to export');
          setExporting(false);
          return;
        }

        const vehicleMap = {};
        vehicles.forEach(v => {
          vehicleMap[v.id] = {
            registration_number: v.registration_number,
            brand: v.brand,
            model: v.model
          };
        });

        response = await api.post('/export/vehicle-documents/current-view/excel', {
          documents: filteredDocuments,
          vehicle_map: vehicleMap
        }, {
          responseType: 'blob'
        });

        filename = `filtered_documents_${new Date().toISOString().split('T')[0]}.xlsx`;

      } else if (exportType === 'vehicle' && selectedVehicle !== 'all') {
        // Export specific vehicle
        const params = new URLSearchParams();
        params.append('vehicle_id', selectedVehicle);

        response = await api.get(`/export/vehicle-documents/excel?${params.toString()}`, {
          responseType: 'blob'
        });

        const vehicle = vehicles.find(v => v.id === selectedVehicle);
        const vehicleReg = vehicle ? vehicle.registration_number.replace(/[^a-zA-Z0-9]/g, '_') : 'vehicle';
        filename = `${vehicleReg}_documents_${new Date().toISOString().split('T')[0]}.xlsx`;

      } else {
        // Export all documents
        response = await api.get('/export/vehicle-documents/excel', {
          responseType: 'blob'
        });
        filename = `all_vehicles_documents_${new Date().toISOString().split('T')[0]}.xlsx`;
      }

      // Check if response is valid
      if (!response || !response.data) {
        throw new Error('No data received from server');
      }

      // Handle download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);

      // Try to get error message from response
      let errorMessage = 'Failed to export documents';
      if (error.response) {
        if (error.response.data instanceof Blob) {
          // Try to read error from blob
          const text = await error.response.data.text();
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.detail || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } else {
          errorMessage = error.response.data?.detail || errorMessage;
        }
      }

      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const filteredDocuments = getFilteredDocuments();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="documents-page">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Vehicle Documents
          </h1>
          <p className="text-slate-600">Track and manage vehicle documents with expiry monitoring</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-300"
                disabled={exporting || documents.length === 0}
              >
                <FileSpreadsheet size={18} className="mr-2 text-emerald-600" />
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => handleExportExcel('all')}
                disabled={exporting}
                className="cursor-pointer"
              >
                <Download size={14} className="mr-2" />
                All Documents
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExportExcel('filtered')}
                disabled={exporting || filteredDocuments.length === 0}
                className="cursor-pointer"
              >
                <Download size={14} className="mr-2" />
                Current Filtered View ({filteredDocuments.length})
              </DropdownMenuItem>
              {selectedVehicle !== 'all' && (
                <DropdownMenuItem
                  onClick={() => handleExportExcel('vehicle')}
                  disabled={exporting}
                  className="cursor-pointer"
                >
                  <Download size={14} className="mr-2" />
                  This Vehicle Only
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-800 hover:bg-blue-900">
                <Plus size={18} className="mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Vehicle Document</DialogTitle>
                <p className="text-sm text-slate-500">Previous versions will be preserved automatically</p>
              </DialogHeader>
              <DocumentForm
                formData={formData}
                vehicles={vehicles}
                autoFillMessage={autoFillMessage}
                dateOverlapWarning={dateOverlapWarning}
                dateValidationError={dateValidationError}
                phoneWarning={phoneWarning}
                uploadedFile={uploadedFile}
                uploading={uploading}
                isAutoFilling={isAutoFilling}
                onVehicleChange={handleVehicleChange}
                onDocumentTypeChange={handleDocumentTypeChange}
                onInputChange={handleInputChange}
                onIssueDateChange={handleIssueDateChange}
                onExpiryDateChange={handleExpiryDateChange}
                onDocumentUpload={handleDocumentUpload}
                onPhoneChange={handlePhoneChange}
                onSubmit={handleSubmit}
                submitText="Add Document (Auto-Versioned)"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expiry Summary Dashboard */}
      <div className="grid grid-cols-6 gap-4">
        <ExpirySummaryCard
          title="Expired"
          count={expiryStats.expired}
          icon={AlertOctagon}
          color="rose"
          total={documents.length}
          onClick={() => setSelectedFilter('expired')}
        />
        <ExpirySummaryCard
          title="Critical (≤3d)"
          count={expiryStats.critical}
          icon={Flame}
          color="red"
          total={documents.length}
          onClick={() => setSelectedFilter('critical')}
        />
        <ExpirySummaryCard
          title="Urgent (≤7d)"
          count={expiryStats.urgent}
          icon={AlertTriangle}
          color="orange"
          total={documents.length}
          onClick={() => setSelectedFilter('urgent')}
        />
        <ExpirySummaryCard
          title="Warning (≤15d)"
          count={expiryStats.warning}
          icon={AlertCircle}
          color="amber"
          total={documents.length}
          onClick={() => setSelectedFilter('warning')}
        />
        <ExpirySummaryCard
          title="Soon (≤30d)"
          count={expiryStats.soon}
          icon={Clock}
          color="yellow"
          total={documents.length}
          onClick={() => setSelectedFilter('soon')}
        />
        <ExpirySummaryCard
          title="Safe (>30d)"
          count={expiryStats.safe}
          icon={CheckCircle}
          color="emerald"
          total={documents.length}
          onClick={() => setSelectedFilter('safe')}
        />
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.registration_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFilter('all')}
            className="text-slate-600 hover:text-slate-900"
          >
            <X size={14} className="mr-1" />
            Clear Filter
          </Button>
        )}

        {/* Quick Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportExcel('filtered')}
          disabled={exporting || filteredDocuments.length === 0}
          className="ml-auto border-slate-300"
        >
          <FileSpreadsheet size={16} className="mr-1 text-emerald-600" />
          Export Current View
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <p className="text-sm text-slate-500">Editing the current version only</p>
          </DialogHeader>
          <DocumentForm
            formData={formData}
            vehicles={vehicles}
            autoFillMessage={autoFillMessage}
            dateOverlapWarning={dateOverlapWarning}
            dateValidationError={dateValidationError}
            phoneWarning={phoneWarning}
            uploadedFile={uploadedFile}
            uploading={uploading}
            isAutoFilling={isAutoFilling}
            onVehicleChange={handleVehicleChange}
            onDocumentTypeChange={handleDocumentTypeChange}
            onInputChange={handleInputChange}
            onIssueDateChange={handleIssueDateChange}
            onExpiryDateChange={handleExpiryDateChange}
            onDocumentUpload={handleDocumentUpload}
            onPhoneChange={handlePhoneChange}
            onSubmit={handleUpdate}
            submitText="Update Document"
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Version History</DialogTitle>
            {selectedDocHistory && (
              <p className="text-sm text-slate-600">
                {selectedDocHistory.document_type} - {getVehicleName(selectedDocHistory.vehicle_id)}
              </p>
            )}
          </DialogHeader>
          {selectedDocHistory && (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {selectedDocHistory.history.map((version, index) => {
                  const daysLeft = getDaysUntilExpiry(version.expiry_date);

                  return (
                    <Card key={version.id} className={index === 0 ? 'border-blue-500 border-2' : 'border-slate-200'}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? 'default' : 'secondary'}>
                              Version {version.version}
                            </Badge>
                            {index === 0 && <Badge className="bg-emerald-100 text-emerald-700">Current</Badge>}
                            {version.status === 'Expired' && <Badge variant="destructive">Expired</Badge>}
                            {version.status === 'Renewed' && <Badge className="bg-blue-100 text-blue-700">Renewed</Badge>}
                            <ExpiryStatusBadge daysLeft={daysLeft} size="sm" />
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500">
                              {new Date(version.created_at).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDeleteVersion(version.id, version.version)}
                              title="Delete this version"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-slate-500">Policy Number</p>
                            <p className="font-mono font-semibold">{version.policy_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Provider</p>
                            <p className="font-semibold">{version.provider}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Issue Date</p>
                            <p>{new Date(version.issue_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Expiry Date</p>
                            <p className={daysLeft <= 0 ? 'text-rose-600' : ''}>
                              {new Date(version.expiry_date).toLocaleDateString()}
                              {daysLeft > 0 && daysLeft <= 30 && ` (${daysLeft}d)`}
                            </p>
                          </div>
                          {version.premium && (
                            <div>
                              <p className="text-xs text-slate-500">
                                {version.document_type === "Insurance" ? "Premium" : "Fee"}
                              </p>
                              <p>Rs {version.premium.toLocaleString()}</p>
                            </div>
                          )}
                          {version.coverage && (
                            <div>
                              <p className="text-xs text-slate-500">Coverage</p>
                              <p>{version.coverage}</p>
                            </div>
                          )}
                          {version.phone_number && (
                            <div>
                              <p className="text-xs text-slate-500">Phone</p>
                              <p>{version.phone_number}</p>
                            </div>
                          )}
                          {version.file_url && (
                            <div className="col-span-3 mt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(version.file_url, '_blank')}
                              >
                                <Eye size={14} className="mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => downloadFile(version.file_url, version.policy_number)}
                              >
                                <Download size={14} className="mr-1" />
                                Download
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents List */}
      <AnimatePresence>
        <div className="space-y-4">
          {filteredDocuments.map((doc) => {
            const daysLeft = getDaysUntilExpiry(doc.expiry_date);

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${daysLeft <= 0 ? 'border-l-4 border-l-rose-500' :
                  daysLeft <= 3 ? 'border-l-4 border-l-red-500' :
                    daysLeft <= 7 ? 'border-l-4 border-l-orange-500' :
                      daysLeft <= 15 ? 'border-l-4 border-l-amber-500' :
                        daysLeft <= 30 ? 'border-l-4 border-l-yellow-500' : ''
                  }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header with badges */}
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-md">
                              <FileText size={20} className="text-blue-700" />
                            </div>
                            <h3 className="font-semibold text-lg text-slate-900">
                              {doc.document_type === 'Custom' ? doc.custom_document_name : doc.document_type}
                            </h3>
                          </div>
                          <Badge variant="outline">v{doc.version}</Badge>
                          {doc.is_current && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              Current
                            </Badge>
                          )}
                          <ExpiryStatusBadge daysLeft={daysLeft} />
                        </div>

                        {/* Vehicle and policy info */}
                        <p className="text-sm text-slate-600 mb-3">
                          {getVehicleName(doc.vehicle_id)}
                          {doc.phone_number && (
                            <span className="ml-3 inline-flex items-center gap-1 text-xs text-slate-500">
                              <Phone size={12} className="text-slate-400" />
                              {doc.phone_number}
                            </span>
                          )}
                        </p>

                        {/* Progress bar for expiry */}
                        <div className="mb-4 max-w-md">
                          <ExpiryProgress expiryDate={doc.expiry_date} issueDate={doc.issue_date} />
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Policy Number</p>
                            <p className="text-sm font-mono font-semibold">{doc.policy_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Provider</p>
                            <p className="text-sm font-semibold">{doc.provider}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Issue Date</p>
                            <p className="text-sm">{new Date(doc.issue_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiry Date</p>
                            <p className={`text-sm font-medium ${daysLeft <= 0 ? 'text-rose-600' :
                              daysLeft <= 7 ? 'text-orange-600' :
                                daysLeft <= 30 ? 'text-amber-600' : ''
                              }`}>
                              {new Date(doc.expiry_date).toLocaleDateString()}
                              {daysLeft > 0 && daysLeft <= 30 && ` (${daysLeft}d)`}
                            </p>
                          </div>
                        </div>

                        {/* Premium/Fee and Coverage */}
                        {(doc.premium || doc.coverage) && (
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            {doc.premium && (
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                                  {doc.document_type === "Insurance" ? "Premium" : "Fee"}
                                </p>
                                <p className="text-sm font-semibold">Rs {doc.premium.toLocaleString()}</p>
                              </div>
                            )}
                            {doc.coverage && (
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Coverage</p>
                                <p className="text-sm font-semibold">{doc.coverage}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Document actions */}
                        {doc.file_url && (
                          <div className="flex items-center gap-2 mt-2">
                            {doc.file_url.includes(".pdf") || doc.file_url.includes("/raw/") ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                className="h-8"
                              >
                                <Eye size={14} className="mr-1" />
                                View PDF
                              </Button>
                            ) : (
                              <img
                                src={doc.file_url}
                                alt="Document"
                                className="h-10 w-10 object-cover rounded cursor-pointer"
                                onClick={() => window.open(doc.file_url, '_blank')}
                              />
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadFile(doc.file_url, doc.policy_number)}
                              className="h-8"
                            >
                              <Download size={14} />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1 ml-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => viewHistory(doc.id)}
                                data-testid={`view-doc-${doc.id}`}
                              >
                                <Clock size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View History</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEdit(doc)}
                                data-testid={`edit-doc-${doc.id}`}
                              >
                                <Edit size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Current Version</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => handleDeleteDocument(doc.id)}
                                data-testid={`delete-doc-${doc.id}`}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete All Versions</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {/* Empty state */}
      {filteredDocuments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"
        >
          <FileText size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No documents found</h3>
          <p className="text-slate-600">
            {selectedFilter !== 'all'
              ? `No documents in the ${selectedFilter} category`
              : 'Add your first vehicle document'}
          </p>
        </motion.div>
      )}
    </div>
  );
};