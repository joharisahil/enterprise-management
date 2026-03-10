import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Droplet, Plus, Eye, Trash2, Upload, File, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PhoneNumberInput from '@/components/ui/PhoneNumberInput';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

// FileUploadSection Component - MOVED OUTSIDE and MEMOIZED
const FileUploadSection = React.memo(({ 
  currentUrl, 
  selectedFile, 
  filePreview, 
  onFileSelect, 
  onClear, 
  propertyName,
  date,
  uploading,
  openReceipt
}) => (
  <div className="space-y-2">
    <Label>Bill Document (Optional)</Label>

    {currentUrl && !selectedFile && (
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 truncate max-w-[200px]">
            {currentUrl.split('/').pop()?.split('?')[0] || 'document'}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => openReceipt(currentUrl, propertyName, date)}
          className="text-blue-600 hover:text-blue-700"
        >
          {currentUrl.toLowerCase().includes('.pdf') ? 'Download' : 'View'}
        </Button>
      </div>
    )}

    <div className="flex items-center gap-2">
      <Input
        id="bill-upload"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={onFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById('bill-upload').click()}
        disabled={uploading}
        className="w-full"
      >
        <Upload size={16} className="mr-2" />
        {uploading ? 'Uploading...' : 'Choose File'}
      </Button>
      {(currentUrl || selectedFile) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="text-rose-600 hover:text-rose-700"
        >
          <X size={16} />
        </Button>
      )}
    </div>

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
));

FileUploadSection.displayName = 'FileUploadSection';

// BillForm Component - MOVED OUTSIDE and MEMOIZED
const BillForm = React.memo(({ 
  formData, 
  setFormData, 
  properties, 
  selectedBill,
  onSubmit, 
  submitText, 
  uploading,
  selectedFile,
  filePreview,
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
          <SelectTrigger>
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
          <Label>Billing Period Start *</Label>
          <Input
            type="date"
            required
            value={formData.billing_period_start}
            onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
          />
        </div>
        <div>
          <Label>Billing Period End *</Label>
          <Input
            type="date"
            required
            value={formData.billing_period_end}
            onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Units Consumed *</Label>
          <Input
            type="number"
            step="0.01"
            required
            value={formData.units_consumed}
            onChange={(e) => setFormData({ ...formData, units_consumed: e.target.value })}
            placeholder="Liters/m3"
          />
        </div>
        <div>
          <Label>Sewage Charges (Rs) *</Label>
          <Input
            type="number"
            step="0.01"
            required
            value={formData.sewage_charges}
            onChange={(e) => setFormData({ ...formData, sewage_charges: e.target.value })}
          />
        </div>
        <div>
          <Label>Tanker Usage (Rs)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.tanker_usage}
            onChange={(e) => setFormData({ ...formData, tanker_usage: e.target.value })}
          />
        </div>
      </div>

      <PhoneNumberInput
        value={formData.phone_number || ''}
        onChange={(value) => setFormData({ ...formData, phone_number: value })}
        propertyId={formData.property_id}
        excludeId={selectedBill?.id}
        excludeType="water"
        label="Phone Number (Optional)"
        placeholder="Enter 10 digit mobile number"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Total Bill (Rs) *</Label>
          <Input
            type="number"
            step="0.01"
            required
            value={formData.total_bill}
            onChange={(e) => setFormData({ ...formData, total_bill: e.target.value })}
          />
        </div>
        <div>
          <Label>Due Date *</Label>
          <Input
            type="date"
            required
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.status === 'Paid' && (
          <div>
            <Label>Payment Date *</Label>
            <Input
              type="date"
              required
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            />
          </div>
        )}
      </div>

      <FileUploadSection
        currentUrl={formData.bill_url}
        selectedFile={selectedFile}
        filePreview={filePreview}
        onFileSelect={handleFileSelect}
        onClear={clearSelectedFile}
        propertyName={properties.find(p => p.id === formData.property_id)?.name || 'Property'}
        date={formData.billing_period_start}
        uploading={uploading}
        openReceipt={openReceipt}
      />

      <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={uploading}>
        {uploading ? 'Uploading...' : submitText}
      </Button>
    </form>
  );
});

BillForm.displayName = 'BillForm';

