import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Zap, Sun, Plus, TrendingUp, AlertTriangle, Eye, Trash2, Phone, Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PhoneNumberInput from '@/components/ui/PhoneNumberInput';
import ElectricityBillFetcher from '@/components/electricity/ElectricityBillFetcher';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

export const ElectricityPage = () => {
  const [properties, setProperties] = useState([]);
  const [electricityBills, setElectricityBills] = useState([]);
  const [solarMeters, setSolarMeters] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [elecDialogOpen, setElecDialogOpen] = useState(false);
  const [solarDialogOpen, setSolarDialogOpen] = useState(false);
  const [viewElecDialogOpen, setViewElecDialogOpen] = useState(false);
  const [viewSolarDialogOpen, setViewSolarDialogOpen] = useState(false);
  const [editElecDialogOpen, setEditElecDialogOpen] = useState(false);
  const [editSolarDialogOpen, setEditSolarDialogOpen] = useState(false);
  const [selectedElecBill, setSelectedElecBill] = useState(null);
  const [selectedSolarMeter, setSelectedSolarMeter] = useState(null);
  const [operatorCodes, setOperatorCodes] = useState([]);
  
  // Delete confirmation dialogs
  const [deleteElecDialogOpen, setDeleteElecDialogOpen] = useState(false);
  const [deleteSolarDialogOpen, setDeleteSolarDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // File upload states for electricity
  const [elecSelectedFile, setElecSelectedFile] = useState(null);
  const [elecFilePreview, setElecFilePreview] = useState(null);

  // File upload states for solar
  const [solarSelectedFile, setSolarSelectedFile] = useState(null);
  const [solarFilePreview, setSolarFilePreview] = useState(null);

  const [elecFormData, setElecFormData] = useState({
    property_id: '',
    billing_period_start: '',
    billing_period_end: '',
    previous_reading: '',
    current_reading: '',
    units_consumed: '',
    slab_charges: '',
    fixed_charges: '',
    taxes: '',
    penalty: '0',
    total_amount: '',
    due_date: '',
    payment_date: '',
    status: 'Unpaid',
    phone_number: '',
    bill_url: '' // Add bill_url field
  });

  const [solarFormData, setSolarFormData] = useState({
    property_id: '',
    billing_period_start: '',
    billing_period_end: '',
    installed_capacity_kw: '',
    units_generated: '',
    self_consumed: '',
    exported_to_grid: '',
    imported_from_grid: '',
    net_units: '',
    feed_in_tariff: '',
    credit_carried_forward: '0',
    billable_units: '',
    phone_number: '',
    meter_image_url: '' // Add meter_image_url field for solar meter photos
  });

  useEffect(() => {
    fetchData();
  }, [selectedProperty]);

  const fetchData = async () => {
    try {
      const filter = selectedProperty !== 'all' ? `?property_id=${selectedProperty}` : '';
      const [propsRes, elecRes, solarRes] = await Promise.all([
        api.get('/properties'),
        api.get(`/electricity-bills${filter}`),
        api.get(`/solar-meters${filter}`)
      ]);
      
      setProperties(propsRes.data.data);
      setElectricityBills(elecRes.data.data);
      setSolarMeters(solarRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatorCodes = async () => {
  try {
    const response = await api.get('/electricity-bills/operator-codes');
    setOperatorCodes(response.data.data);
  } catch (error) {
    console.error('Failed to fetch operator codes:', error);
  }
};

// Add to useEffect
useEffect(() => {
  fetchData();
  fetchOperatorCodes();
}, [selectedProperty]);

  // File handling functions for electricity
  const handleElecFileSelect = (e) => {
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

    setElecSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setElecFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setElecFilePreview(null);
    }
  };

  const clearElecSelectedFile = () => {
    setElecSelectedFile(null);
    setElecFilePreview(null);
    const fileInput = document.getElementById('elec-receipt-upload');
    if (fileInput) fileInput.value = '';
  };

  // File handling functions for solar
  const handleSolarFileSelect = (e) => {
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

    setSolarSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSolarFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSolarFilePreview(null);
    }
  };

  const clearSolarSelectedFile = () => {
    setSolarSelectedFile(null);
    setSolarFilePreview(null);
    const fileInput = document.getElementById('solar-meter-upload');
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

  const openReceipt = (url, propertyName, documentType, date) => {
    if (!url) return;

    const cleanPropertyName = propertyName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanDocType = documentType.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = date || new Date().toISOString().split('T')[0];
    
    if (url.toLowerCase().includes('.pdf') || url.includes('raw/upload')) {
      const filename = `${cleanPropertyName}_${cleanDocType}_${timestamp}.pdf`;
      downloadReceipt(url, filename);
    } else {
      window.open(url, '_blank');
    }
  };

  const resetElecForm = () => {
    setElecFormData({
      property_id: '',
      billing_period_start: '',
      billing_period_end: '',
      previous_reading: '',
      current_reading: '',
      units_consumed: '',
      slab_charges: '',
      fixed_charges: '',
      taxes: '',
      penalty: '0',
      total_amount: '',
      due_date: '',
      payment_date: '',
      status: 'Unpaid',
      phone_number: '',
      bill_url: ''
    });
    setSelectedElecBill(null);
    clearElecSelectedFile();
  };

  const resetSolarForm = () => {
    setSolarFormData({
      property_id: '',
      billing_period_start: '',
      billing_period_end: '',
      installed_capacity_kw: '',
      units_generated: '',
      self_consumed: '',
      exported_to_grid: '',
      imported_from_grid: '',
      net_units: '',
      feed_in_tariff: '',
      credit_carried_forward: '0',
      billable_units: '',
      phone_number: '',
      meter_image_url: ''
    });
    setSelectedSolarMeter(null);
    clearSolarSelectedFile();
  };

  const handleElecSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let billUrl = elecFormData.bill_url;
      if (elecSelectedFile) {
        const uploadedUrl = await uploadFile(elecSelectedFile);
        if (uploadedUrl) {
          billUrl = uploadedUrl;
        } else {
          return;
        }
      }

      const units = parseFloat(elecFormData.current_reading) - parseFloat(elecFormData.previous_reading);
      
      await api.post('/electricity-bills', {
        ...elecFormData,
        previous_reading: parseFloat(elecFormData.previous_reading),
        current_reading: parseFloat(elecFormData.current_reading),
        units_consumed: units,
        slab_charges: parseFloat(elecFormData.slab_charges),
        fixed_charges: parseFloat(elecFormData.fixed_charges),
        taxes: parseFloat(elecFormData.taxes),
        penalty: parseFloat(elecFormData.penalty),
        total_amount: parseFloat(elecFormData.total_amount),
        billing_period_start: new Date(elecFormData.billing_period_start).toISOString(),
        billing_period_end: new Date(elecFormData.billing_period_end).toISOString(),
        due_date: new Date(elecFormData.due_date).toISOString(),
        payment_date: elecFormData.payment_date ? new Date(elecFormData.payment_date).toISOString() : null,
        bill_url: billUrl
      });
      
      toast.success('Electricity bill created successfully');
      setElecDialogOpen(false);
      resetElecForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create electricity bill');
    }
  };

  const handleElecUpdate = async (e) => {
    e.preventDefault();
    
    try {
      let billUrl = elecFormData.bill_url;
      if (elecSelectedFile) {
        const uploadedUrl = await uploadFile(elecSelectedFile);
        if (uploadedUrl) {
          billUrl = uploadedUrl;
        } else {
          return;
        }
      }

      const units = parseFloat(elecFormData.current_reading) - parseFloat(elecFormData.previous_reading);
      
      await api.put(`/electricity-bills/${selectedElecBill.id}`, {
        ...elecFormData,
        previous_reading: parseFloat(elecFormData.previous_reading),
        current_reading: parseFloat(elecFormData.current_reading),
        units_consumed: units,
        slab_charges: parseFloat(elecFormData.slab_charges),
        fixed_charges: parseFloat(elecFormData.fixed_charges),
        taxes: parseFloat(elecFormData.taxes),
        penalty: parseFloat(elecFormData.penalty),
        total_amount: parseFloat(elecFormData.total_amount),
        billing_period_start: new Date(elecFormData.billing_period_start).toISOString(),
        billing_period_end: new Date(elecFormData.billing_period_end).toISOString(),
        due_date: new Date(elecFormData.due_date).toISOString(),
        payment_date: elecFormData.payment_date ? new Date(elecFormData.payment_date).toISOString() : null,
        bill_url: billUrl
      });
      
      toast.success('Electricity bill updated successfully');
      setEditElecDialogOpen(false);
      resetElecForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update electricity bill');
    }
  };

  const handleSolarSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let meterImageUrl = solarFormData.meter_image_url;
      if (solarSelectedFile) {
        const uploadedUrl = await uploadFile(solarSelectedFile);
        if (uploadedUrl) {
          meterImageUrl = uploadedUrl;
        } else {
          return;
        }
      }

      await api.post('/solar-meters', {
        ...solarFormData,
        installed_capacity_kw: parseFloat(solarFormData.installed_capacity_kw),
        units_generated: parseFloat(solarFormData.units_generated),
        self_consumed: parseFloat(solarFormData.self_consumed),
        exported_to_grid: parseFloat(solarFormData.exported_to_grid),
        imported_from_grid: parseFloat(solarFormData.imported_from_grid),
        net_units: parseFloat(solarFormData.net_units),
        feed_in_tariff: parseFloat(solarFormData.feed_in_tariff),
        credit_carried_forward: parseFloat(solarFormData.credit_carried_forward),
        billable_units: parseFloat(solarFormData.billable_units),
        billing_period_start: new Date(solarFormData.billing_period_start).toISOString(),
        billing_period_end: new Date(solarFormData.billing_period_end).toISOString(),
        meter_image_url: meterImageUrl
      });
      
      toast.success('Solar meter data created successfully');
      setSolarDialogOpen(false);
      resetSolarForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create solar meter data');
    }
  };

  const handleSolarUpdate = async (e) => {
    e.preventDefault();
    
    try {
      let meterImageUrl = solarFormData.meter_image_url;
      if (solarSelectedFile) {
        const uploadedUrl = await uploadFile(solarSelectedFile);
        if (uploadedUrl) {
          meterImageUrl = uploadedUrl;
        } else {
          return;
        }
      }

      await api.put(`/solar-meters/${selectedSolarMeter.id}`, {
        ...solarFormData,
        installed_capacity_kw: parseFloat(solarFormData.installed_capacity_kw),
        units_generated: parseFloat(solarFormData.units_generated),
        self_consumed: parseFloat(solarFormData.self_consumed),
        exported_to_grid: parseFloat(solarFormData.exported_to_grid),
        imported_from_grid: parseFloat(solarFormData.imported_from_grid),
        net_units: parseFloat(solarFormData.net_units),
        feed_in_tariff: parseFloat(solarFormData.feed_in_tariff),
        credit_carried_forward: parseFloat(solarFormData.credit_carried_forward),
        billable_units: parseFloat(solarFormData.billable_units),
        billing_period_start: new Date(solarFormData.billing_period_start).toISOString(),
        billing_period_end: new Date(solarFormData.billing_period_end).toISOString(),
        meter_image_url: meterImageUrl
      });
      
      toast.success('Solar meter data updated successfully');
      setEditSolarDialogOpen(false);
      resetSolarForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update solar meter data');
    }
  };

  const handleDeleteElecBill = async () => {
    if (!itemToDelete) return;
    
    try {
      await api.delete(`/electricity-bills/${itemToDelete}`);
      toast.success('Electricity bill deleted');
      setDeleteElecDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete electricity bill');
    }
  };

  const handleDeleteSolarMeter = async () => {
    if (!itemToDelete) return;
    
    try {
      await api.delete(`/solar-meters/${itemToDelete}`);
      toast.success('Solar meter record deleted');
      setDeleteSolarDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete solar meter record');
    }
  };

  const handleViewElecBill = (bill) => {
    setSelectedElecBill(bill);
    setViewElecDialogOpen(true);
  };

  const handleViewSolarMeter = (meter) => {
    setSelectedSolarMeter(meter);
    setViewSolarDialogOpen(true);
  };

  const handleEditElecBill = (bill) => {
    setSelectedElecBill(bill);
    setElecFormData({
      property_id: bill.property_id,
      billing_period_start: new Date(bill.billing_period_start).toISOString().split('T')[0],
      billing_period_end: new Date(bill.billing_period_end).toISOString().split('T')[0],
      previous_reading: bill.previous_reading.toString(),
      current_reading: bill.current_reading.toString(),
      units_consumed: bill.units_consumed.toString(),
      slab_charges: bill.slab_charges.toString(),
      fixed_charges: bill.fixed_charges.toString(),
      taxes: bill.taxes.toString(),
      penalty: bill.penalty?.toString() || '0',
      total_amount: bill.total_amount.toString(),
      due_date: new Date(bill.due_date).toISOString().split('T')[0],
      payment_date: bill.payment_date ? new Date(bill.payment_date).toISOString().split('T')[0] : '',
      status: bill.status,
      phone_number: bill.phone_number || '',
      bill_url: bill.bill_url || ''
    });
    setEditElecDialogOpen(true);
  };

  const handleEditSolarMeter = (meter) => {
    setSelectedSolarMeter(meter);
    setSolarFormData({
      property_id: meter.property_id,
      billing_period_start: new Date(meter.billing_period_start).toISOString().split('T')[0],
      billing_period_end: new Date(meter.billing_period_end).toISOString().split('T')[0],
      installed_capacity_kw: meter.installed_capacity_kw.toString(),
      units_generated: meter.units_generated.toString(),
      self_consumed: meter.self_consumed.toString(),
      exported_to_grid: meter.exported_to_grid.toString(),
      imported_from_grid: meter.imported_from_grid.toString(),
      net_units: meter.net_units.toString(),
      feed_in_tariff: meter.feed_in_tariff.toString(),
      credit_carried_forward: meter.credit_carried_forward?.toString() || '0',
      billable_units: meter.billable_units.toString(),
      phone_number: meter.phone_number || '',
      meter_image_url: meter.meter_image_url || ''
    });
    setEditSolarDialogOpen(true);
  };

  const getPropertyName = (propertyId) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? prop.name : propertyId;
  };

  const FileUploadSection = ({ 
    id, 
    currentUrl, 
    selectedFile, 
    filePreview, 
    onFileSelect, 
    onClear, 
    label,
    propertyName,
    documentType,
    date 
  }) => (
    <div className="space-y-2">
      <Label>{label} (Optional)</Label>

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
            onClick={() => openReceipt(currentUrl, propertyName, documentType, date)}
            className="text-blue-600 hover:text-blue-700"
          >
            {currentUrl.toLowerCase().includes('.pdf') ? 'Download' : 'View'}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={onFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(id).click()}
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
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="electricity-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Electricity & Solar
          </h1>
          <p className="text-slate-600">Track grid electricity and solar net metering</p>
        </div>
      </div>

      {/* Delete Confirmation Dialog for Electricity Bill */}
      <AlertDialog open={deleteElecDialogOpen} onOpenChange={setDeleteElecDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Electricity Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this electricity bill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteElecBill} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog for Solar Meter */}
      <AlertDialog open={deleteSolarDialogOpen} onOpenChange={setDeleteSolarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Solar Meter Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this solar meter record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSolarMeter} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Electricity Bill Dialog */}
      <Dialog open={viewElecDialogOpen} onOpenChange={(open) => { setViewElecDialogOpen(open); if (!open) setSelectedElecBill(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Electricity Bill Details</DialogTitle>
          </DialogHeader>
          {selectedElecBill && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Zap size={32} className="text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{getPropertyName(selectedElecBill.property_id)}</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedElecBill.billing_period_start).toLocaleDateString()} - {new Date(selectedElecBill.billing_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Units Consumed</p>
                  <p className="text-lg font-bold text-slate-900">{selectedElecBill.units_consumed} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                  <Badge className={selectedElecBill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                    {selectedElecBill.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Previous Reading</p>
                  <p className="text-sm text-slate-700">{selectedElecBill.previous_reading} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Current Reading</p>
                  <p className="text-sm text-slate-700">{selectedElecBill.current_reading} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Slab Charges</p>
                  <p className="text-sm text-slate-700">Rs {selectedElecBill.slab_charges}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fixed Charges</p>
                  <p className="text-sm text-slate-700">Rs {selectedElecBill.fixed_charges}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Taxes</p>
                  <p className="text-sm text-slate-700">Rs {selectedElecBill.taxes}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Penalty</p>
                  <p className="text-sm text-slate-700">Rs {selectedElecBill.penalty}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-slate-900">Rs {selectedElecBill.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                  <p className="text-sm text-slate-700">{new Date(selectedElecBill.due_date).toLocaleDateString()}</p>
                </div>
                {selectedElecBill.payment_date && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment Date</p>
                    <p className="text-sm text-slate-700">{new Date(selectedElecBill.payment_date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedElecBill.phone_number && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone size={14} className="text-slate-400" />
                      {selectedElecBill.phone_number}
                    </p>
                  </div>
                )}
                {selectedElecBill.bill_url && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Bill Document</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <Button
                        variant="link"
                        className="text-blue-600 p-0 h-auto"
                        onClick={() => openReceipt(
                          selectedElecBill.bill_url,
                          getPropertyName(selectedElecBill.property_id),
                          'Electricity_Bill',
                          new Date(selectedElecBill.billing_period_start).toLocaleDateString()
                        )}
                      >
                        {selectedElecBill.bill_url.toLowerCase().includes('.pdf') ? 'Download PDF' : 'View Image'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Solar Meter Dialog */}
      <Dialog open={viewSolarDialogOpen} onOpenChange={(open) => { setViewSolarDialogOpen(open); if (!open) setSelectedSolarMeter(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solar Meter Details</DialogTitle>
          </DialogHeader>
          {selectedSolarMeter && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Sun size={32} className="text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{getPropertyName(selectedSolarMeter.property_id)}</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedSolarMeter.billing_period_start).toLocaleDateString()} - {new Date(selectedSolarMeter.billing_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Installed Capacity</p>
                  <p className="text-lg font-bold text-slate-900">{selectedSolarMeter.installed_capacity_kw} kW</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Units Generated</p>
                  <p className="text-lg font-bold text-emerald-700">{selectedSolarMeter.units_generated} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Self Consumed</p>
                  <p className="text-sm text-slate-700">{selectedSolarMeter.self_consumed} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Exported to Grid</p>
                  <p className="text-sm text-slate-700">{selectedSolarMeter.exported_to_grid} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Imported from Grid</p>
                  <p className="text-sm text-slate-700">{selectedSolarMeter.imported_from_grid} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Net Units</p>
                  <p className="text-sm text-slate-700">{selectedSolarMeter.net_units} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Feed-in Tariff</p>
                  <p className="text-sm text-slate-700">Rs {selectedSolarMeter.feed_in_tariff}/kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Billable Units</p>
                  <p className="text-lg font-bold text-slate-900">{selectedSolarMeter.billable_units} kWh</p>
                </div>
                {selectedSolarMeter.reconciliation_flag && (
                  <div className="col-span-2">
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      <AlertTriangle size={12} className="mr-1" />
                      Reconciliation Alert
                    </Badge>
                  </div>
                )}
                {selectedSolarMeter.phone_number && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone size={14} className="text-slate-400" />
                      {selectedSolarMeter.phone_number}
                    </p>
                  </div>
                )}
                {selectedSolarMeter.meter_image_url && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Meter Image</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <Button
                        variant="link"
                        className="text-blue-600 p-0 h-auto"
                        onClick={() => openReceipt(
                          selectedSolarMeter.meter_image_url,
                          getPropertyName(selectedSolarMeter.property_id),
                          'Solar_Meter',
                          new Date(selectedSolarMeter.billing_period_start).toLocaleDateString()
                        )}
                      >
                        {selectedSolarMeter.meter_image_url.toLowerCase().includes('.pdf') ? 'Download PDF' : 'View Image'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Electricity Bill Dialog */}
      <Dialog open={editElecDialogOpen} onOpenChange={(open) => { setEditElecDialogOpen(open); if (!open) resetElecForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Electricity Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleElecUpdate} className="space-y-4">
            <div>
              <Label>Property *</Label>
              <Select
                value={elecFormData.property_id}
                onValueChange={(value) => setElecFormData({ ...elecFormData, property_id: value })}
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
                  value={elecFormData.billing_period_start}
                  onChange={(e) => setElecFormData({ ...elecFormData, billing_period_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Billing Period End *</Label>
                <Input
                  type="date"
                  required
                  value={elecFormData.billing_period_end}
                  onChange={(e) => setElecFormData({ ...elecFormData, billing_period_end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Previous Reading (kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={elecFormData.previous_reading}
                  onChange={(e) => setElecFormData({ ...elecFormData, previous_reading: e.target.value })}
                />
              </div>
              <div>
                <Label>Current Reading (kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={elecFormData.current_reading}
                  onChange={(e) => setElecFormData({ ...elecFormData, current_reading: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Slab Charges (Rs) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={elecFormData.slab_charges}
                  onChange={(e) => setElecFormData({ ...elecFormData, slab_charges: e.target.value })}
                />
              </div>
              <div>
                <Label>Fixed Charges (Rs) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={elecFormData.fixed_charges}
                  onChange={(e) => setElecFormData({ ...elecFormData, fixed_charges: e.target.value })}
                />
              </div>
              <div>
                <Label>Taxes (Rs) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={elecFormData.taxes}
                  onChange={(e) => setElecFormData({ ...elecFormData, taxes: e.target.value })}
                />
              </div>
            </div>

            <PhoneNumberInput
              value={elecFormData.phone_number || ''}
              onChange={(value) => setElecFormData({ ...elecFormData, phone_number: value })}
              propertyId={elecFormData.property_id}
              excludeId={selectedElecBill?.id}
              excludeType="electricity"
              label="Phone Number (Optional)"
              placeholder="Enter 10 digit mobile number"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Penalty (Rs)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={elecFormData.penalty}
                  onChange={(e) => setElecFormData({ ...elecFormData, penalty: e.target.value })}
                />
              </div>
              <div>
                <Label>Total Amount (Rs) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={elecFormData.total_amount}
                  onChange={(e) => setElecFormData({ ...elecFormData, total_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  required
                  value={elecFormData.due_date}
                  onChange={(e) => setElecFormData({ ...elecFormData, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={elecFormData.status}
                  onValueChange={(value) => setElecFormData({ ...elecFormData, status: value })}
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
            </div>

            {elecFormData.status === 'Paid' && (
              <div>
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  required
                  value={elecFormData.payment_date}
                  onChange={(e) => setElecFormData({ ...elecFormData, payment_date: e.target.value })}
                />
              </div>
            )}

            <FileUploadSection
              id="elec-receipt-upload"
              currentUrl={elecFormData.bill_url}
              selectedFile={elecSelectedFile}
              filePreview={elecFilePreview}
              onFileSelect={handleElecFileSelect}
              onClear={clearElecSelectedFile}
              label="Bill Document"
              propertyName={properties.find(p => p.id === elecFormData.property_id)?.name || 'Property'}
              documentType="Electricity_Bill"
              date={elecFormData.billing_period_start}
            />

            <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Update Bill'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Solar Meter Dialog */}
      <Dialog open={editSolarDialogOpen} onOpenChange={(open) => { setEditSolarDialogOpen(open); if (!open) resetSolarForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Solar Meter Data</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSolarUpdate} className="space-y-4">
            <div>
              <Label>Property *</Label>
              <Select
                value={solarFormData.property_id}
                onValueChange={(value) => setSolarFormData({ ...solarFormData, property_id: value })}
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
                <Label>Period Start *</Label>
                <Input
                  type="date"
                  required
                  value={solarFormData.billing_period_start}
                  onChange={(e) => setSolarFormData({ ...solarFormData, billing_period_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Period End *</Label>
                <Input
                  type="date"
                  required
                  value={solarFormData.billing_period_end}
                  onChange={(e) => setSolarFormData({ ...solarFormData, billing_period_end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Installed Capacity (kW) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={solarFormData.installed_capacity_kw}
                  onChange={(e) => setSolarFormData({ ...solarFormData, installed_capacity_kw: e.target.value })}
                />
              </div>
              <div>
                <Label>Units Generated (kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={solarFormData.units_generated}
                  onChange={(e) => setSolarFormData({ ...solarFormData, units_generated: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Self Consumed (kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={solarFormData.self_consumed}
                  onChange={(e) => setSolarFormData({ ...solarFormData, self_consumed: e.target.value })}
                />
              </div>
              <div>
                <Label>Exported to Grid (kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={solarFormData.exported_to_grid}
                  onChange={(e) => setSolarFormData({ ...solarFormData, exported_to_grid: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Imported from Grid (kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={solarFormData.imported_from_grid}
                  onChange={(e) => setSolarFormData({ ...solarFormData, imported_from_grid: e.target.value })}
                />
              </div>
              <div>
                <Label>Net Units (kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={solarFormData.net_units}
                  onChange={(e) => setSolarFormData({ ...solarFormData, net_units: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Feed-in Tariff (Rs/kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={solarFormData.feed_in_tariff}
                  onChange={(e) => setSolarFormData({ ...solarFormData, feed_in_tariff: e.target.value })}
                />
              </div>
              <div>
                <Label>Billable Units (kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={solarFormData.billable_units}
                  onChange={(e) => setSolarFormData({ ...solarFormData, billable_units: e.target.value })}
                />
              </div>
            </div>

            <PhoneNumberInput
              value={solarFormData.phone_number || ''}
              onChange={(value) => setSolarFormData({ ...solarFormData, phone_number: value })}
              propertyId={solarFormData.property_id}
              excludeId={selectedSolarMeter?.id}
              excludeType="solar"
              label="Phone Number (Optional)"
              placeholder="Enter 10 digit mobile number"
            />

            <FileUploadSection
              id="solar-meter-upload"
              currentUrl={solarFormData.meter_image_url}
              selectedFile={solarSelectedFile}
              filePreview={solarFilePreview}
              onFileSelect={handleSolarFileSelect}
              onClear={clearSolarSelectedFile}
              label="Meter Image"
              propertyName={properties.find(p => p.id === solarFormData.property_id)?.name || 'Property'}
              documentType="Solar_Meter"
              date={solarFormData.billing_period_start}
            />

            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Update Solar Data'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Property Filter */}
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

      <Tabs defaultValue="electricity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="electricity">
            <Zap size={16} className="mr-2" />
            Grid Electricity
          </TabsTrigger>
          <TabsTrigger value="solar">
            <Sun size={16} className="mr-2" />
            Solar Net Metering
          </TabsTrigger>
        </TabsList>

        {/* Electricity Bills Tab */}
        <TabsContent value="electricity" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Dialog open={elecDialogOpen} onOpenChange={(open) => { setElecDialogOpen(open); if (!open) resetElecForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-800 hover:bg-blue-900">
                    <Plus size={18} className="mr-2" />
                    Add Electricity Bill
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Electricity Bill</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleElecSubmit} className="space-y-4">
                    {/* Form content remains the same */}
                    <div>
                      <Label>Property *</Label>
                      <Select
                        value={elecFormData.property_id}
                        onValueChange={(value) => setElecFormData({ ...elecFormData, property_id: value })}
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
                          value={elecFormData.billing_period_start}
                          onChange={(e) => setElecFormData({ ...elecFormData, billing_period_start: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Billing Period End *</Label>
                        <Input
                          type="date"
                          required
                          value={elecFormData.billing_period_end}
                          onChange={(e) => setElecFormData({ ...elecFormData, billing_period_end: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Previous Reading (kWh) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={elecFormData.previous_reading}
                          onChange={(e) => setElecFormData({ ...elecFormData, previous_reading: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Current Reading (kWh) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={elecFormData.current_reading}
                          onChange={(e) => setElecFormData({ ...elecFormData, current_reading: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Slab Charges (Rs) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={elecFormData.slab_charges}
                          onChange={(e) => setElecFormData({ ...elecFormData, slab_charges: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Fixed Charges (Rs) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={elecFormData.fixed_charges}
                          onChange={(e) => setElecFormData({ ...elecFormData, fixed_charges: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Taxes (Rs) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={elecFormData.taxes}
                          onChange={(e) => setElecFormData({ ...elecFormData, taxes: e.target.value })}
                        />
                      </div>
                    </div>

                    <PhoneNumberInput
                      value={elecFormData.phone_number || ''}
                      onChange={(value) => setElecFormData({ ...elecFormData, phone_number: value })}
                      propertyId={elecFormData.property_id}
                      excludeId={selectedElecBill?.id}
                      excludeType="electricity"
                      label="Phone Number (Optional)"
                      placeholder="Enter 10 digit mobile number"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Penalty (Rs)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={elecFormData.penalty}
                          onChange={(e) => setElecFormData({ ...elecFormData, penalty: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Total Amount (Rs) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={elecFormData.total_amount}
                          onChange={(e) => setElecFormData({ ...elecFormData, total_amount: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Due Date *</Label>
                        <Input
                          type="date"
                          required
                          value={elecFormData.due_date}
                          onChange={(e) => setElecFormData({ ...elecFormData, due_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Status *</Label>
                        <Select
                          value={elecFormData.status}
                          onValueChange={(value) => setElecFormData({ ...elecFormData, status: value })}
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
                    </div>

                    {elecFormData.status === 'Paid' && (
                      <div>
                        <Label>Payment Date *</Label>
                        <Input
                          type="date"
                          required
                          value={elecFormData.payment_date}
                          onChange={(e) => setElecFormData({ ...elecFormData, payment_date: e.target.value })}
                        />
                      </div>
                    )}

                    <FileUploadSection
                      id="elec-receipt-upload"
                      currentUrl={elecFormData.bill_url}
                      selectedFile={elecSelectedFile}
                      filePreview={elecFilePreview}
                      onFileSelect={handleElecFileSelect}
                      onClear={clearElecSelectedFile}
                      label="Bill Document"
                      propertyName={properties.find(p => p.id === elecFormData.property_id)?.name || 'Property'}
                      documentType="Electricity_Bill"
                      date={elecFormData.billing_period_start}
                    />

                    <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Create Bill'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              {selectedProperty !== 'all' && (
                <ElectricityBillFetcher 
                  propertyId={selectedProperty}
                  onSuccess={fetchData}
                  operatorCodes={operatorCodes}
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            {electricityBills.map((bill) => (
              <ElectricityBillCard 
                key={bill.id} 
                bill={bill} 
                getPropertyName={getPropertyName} 
                onView={handleViewElecBill}
                onEdit={handleEditElecBill}
                onDelete={() => {
                  setItemToDelete(bill.id);
                  setDeleteElecDialogOpen(true);
                }}
                onViewReceipt={openReceipt}
              />
            ))}
          </div>

          {electricityBills.length === 0 && (
            <div className="text-center py-16">
              <Zap size={64} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No electricity bills yet</h3>
              <p className="text-slate-600">Add your first electricity bill</p>
            </div>
          )}
        </TabsContent>

        {/* Solar Tab */}
        <TabsContent value="solar" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={solarDialogOpen} onOpenChange={(open) => { setSolarDialogOpen(open); if (!open) resetSolarForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus size={18} className="mr-2" />
                  Add Solar Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Solar Net Metering Data</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSolarSubmit} className="space-y-4">
                  {/* Form content remains the same */}
                  <div>
                    <Label>Property *</Label>
                    <Select
                      value={solarFormData.property_id}
                      onValueChange={(value) => setSolarFormData({ ...solarFormData, property_id: value })}
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
                      <Label>Period Start *</Label>
                      <Input
                        type="date"
                        required
                        value={solarFormData.billing_period_start}
                        onChange={(e) => setSolarFormData({ ...solarFormData, billing_period_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Period End *</Label>
                      <Input
                        type="date"
                        required
                        value={solarFormData.billing_period_end}
                        onChange={(e) => setSolarFormData({ ...solarFormData, billing_period_end: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Installed Capacity (kW) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={solarFormData.installed_capacity_kw}
                        onChange={(e) => setSolarFormData({ ...solarFormData, installed_capacity_kw: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Units Generated (kWh) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={solarFormData.units_generated}
                        onChange={(e) => setSolarFormData({ ...solarFormData, units_generated: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Self Consumed (kWh) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={solarFormData.self_consumed}
                        onChange={(e) => setSolarFormData({ ...solarFormData, self_consumed: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Exported to Grid (kWh) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={solarFormData.exported_to_grid}
                        onChange={(e) => setSolarFormData({ ...solarFormData, exported_to_grid: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Imported from Grid (kWh) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={solarFormData.imported_from_grid}
                        onChange={(e) => setSolarFormData({ ...solarFormData, imported_from_grid: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Net Units (kWh) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={solarFormData.net_units}
                        onChange={(e) => setSolarFormData({ ...solarFormData, net_units: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Feed-in Tariff (Rs/kWh) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={solarFormData.feed_in_tariff}
                        onChange={(e) => setSolarFormData({ ...solarFormData, feed_in_tariff: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Billable Units (kWh) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={solarFormData.billable_units}
                        onChange={(e) => setSolarFormData({ ...solarFormData, billable_units: e.target.value })}
                      />
                    </div>
                  </div>

                  <PhoneNumberInput
                    value={solarFormData.phone_number || ''}
                    onChange={(value) => setSolarFormData({ ...solarFormData, phone_number: value })}
                    propertyId={solarFormData.property_id}
                    excludeId={selectedSolarMeter?.id}
                    excludeType="solar"
                    label="Phone Number (Optional)"
                    placeholder="Enter 10 digit mobile number"
                  />

                  <FileUploadSection
                    id="solar-meter-upload"
                    currentUrl={solarFormData.meter_image_url}
                    selectedFile={solarSelectedFile}
                    filePreview={solarFilePreview}
                    onFileSelect={handleSolarFileSelect}
                    onClear={clearSolarSelectedFile}
                    label="Meter Image"
                    propertyName={properties.find(p => p.id === solarFormData.property_id)?.name || 'Property'}
                    documentType="Solar_Meter"
                    date={solarFormData.billing_period_start}
                  />

                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Create Solar Data'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {solarMeters.map((meter) => (
              <SolarMeterCard 
                key={meter.id} 
                meter={meter} 
                getPropertyName={getPropertyName}
                onView={handleViewSolarMeter}
                onEdit={handleEditSolarMeter}
                onDelete={() => {
                  setItemToDelete(meter.id);
                  setDeleteSolarDialogOpen(true);
                }}
                onViewReceipt={openReceipt}
              />
            ))}
          </div>

          {solarMeters.length === 0 && (
            <div className="text-center py-16">
              <Sun size={64} className="mx-auto text-amber-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No solar data yet</h3>
              <p className="text-slate-600">Add your first solar net metering data</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Updated ElectricityBillCard with document indicator
const ElectricityBillCard = ({ bill, getPropertyName, onView, onEdit, onDelete, onViewReceipt }) => {
  return (
    <Card className="border-slate-200 shadow-sm" data-testid={`electricity-bill-${bill.id}`}>
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
                onClick={() => onViewReceipt(
                  bill.bill_url,
                  getPropertyName(bill.property_id),
                  'Electricity_Bill',
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
              onClick={() => onView(bill)}
              data-testid={`view-electricity-${bill.id}`}
            >
              <Eye size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => onEdit(bill)}
              data-testid={`edit-electricity-${bill.id}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={onDelete}
              data-testid={`delete-electricity-${bill.id}`}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Units Consumed</p>
            <p className="text-lg font-bold text-slate-900">{bill.units_consumed} kWh</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Amount</p>
            <p className="text-lg font-bold text-slate-900">Rs {bill.total_amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
            <p className="text-sm font-medium">{new Date(bill.due_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Reading</p>
            <p className="text-sm font-medium">{bill.previous_reading} - {bill.current_reading}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Updated SolarMeterCard with document indicator
const SolarMeterCard = ({ meter, getPropertyName, onView, onEdit, onDelete, onViewReceipt }) => {
  const reconciliationOk = !meter.reconciliation_flag;

  return (
    <Card className={`border-slate-200 shadow-sm ${!reconciliationOk ? 'border-l-4 border-l-amber-500' : ''}`} data-testid={`solar-meter-${meter.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-slate-900">{getPropertyName(meter.property_id)}</h3>
              {!reconciliationOk && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  <AlertTriangle size={12} className="mr-1" />
                  Reconciliation Alert
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600">
              {new Date(meter.billing_period_start).toLocaleDateString()} - {new Date(meter.billing_period_end).toLocaleDateString()}
            </p>
            {meter.phone_number && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Phone size={12} className="text-slate-400" />
                {meter.phone_number}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Sun size={20} className="text-amber-500" />
            <span className="text-sm font-semibold">{meter.installed_capacity_kw} kW</span>
            {meter.meter_image_url && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onViewReceipt(
                  meter.meter_image_url,
                  getPropertyName(meter.property_id),
                  'Solar_Meter',
                  new Date(meter.billing_period_start).toLocaleDateString()
                )}
                title="View Meter Image"
              >
                <File size={16} />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => onView(meter)}
              data-testid={`view-solar-${meter.id}`}
            >
              <Eye size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => onEdit(meter)}
              data-testid={`edit-solar-${meter.id}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={onDelete}
              data-testid={`delete-solar-${meter.id}`}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Generated</p>
            <p className="text-lg font-bold text-emerald-700">{meter.units_generated} kWh</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Self Consumed</p>
            <p className="text-lg font-bold text-blue-700">{meter.self_consumed} kWh</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Exported</p>
            <p className="text-lg font-bold text-purple-700">{meter.exported_to_grid} kWh</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Imported</p>
            <p className="text-lg font-bold text-orange-700">{meter.imported_from_grid} kWh</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Billable</p>
            <p className="text-lg font-bold text-slate-900">{meter.billable_units} kWh</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};