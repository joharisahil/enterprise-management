import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import {
  Receipt, Plus, Edit, Trash2, CheckCircle, AlertCircle, Eye, Phone, Upload, File, X,
  Calendar, AlertOctagon, AlertTriangle, Filter, Flame, Clock, TrendingUp, TrendingDown,
  Building2, CreditCard, IndianRupee, CalendarDays, Gauge, PieChart, Bell, Shield,
  Clock3, Clock4, Clock9, Sparkles, Star, Activity, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PhoneNumberInput from '@/components/ui/PhoneNumberInput';

const taxTypes = ['House Tax', 'Property Tax', 'Municipal Tax', 'Other'];
const frequencies = ['Yearly', 'Half-Yearly', 'One-Time'];
const statusOptions = ['Paid', 'Unpaid'];

// Expiry status categories
const EXPIRY_STATUS = {
  EXPIRED: { label: 'Expired', color: 'rose', icon: AlertOctagon, days: 0, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CRITICAL: { label: 'Critical', color: 'red', icon: Flame, days: 7, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  WARNING: { label: 'Warning', color: 'amber', icon: AlertTriangle, days: 15, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SOON: { label: 'Expiring Soon', color: 'yellow', icon: Clock, days: 30, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  SAFE: { label: 'Safe', color: 'emerald', icon: CheckCircle, days: 31, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

const initialFormData = {
  property_id: '',
  tax_type: 'House Tax',
  custom_tax_name: '',
  phone_number: '',
  amount: '',
  issue_date: '',
  expiry_date: '',
  payment_date: '',
  status: 'Unpaid',
  frequency: 'Yearly',
  receipt_url: ''
};

// Expiry Status Badge Component
const ExpiryStatusBadge = ({ daysLeft, size = "md" }) => {
  const getStatus = () => {
    if (daysLeft <= 0) return EXPIRY_STATUS.EXPIRED;
    if (daysLeft <= 7) return EXPIRY_STATUS.CRITICAL;
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

// Tax Form Component - MOVED OUTSIDE and MEMOIZED
const TaxForm = React.memo(({ 
  formData, 
  setFormData, 
  properties, 
  selectedTax,
  onSubmit, 
  submitText, 
  uploading,
  selectedFile,
  setSelectedFile,
  filePreview,
  setFilePreview,
  handleFileSelect,
  clearSelectedFile,
  openReceipt
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Property *</Label>
        <Select
          value={formData.property_id}
          onValueChange={(value) => setFormData({ ...formData, property_id: value })}
          required
        >
          <SelectTrigger data-testid="tax-property-select">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((prop) => (
              <SelectItem key={prop.id} value={prop.id}>
                {prop.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tax Type *</Label>
          <Select
            value={formData.tax_type}
            onValueChange={(value) => setFormData({ ...formData, tax_type: value })}
          >
            <SelectTrigger data-testid="tax-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taxTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Frequency *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => setFormData({ ...formData, frequency: value })}
          >
            <SelectTrigger data-testid="tax-frequency-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((freq) => (
                <SelectItem key={freq} value={freq}>{freq}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.tax_type === 'Other' && (
        <div>
          <Label>Custom Tax Name</Label>
          <Input
            value={formData.custom_tax_name}
            onChange={(e) => setFormData({ ...formData, custom_tax_name: e.target.value })}
            placeholder="e.g., Development Tax"
          />
        </div>
      )}

      <PhoneNumberInput
        value={formData.phone_number || ''}
        onChange={(value) => setFormData({ ...formData, phone_number: value })}
        propertyId={formData.property_id}
        excludeId={selectedTax?.id}
        excludeType="property-tax"
        label="Phone Number (Optional)"
        placeholder="Enter 10 digit mobile number"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Amount (Rs) *</Label>
          <Input
            type="number"
            required
            data-testid="tax-amount-input"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="15000"
          />
        </div>

        <div>
          <Label>Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger data-testid="tax-status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Issue Date *</Label>
          <Input
            type="date"
            required
            data-testid="tax-issue-date-input"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
          />
        </div>

        <div>
          <Label>Expiry Date *</Label>
          <Input
            type="date"
            required
            data-testid="tax-expiry-date-input"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
          />
        </div>
      </div>

      {formData.status === 'Paid' && (
        <div>
          <Label>Payment Date *</Label>
          <Input
            type="date"
            required
            data-testid="tax-payment-date-input"
            value={formData.payment_date}
            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
          />
        </div>
      )}

      {/* Document Upload Section */}
      <div className="space-y-2">
        <Label>Receipt Document (Optional)</Label>

        {/* Existing receipt URL display */}
        {formData.receipt_url && !selectedFile && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 truncate max-w-[200px]">
                {formData.receipt_url.split('/').pop()?.split('?')[0] || 'receipt'}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const property = properties.find(p => p.id === formData.property_id);
                const propertyName = property ? property.name : 'Property';
                const taxDisplayName = formData.tax_type === 'Other' && formData.custom_tax_name
                  ? formData.custom_tax_name
                  : formData.tax_type;
                openReceipt(formData.receipt_url, propertyName, taxDisplayName);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              {formData.receipt_url.toLowerCase().includes('.pdf') ? 'Download' : 'View'}
            </Button>
          </div>
        )}

        {/* File upload input */}
        <div className="flex items-center gap-2">
          <Input
            id="receipt-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('receipt-upload').click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload size={16} className="mr-2" />
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
          {(formData.receipt_url || selectedFile) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSelectedFile}
              className="text-rose-600 hover:text-rose-700"
            >
              <X size={16} />
            </Button>
          )}
        </div>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                ) : (
                  <File size={24} className="text-blue-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-600">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                New
              </Badge>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Supported formats: JPEG, PNG, WEBP, PDF (Max: 3MB)
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-800 hover:bg-blue-900"
        data-testid="submit-tax-button"
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : submitText}
      </Button>
    </form>
  );
});

TaxForm.displayName = 'TaxForm';

export const PropertyTaxesPage = () => {
  const [taxes, setTaxes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedTax, setSelectedTax] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Calculate expiry stats
  const expiryStats = useMemo(() => {
    const stats = {
      expired: 0,
      critical: 0,
      warning: 0,
      soon: 0,
      safe: 0
    };

    taxes.forEach(tax => {
      const daysLeft = Math.ceil((new Date(tax.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) stats.expired++;
      else if (daysLeft <= 7) stats.critical++;
      else if (daysLeft <= 15) stats.warning++;
      else if (daysLeft <= 30) stats.soon++;
      else stats.safe++;
    });

    return stats;
  }, [taxes]);

  // Get filtered taxes based on expiry status
  const getFilteredTaxes = useMemo(() => {
    if (selectedFilter === 'all') return taxes;

    return taxes.filter(tax => {
      const daysLeft = Math.ceil((new Date(tax.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

      switch (selectedFilter) {
        case 'expired':
          return daysLeft <= 0;
        case 'critical':
          return daysLeft > 0 && daysLeft <= 7;
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
  }, [taxes, selectedFilter]);

  useEffect(() => {
    fetchData();
  }, [selectedProperty]);

  const fetchData = async () => {
    try {
      const [propsRes, taxesRes] = await Promise.all([
        api.get('/properties'),
        api.get(`/property-taxes${selectedProperty !== 'all' ? `?property_id=${selectedProperty}` : ''}`)
      ]);

      setProperties(propsRes.data.data);
      setTaxes(taxesRes.data.data);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 3MB');
      e.target.value = '';
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Only images (JPEG, PNG, WEBP) and PDF files are allowed');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    const fileInput = document.getElementById('receipt-upload');
    if (fileInput) fileInput.value = '';
  };

  const uploadFile = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('File uploaded successfully');
      return response.data.url;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
      return null;
    } finally {
      setUploading(false);
      clearSelectedFile();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let receiptUrl = formData.receipt_url;
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        } else {
          return;
        }
      }

      await api.post('/property-taxes', {
        ...formData,
        amount: parseFloat(formData.amount),
        issue_date: new Date(formData.issue_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
        receipt_url: receiptUrl
      });

      toast.success('Property tax record created successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to create tax record');
    }
  };

  const handleEdit = (tax) => {
    setSelectedTax(tax);
    setFormData({
      property_id: tax.property_id,
      tax_type: tax.tax_type,
      custom_tax_name: tax.custom_tax_name || '',
      phone_number: tax.phone_number || '',
      amount: tax.amount.toString(),
      issue_date: new Date(tax.issue_date).toISOString().split('T')[0],
      expiry_date: new Date(tax.expiry_date).toISOString().split('T')[0],
      payment_date: tax.payment_date ? new Date(tax.payment_date).toISOString().split('T')[0] : '',
      status: tax.status,
      frequency: tax.frequency,
      receipt_url: tax.receipt_url || ''
    });
    setEditDialogOpen(true);
  };

  const handleView = (tax) => {
    setSelectedTax(tax);
    setViewDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      let receiptUrl = formData.receipt_url;
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        } else {
          return;
        }
      }

      await api.put(`/property-taxes/${selectedTax.id}`, {
        ...formData,
        amount: parseFloat(formData.amount),
        issue_date: new Date(formData.issue_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
        receipt_url: receiptUrl
      });

      toast.success('Property tax record updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to update tax record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tax record?')) return;

    try {
      await api.delete(`/property-taxes/${id}`);
      toast.success('Tax record deleted');
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to delete tax record');
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedTax(null);
    clearSelectedFile();
  };

  const getPropertyName = (propertyId) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? prop.name : propertyId;
  };

  const paidTaxes = taxes.filter(t => t.status === 'Paid');
  const unpaidTaxes = taxes.filter(t => t.status === 'Unpaid');

  const downloadReceipt = async (url, filename) => {
    if (!url) return;

    try {
      const loadingToast = toast.loading('Downloading file...');
      const response = await fetch(url);
      const blob = await response.blob();

      let extension = '.pdf';
      if (url.toLowerCase().includes('.pdf') || blob.type === 'application/pdf') {
        extension = '.pdf';
      } else if (blob.type.startsWith('image/')) {
        extension = '.' + blob.type.split('/')[1];
      }

      const finalFilename = filename || `receipt_${Date.now()}${extension}`;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.dismiss(loadingToast);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const openReceipt = (url, propertyName, taxType, customTaxName) => {
    if (!url) return;

    const taxDisplayName = taxType === 'Other' && customTaxName ? customTaxName : taxType;
    const cleanPropertyName = propertyName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanTaxName = taxDisplayName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];

    if (url.toLowerCase().includes('.pdf') || url.includes('raw/upload')) {
      const filename = `${cleanPropertyName}_${cleanTaxName}_${timestamp}.pdf`;
      downloadReceipt(url, filename);
    } else {
      window.open(url, '_blank');
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="property-taxes-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Property Taxes
          </h1>
          <p className="text-slate-600">Track and manage property taxes with expiry monitoring</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900" data-testid="add-tax-button">
              <Plus size={18} className="mr-2" />
              Add Tax Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Property Tax Record</DialogTitle>
            </DialogHeader>
            <TaxForm 
              formData={formData}
              setFormData={setFormData}
              properties={properties}
              selectedTax={selectedTax}
              onSubmit={handleSubmit}
              submitText="Create Tax Record"
              uploading={uploading}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              filePreview={filePreview}
              setFilePreview={setFilePreview}
              handleFileSelect={handleFileSelect}
              clearSelectedFile={clearSelectedFile}
              openReceipt={openReceipt}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Expiry Summary Dashboard */}
      <div className="grid grid-cols-5 gap-4">
        <ExpirySummaryCard
          title="Expired"
          count={expiryStats.expired}
          icon={AlertOctagon}
          color="rose"
          total={taxes.length}
          onClick={() => setSelectedFilter('expired')}
        />
        <ExpirySummaryCard
          title="Critical (≤7d)"
          count={expiryStats.critical}
          icon={Flame}
          color="red"
          total={taxes.length}
          onClick={() => setSelectedFilter('critical')}
        />
        <ExpirySummaryCard
          title="Warning (≤15d)"
          count={expiryStats.warning}
          icon={AlertTriangle}
          color="amber"
          total={taxes.length}
          onClick={() => setSelectedFilter('warning')}
        />
        <ExpirySummaryCard
          title="Soon (≤30d)"
          count={expiryStats.soon}
          icon={Clock}
          color="yellow"
          total={taxes.length}
          onClick={() => setSelectedFilter('soon')}
        />
        <ExpirySummaryCard
          title="Safe (>30d)"
          count={expiryStats.safe}
          icon={CheckCircle}
          color="emerald"
          total={taxes.length}
          onClick={() => setSelectedFilter('safe')}
        />
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((prop) => (
              <SelectItem key={prop.id} value={prop.id}>
                {prop.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="flex-1">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              All ({taxes.length})
            </TabsTrigger>
            <TabsTrigger value="unpaid" className="data-[state=active]:bg-white">
              Unpaid ({unpaidTaxes.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="data-[state=active]:bg-white">
              Paid ({paidTaxes.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedFilter !== 'all' && selectedFilter !== 'unpaid' && selectedFilter !== 'paid' && (
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property Tax Record</DialogTitle>
          </DialogHeader>
          <TaxForm 
            formData={formData}
            setFormData={setFormData}
            properties={properties}
            selectedTax={selectedTax}
            onSubmit={handleUpdate}
            submitText="Update Tax Record"
            uploading={uploading}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            filePreview={filePreview}
            setFilePreview={setFilePreview}
            handleFileSelect={handleFileSelect}
            clearSelectedFile={clearSelectedFile}
            openReceipt={openReceipt}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tax Record Details</DialogTitle>
          </DialogHeader>
          {selectedTax && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Receipt size={32} className="text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {selectedTax.tax_type === 'Other' ? selectedTax.custom_tax_name : selectedTax.tax_type}
                  </h3>
                  <p className="text-sm text-slate-600">{getPropertyName(selectedTax.property_id)}</p>
                </div>
              </div>

              {/* Expiry Status for View Dialog */}
              {(() => {
                const daysLeft = getDaysUntilExpiry(selectedTax.expiry_date);
                return (
                  <div className="mb-4">
                    <ExpiryStatusBadge daysLeft={daysLeft} size="lg" />
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                  <p className="text-lg font-bold text-slate-900">Rs {selectedTax.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Frequency</p>
                  <Badge variant="outline">{selectedTax.frequency}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Issue Date</p>
                  <p className="text-sm text-slate-700">{new Date(selectedTax.issue_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiry Date</p>
                  <p className="text-sm text-slate-700">{new Date(selectedTax.expiry_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                  {selectedTax.status === 'Paid' ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle size={14} className="mr-1" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle size={14} className="mr-1" />
                      Unpaid
                    </Badge>
                  )}
                </div>
                {selectedTax.payment_date && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment Date</p>
                    <p className="text-sm text-slate-700">{new Date(selectedTax.payment_date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedTax.phone_number && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone size={14} className="text-slate-400" />
                      {selectedTax.phone_number}
                    </p>
                  </div>
                )}
                {selectedTax.receipt_url && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Receipt Document</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <Button
                        variant="link"
                        className="text-blue-600 p-0 h-auto"
                        onClick={() => {
                          const propertyName = getPropertyName(selectedTax.property_id);
                          const taxDisplayName = selectedTax.tax_type === 'Other' && selectedTax.custom_tax_name
                            ? selectedTax.custom_tax_name
                            : selectedTax.tax_type;
                          openReceipt(selectedTax.receipt_url, propertyName, taxDisplayName, selectedTax.custom_tax_name);
                        }}
                      >
                        {selectedTax.receipt_url.toLowerCase().includes('.pdf') ? 'Download PDF' : 'View Image'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tax Cards Grid */}
      <AnimatePresence>
        <div className="space-y-4">
          {getFilteredTaxes.map((tax) => {
            const daysLeft = getDaysUntilExpiry(tax.expiry_date);

            return (
              <motion.div
                key={tax.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
              >
                <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${daysLeft <= 0 ? 'border-l-4 border-l-rose-500' :
                    daysLeft <= 7 ? 'border-l-4 border-l-red-500' :
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
                              <Receipt size={20} className="text-blue-700" />
                            </div>
                            <h3 className="font-semibold text-lg text-slate-900">
                              {tax.tax_type === 'Other' ? tax.custom_tax_name : tax.tax_type}
                            </h3>
                          </div>
                          <Badge variant="outline">{tax.frequency}</Badge>
                          <ExpiryStatusBadge daysLeft={daysLeft} />
                        </div>

                        {/* Property and Phone */}
                        <p className="text-sm text-slate-600 mb-3">
                          {getPropertyName(tax.property_id)}
                          {tax.phone_number && (
                            <span className="ml-3 inline-flex items-center gap-1 text-xs text-slate-500">
                              <Phone size={12} className="text-slate-400" />
                              {tax.phone_number}
                            </span>
                          )}
                        </p>

                        {/* Progress bar for expiry */}
                        <div className="mb-4 max-w-md">
                          <ExpiryProgress expiryDate={tax.expiry_date} issueDate={tax.issue_date} />
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                            <p className="text-sm font-bold text-slate-900">Rs {tax.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Issue Date</p>
                            <p className="text-sm">{new Date(tax.issue_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiry Date</p>
                            <p className={`text-sm font-medium ${daysLeft <= 0 ? 'text-rose-600' :
                                daysLeft <= 7 ? 'text-red-600' :
                                  daysLeft <= 15 ? 'text-amber-600' :
                                    daysLeft <= 30 ? 'text-yellow-600' : ''
                              }`}>
                              {new Date(tax.expiry_date).toLocaleDateString()}
                              {daysLeft > 0 && daysLeft <= 30 && ` (${daysLeft}d)`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                            {tax.status === 'Paid' ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                <CheckCircle size={12} className="mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertCircle size={12} className="mr-1" />
                                Unpaid
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Receipt indicator */}
                        {tax.receipt_url && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                const propertyName = getPropertyName(tax.property_id);
                                const taxDisplayName = tax.tax_type === 'Other' && tax.custom_tax_name
                                  ? tax.custom_tax_name
                                  : tax.tax_type;
                                openReceipt(tax.receipt_url, propertyName, taxDisplayName, tax.custom_tax_name);
                              }}
                            >
                              <Upload size={12} className="mr-1" />
                              {tax.receipt_url.toLowerCase().includes('.pdf') ? 'Download PDF' : 'View Receipt'}
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
                                onClick={() => handleView(tax)}
                                data-testid={`view-tax-${tax.id}`}
                              >
                                <Eye size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEdit(tax)}
                                data-testid={`edit-tax-${tax.id}`}
                              >
                                <Edit size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Record</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => handleDelete(tax.id)}
                                data-testid={`delete-tax-${tax.id}`}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Record</TooltipContent>
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
      {getFilteredTaxes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"
        >
          <Receipt size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No tax records found</h3>
          <p className="text-slate-600">
            {selectedFilter !== 'all' && selectedFilter !== 'unpaid' && selectedFilter !== 'paid'
              ? `No taxes in the ${selectedFilter} category`
              : selectedFilter === 'unpaid'
                ? 'No unpaid taxes found'
                : selectedFilter === 'paid'
                  ? 'No paid taxes found'
                  : 'Add your first property tax record'}
          </p>
        </motion.div>
      )}
    </div>
  );
};