export const WaterPage = () => {
  const [properties, setProperties] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [formData, setFormData] = useState({
    property_id: '',
    billing_period_start: '',
    billing_period_end: '',
    units_consumed: '',
    sewage_charges: '',
    tanker_usage: '0',
    total_bill: '',
    due_date: '',
    payment_date: '',
    status: 'Unpaid',
    phone_number: '',
    bill_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedProperty]);

  const fetchData = async () => {
    try {
      const filter = selectedProperty !== 'all' ? `?property_id=${selectedProperty}` : '';
      const [propsRes, billsRes] = await Promise.all([
        api.get('/properties'),
        api.get(`/water-bills${filter}`)
      ]);

      setProperties(propsRes.data.data);
      setBills(billsRes.data.data);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // File handling functions
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
    const fileInput = document.getElementById('bill-upload');
    if (fileInput) fileInput.value = '';
  };

  const uploadFile = async (file) => {
    if (!file) return null;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

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

      const finalFilename = filename || `document_${Date.now()}${extension}`;
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

  const openReceipt = (url, propertyName, date) => {
    if (!url) return;

    const cleanPropertyName = propertyName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = date || new Date().toISOString().split('T')[0];

    if (url.toLowerCase().includes('.pdf') || url.includes('raw/upload')) {
      const filename = `${cleanPropertyName}_Water_Bill_${timestamp}.pdf`;
      downloadReceipt(url, filename);
    } else {
      window.open(url, '_blank');
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: '',
      billing_period_start: '',
      billing_period_end: '',
      units_consumed: '',
      sewage_charges: '',
      tanker_usage: '0',
      total_bill: '',
      due_date: '',
      payment_date: '',
      status: 'Unpaid',
      phone_number: '',
      bill_url: ''
    });
    setSelectedBill(null);
    clearSelectedFile();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let billUrl = formData.bill_url;
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (uploadedUrl) {
          billUrl = uploadedUrl;
        } else {
          return;
        }
      }

      await api.post('/water-bills', {
        ...formData,
        units_consumed: parseFloat(formData.units_consumed),
        sewage_charges: parseFloat(formData.sewage_charges),
        tanker_usage: parseFloat(formData.tanker_usage),
        total_bill: parseFloat(formData.total_bill),
        billing_period_start: new Date(formData.billing_period_start).toISOString(),
        billing_period_end: new Date(formData.billing_period_end).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
        bill_url: billUrl
      });

      toast.success('Water bill created successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to create water bill');
    }
  };

  const handleEdit = (bill) => {
    setSelectedBill(bill);
    setFormData({
      property_id: bill.property_id,
      billing_period_start: new Date(bill.billing_period_start).toISOString().split('T')[0],
      billing_period_end: new Date(bill.billing_period_end).toISOString().split('T')[0],
      units_consumed: bill.units_consumed.toString(),
      sewage_charges: bill.sewage_charges.toString(),
      tanker_usage: bill.tanker_usage?.toString() || '0',
      total_bill: bill.total_bill.toString(),
      due_date: new Date(bill.due_date).toISOString().split('T')[0],
      payment_date: bill.payment_date ? new Date(bill.payment_date).toISOString().split('T')[0] : '',
      status: bill.status,
      phone_number: bill.phone_number || '',
      bill_url: bill.bill_url || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      let billUrl = formData.bill_url;
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (uploadedUrl) {
          billUrl = uploadedUrl;
        } else {
          return;
        }
      }

      await api.put(`/water-bills/${selectedBill.id}`, {
        ...formData,
        units_consumed: parseFloat(formData.units_consumed),
        sewage_charges: parseFloat(formData.sewage_charges),
        tanker_usage: parseFloat(formData.tanker_usage),
        total_bill: parseFloat(formData.total_bill),
        billing_period_start: new Date(formData.billing_period_start).toISOString(),
        billing_period_end: new Date(formData.billing_period_end).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
        bill_url: billUrl
      });

      toast.success('Water bill updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to update water bill');
    }
  };

  const handleView = (bill) => {
    setSelectedBill(bill);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this water bill?')) return;

    try {
      await api.delete(`/water-bills/${id}`);
      toast.success('Water bill deleted');
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to delete water bill');
    }
  };

  const getPropertyName = (propertyId) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? prop.name : propertyId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="water-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Water Bills
          </h1>
          <p className="text-slate-600">Track water consumption and sewage charges</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700">
              <Plus size={18} className="mr-2" />
              Add Water Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Water Bill</DialogTitle>
            </DialogHeader>
            <BillForm 
              formData={formData}
              setFormData={setFormData}
              properties={properties}
              selectedBill={selectedBill}
              onSubmit={handleSubmit}
              submitText="Create Water Bill"
              uploading={uploading}
              selectedFile={selectedFile}
              filePreview={filePreview}
              handleFileSelect={handleFileSelect}
              clearSelectedFile={clearSelectedFile}
              openReceipt={openReceipt}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Water Bill</DialogTitle>
          </DialogHeader>
          <BillForm 
            formData={formData}
            setFormData={setFormData}
            properties={properties}
            selectedBill={selectedBill}
            onSubmit={handleUpdate}
            submitText="Update Water Bill"
            uploading={uploading}
            selectedFile={selectedFile}
            filePreview={filePreview}
            handleFileSelect={handleFileSelect}
            clearSelectedFile={clearSelectedFile}
            openReceipt={openReceipt}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        setViewDialogOpen(open);
        if (!open) setSelectedBill(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Water Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-sky-100 rounded-lg">
                  <Droplet size={32} className="text-sky-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{getPropertyName(selectedBill.property_id)}</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedBill.billing_period_start).toLocaleDateString()} - {new Date(selectedBill.billing_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                  <Badge className={selectedBill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                    {selectedBill.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Units Consumed</p>
                  <p className="text-lg font-bold text-slate-900">{selectedBill.units_consumed}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sewage Charges</p>
                  <p className="text-sm text-slate-700">Rs {selectedBill.sewage_charges}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tanker Usage</p>
                  <p className="text-sm text-slate-700">Rs {selectedBill.tanker_usage}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Bill</p>
                  <p className="text-lg font-bold text-slate-900">Rs {selectedBill.total_bill.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                  <p className="text-sm text-slate-700">{new Date(selectedBill.due_date).toLocaleDateString()}</p>
                </div>
                {selectedBill.payment_date && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment Date</p>
                    <p className="text-sm text-slate-700">{new Date(selectedBill.payment_date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedBill.phone_number && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone size={14} className="text-slate-400" />
                      {selectedBill.phone_number}
                    </p>
                  </div>
                )}
                {selectedBill.bill_url && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Bill Document</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                      {selectedBill.bill_url.toLowerCase().includes('.pdf') ? (
                        <File size={20} className="text-red-500" />
                      ) : (
                        <img src={selectedBill.bill_url} alt="Bill" className="h-12 w-12 object-cover rounded" />
                      )}
                      <Button
                        variant="link"
                        className="text-blue-600 p-0 h-auto"
                        onClick={() => openReceipt(
                          selectedBill.bill_url,
                          getPropertyName(selectedBill.property_id),
                          new Date(selectedBill.billing_period_start).toLocaleDateString()
                        )}
                      >
                        {selectedBill.bill_url.toLowerCase().includes('.pdf') ? 'Download PDF' : 'View Image'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-64">
            <SelectValue />
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
      </div>

      <div className="space-y-4">
        {bills.map((bill) => (
          <motion.div
            key={bill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid={`water-bill-${bill.id}`}
          >
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{getPropertyName(bill.property_id)}</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                    </p>
                    {bill.phone_number && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        {bill.phone_number}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                      {bill.status}
                    </Badge>
                    {bill.bill_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => openReceipt(
                          bill.bill_url,
                          getPropertyName(bill.property_id),
                          new Date(bill.billing_period_start).toLocaleDateString()
                        )}
                        title="View Bill Document"
                      >
                        <File size={16} />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(bill)}
                      data-testid={`view-water-${bill.id}`}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleEdit(bill)}
                      data-testid={`edit-water-${bill.id}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleDelete(bill.id)}
                      data-testid={`delete-water-${bill.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Units Consumed</p>
                    <p className="text-lg font-bold text-slate-900">{bill.units_consumed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sewage</p>
                    <p className="text-lg font-bold text-slate-900">Rs {bill.sewage_charges}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Bill</p>
                    <p className="text-lg font-bold text-slate-900">Rs {bill.total_bill.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                    <p className="text-sm font-medium">{new Date(bill.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {bills.length === 0 && (
        <div className="text-center py-16">
          <Droplet size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No water bills yet</h3>
          <p className="text-slate-600">Add your first water bill</p>
        </div>
      )}
    </div>
  );
};