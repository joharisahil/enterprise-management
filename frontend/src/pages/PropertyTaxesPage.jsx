import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Receipt, Plus, Edit, Trash2, CheckCircle, AlertCircle, Eye, Phone, Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneNumberInput from '@/components/ui/PhoneNumberInput';

const taxTypes = ['House Tax', 'Property Tax', 'Municipal Tax', 'Other'];
const frequencies = ['Yearly', 'Half-Yearly', 'One-Time'];
const statusOptions = ['Paid', 'Unpaid'];

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

export const PropertyTaxesPage = () => {
  const [taxes, setTaxes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedTax, setSelectedTax] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

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

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 3MB');
      e.target.value = '';
      return;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Only images (JPEG, PNG, WEBP) and PDF files are allowed');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    // Create preview for images
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
    // Reset file input
    const fileInput = document.getElementById('receipt-upload');
    if (fileInput) fileInput.value = '';
  };

  const uploadFile = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // You'll need to create this endpoint in your backend
      const response = await api.post('/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('File uploaded successfully');
      return response.data.url; // Cloudinary URL
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
      // Upload file first if selected
      let receiptUrl = formData.receipt_url;
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        } else {
          return; // Stop submission if upload failed
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
      // Upload new file if selected
      let receiptUrl = formData.receipt_url;
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        } else {
          return; // Stop submission if upload failed
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
      // Show loading toast
      const loadingToast = toast.loading('Downloading file...');

      // Fetch the file
      const response = await fetch(url);
      const blob = await response.blob();

      // Get the file extension from the URL or content type
      let extension = '.pdf'; // default
      if (url.toLowerCase().includes('.pdf') || blob.type === 'application/pdf') {
        extension = '.pdf';
      } else if (blob.type.startsWith('image/')) {
        extension = '.' + blob.type.split('/')[1];
      }

      // Create filename if not provided
      const finalFilename = filename || `receipt_${Date.now()}${extension}`;

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const openReceipt = (url, propertyName, taxType, customTaxName) => {
    if (!url) return;

    // Get the tax display name
    const taxDisplayName = taxType === 'Other' && customTaxName ? customTaxName : taxType;

    // Create a clean filename: PropertyName_TaxType_timestamp
    const cleanPropertyName = propertyName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanTaxName = taxDisplayName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // For PDFs, we want to download with correct extension
    if (url.toLowerCase().includes('.pdf') || url.includes('raw/upload')) {
      const filename = `${cleanPropertyName}_${cleanTaxName}_${timestamp}.pdf`;
      downloadReceipt(url, filename);
    } else {
      // For images, open in new tab
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  const TaxForm = ({ onSubmit, submitText }) => (
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

  return (
    <div className="p-8" data-testid="property-taxes-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Property Taxes
          </h1>
          <p className="text-slate-600">Track property taxes with frequency validation</p>
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
            <TaxForm onSubmit={handleSubmit} submitText="Create Tax Record" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property Tax Record</DialogTitle>
          </DialogHeader>
          <TaxForm onSubmit={handleUpdate} submitText="Update Tax Record" />
        </DialogContent>
      </Dialog>

      {/* View Dialog - UPDATED with receipt display */}
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
                {/* Phone Number Display */}
                {selectedTax.phone_number && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone size={14} className="text-slate-400" />
                      {selectedTax.phone_number}
                    </p>
                  </div>
                )}
                {/* Receipt Display */}
                {selectedTax.receipt_url && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Receipt Document</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                      {/* {selectedTax.receipt_url.toLowerCase().includes('.pdf') ? (
        <File size={20} className="text-red-500" />
      ) : (
        <img src={selectedTax.receipt_url} alt="Receipt" className="h-12 w-12 object-cover rounded" />
      )} */}
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

      {/* Filter */}
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

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({taxes.length})</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid ({unpaidTaxes.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidTaxes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {taxes.map((tax) => (
            <TaxCard
              key={tax.id}
              tax={tax}
              getPropertyName={getPropertyName}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onView={handleView}
              onViewReceipt={openReceipt}  // This is already being passed!
            />
          ))}
        </TabsContent>

        <TabsContent value="unpaid" className="space-y-4">
          {unpaidTaxes.map((tax) => (
            <TaxCard
              key={tax.id}
              tax={tax}
              getPropertyName={getPropertyName}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onView={handleView}
              onViewReceipt={openReceipt}
            />
          ))}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {paidTaxes.map((tax) => (
            <TaxCard
              key={tax.id}
              tax={tax}
              getPropertyName={getPropertyName}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onView={handleView}
              onViewReceipt={openReceipt}
            />
          ))}
        </TabsContent>
      </Tabs>

      {taxes.length === 0 && (
        <div className="text-center py-16">
          <Receipt size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No tax records yet</h3>
          <p className="text-slate-600 mb-4">Add your first property tax record</p>
        </div>
      )}
    </div>
  );
};

// UPDATED TaxCard with receipt indicator
const TaxCard = ({ tax, getPropertyName, onDelete, onEdit, onView, onViewReceipt }) => {
  const isExpired = new Date(tax.expiry_date) < new Date();
  const isExpiringSoon = new Date(tax.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`tax-card-${tax.id}`}
    >
      <Card className={`border-slate-200 shadow-sm ${isExpired && tax.status === 'Unpaid' ? 'border-l-4 border-l-rose-500' : isExpiringSoon && tax.status === 'Unpaid' ? 'border-l-4 border-l-amber-500' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Receipt size={20} className="text-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {tax.tax_type === 'Other' ? tax.custom_tax_name : tax.tax_type}
                  </h3>
                  <p className="text-sm text-slate-600">{getPropertyName(tax.property_id)}</p>
                  {/* Phone Number Display */}
                  {tax.phone_number && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" />
                      {tax.phone_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                  <p className="text-lg font-bold text-slate-900">Rs {tax.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Frequency</p>
                  <Badge variant="outline">{tax.frequency}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Issue Date</p>
                  <p className="text-sm font-medium">{new Date(tax.issue_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiry Date</p>
                  <p className={`text-sm font-medium ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : ''}`}>
                    {new Date(tax.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {tax.status === 'Paid' ? (
                  <>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle size={14} className="mr-1" />
                      Paid
                    </Badge>
                    {tax.payment_date && (
                      <span className="text-xs text-slate-600">
                        on {new Date(tax.payment_date).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Badge variant="destructive">
                      <AlertCircle size={14} className="mr-1" />
                      Unpaid
                    </Badge>
                    {isExpired && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {isExpiringSoon && !isExpired && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Expiring Soon</Badge>
                    )}
                  </>
                )}

                {/* Receipt Indicator */}
                {/* // In TaxCard component, update the Receipt button to use onViewReceipt prop: */}
                {tax.receipt_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      const propertyName = getPropertyName(tax.property_id);
                      const taxDisplayName = tax.tax_type === 'Other' && tax.custom_tax_name
                        ? tax.custom_tax_name
                        : tax.tax_type;
                      onViewReceipt(tax.receipt_url, propertyName, taxDisplayName, tax.custom_tax_name);
                    }}
                  >
                    <Upload size={12} className="mr-1" />
                    {tax.receipt_url.toLowerCase().includes('.pdf') ? 'Download PDF' : 'View Receipt'}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onView(tax)}
                data-testid={`view-tax-${tax.id}`}
              >
                <Eye size={16} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onEdit(tax)}
                data-testid={`edit-tax-${tax.id}`}
              >
                <Edit size={16} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => onDelete(tax.id)}
                data-testid={`delete-tax-${tax.id}`}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};