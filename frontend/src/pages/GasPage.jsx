import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Fuel, Plus, Eye, Trash2, Upload, File, X, Phone, Flame, Loader2, MapPin, User, Building2, Calendar, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

// Gas Bill Fetcher Component
const GasBillFetcher = ({ propertyId, onSuccess, providers = [] }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [property, setProperty] = useState(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [providerName, setProviderName] = useState('');
  const [fetchedData, setFetchedData] = useState(null);
  const [showSavePropertyPrompt, setShowSavePropertyPrompt] = useState(false);
  
  // Form fields for manual entry after fetch
  const [billingPeriodStart, setBillingPeriodStart] = useState('');
  const [billingPeriodEnd, setBillingPeriodEnd] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [unitsConsumed, setUnitsConsumed] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [fixedCharges, setFixedCharges] = useState('');
  const [totalBill, setTotalBill] = useState('');
  
  // Payment status fields
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [paymentDate, setPaymentDate] = useState('');

  // Fetch property details when dialog opens
  useEffect(() => {
    if (open && propertyId) {
      fetchPropertyDetails();
    }
  }, [open, propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await api.get(`/properties/${propertyId}`);
      setProperty(response.data);
      
      // Pre-fill from property if available
      if (response.data.gas_mobile_number) {
        setMobileNumber(response.data.gas_mobile_number);
      }
      if (response.data.gas_provider) {
        setProviderName(response.data.gas_provider);
      }
    } catch (error) {
      console.error('Failed to fetch property details:', error);
    }
  };

  const saveGasDetailsToProperty = async () => {
    if (!property) return;
    
    setSavingProperty(true);
    try {
      await api.put(`/properties/${propertyId}`, {
        ...property,
        gas_mobile_number: mobileNumber,
        gas_provider: providerName,
        gas_consumer_number: fetchedData?.consumer_id || property.gas_consumer_number,
        gas_consumer_name: fetchedData?.consumer_name || property.gas_consumer_name,
      });
      
      toast.success('Gas connection details saved to property');
      setShowSavePropertyPrompt(false);
      await saveBill();
    } catch (error) {
      toast.error('Failed to save gas details to property');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleFetch = async () => {
    // Check if we have mobile_number from property or from input
    let finalMobileNumber = mobileNumber;
    let finalProviderName = providerName;
    
    // If property has these values but they're not in state, use property values
    if (property?.gas_mobile_number && !finalMobileNumber) {
      finalMobileNumber = property.gas_mobile_number;
      setMobileNumber(property.gas_mobile_number);
    }
    if (property?.gas_provider && !finalProviderName) {
      finalProviderName = property.gas_provider;
      setProviderName(property.gas_provider);
    }

    if (!finalMobileNumber) {
      toast.error('Please enter mobile number');
      return;
    }
    if (finalMobileNumber.length !== 10) {
      toast.error('Mobile number must be 10 digits');
      return;
    }
    if (!finalProviderName) {
      toast.error('Please select provider');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/gas-bills/fetch-from-surepass', {
        mobile_number: finalMobileNumber,
        provider_name: finalProviderName,
        property_id: propertyId
      });
      
      if (response.data.success) {
        setFetchedData(response.data.gas_data);
        
        // Set default dates
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        setBillingPeriodStart(startOfMonth.toISOString().split('T')[0]);
        setBillingPeriodEnd(endOfMonth.toISOString().split('T')[0]);
        
        const dueDateObj = new Date(today);
        dueDateObj.setDate(today.getDate() + 15);
        setDueDate(dueDateObj.toISOString().split('T')[0]);
        
        // Set default values for gas bill
        setRatePerUnit('50');
        setFixedCharges('0');
        
        // Set default payment status to Unpaid
        setPaymentStatus('Unpaid');
        setPaymentDate('');
        
        toast.success('Gas connection details fetched successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fetch gas connection details');
    } finally {
      setLoading(false);
    }
  };

  const saveBill = async () => {
    // Validate payment date if status is Paid
    if (paymentStatus === 'Paid' && !paymentDate) {
      toast.error('Please select payment date');
      return;
    }

    if (!totalBill) {
      toast.error('Please enter total bill amount');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/gas-bills/save-from-surepass', {
        property_id: propertyId,
        gas_data: fetchedData,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        due_date: dueDate,
        units_consumed: parseFloat(unitsConsumed) || 0,
        rate_per_unit: parseFloat(ratePerUnit) || 0,
        fixed_charges: parseFloat(fixedCharges) || 0,
        total_bill: parseFloat(totalBill),
        status: paymentStatus,
        payment_date: paymentStatus === 'Paid' ? new Date(paymentDate).toISOString() : null
      });
      
      if (response.data.success) {
        toast.success('Gas bill saved successfully');
        setOpen(false);
        resetForm();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save gas bill');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    // Check if property has gas_mobile_number and gas_provider saved
    const hasMobileNumber = property?.gas_mobile_number;
    const hasProvider = property?.gas_provider;
    const currentMobileNumber = mobileNumber || property?.gas_mobile_number;
    const currentProviderName = providerName || property?.gas_provider;
    
    // If property doesn't have these values saved, and we have them from the form,
    // prompt user to save them to property
    if ((!hasMobileNumber || !hasProvider) && currentMobileNumber && currentProviderName) {
      setShowSavePropertyPrompt(true);
    } else {
      await saveBill();
    }
  };

  const resetForm = () => {
    setMobileNumber(property?.gas_mobile_number || '');
    setProviderName(property?.gas_provider || '');
    setFetchedData(null);
    setBillingPeriodStart('');
    setBillingPeriodEnd('');
    setDueDate('');
    setUnitsConsumed('');
    setRatePerUnit('');
    setFixedCharges('');
    setTotalBill('');
    setPaymentStatus('Unpaid');
    setPaymentDate('');
    setShowSavePropertyPrompt(false);
  };

  const calculateTotal = () => {
    if (unitsConsumed && ratePerUnit) {
      const total = (parseFloat(unitsConsumed) * parseFloat(ratePerUnit)) + parseFloat(fixedCharges || 0);
      setTotalBill(total.toFixed(2));
    }
  };

  // Check if property has pre-saved values
  const hasPreSavedValues = property?.gas_mobile_number && property?.gas_provider;

  return (
    <Dialog open={open} onOpenChange={(open) => { setOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
          <Flame size={16} className="mr-2" />
          Fetch from Surepass
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame size={20} className="text-orange-600" />
            Fetch Gas Bill from Surepass
          </DialogTitle>
        </DialogHeader>

        {/* Save to Property Prompt Dialog */}
        <Dialog open={showSavePropertyPrompt} onOpenChange={setShowSavePropertyPrompt}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Save size={20} className="text-orange-600" />
                Save Gas Details?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-600">
                Do you want to save the Mobile Number and Gas Provider details to this property for future use?
              </p>
              <div className="bg-orange-50 p-3 rounded-md">
                <p className="text-sm font-medium text-orange-900">Details to save:</p>
                <p className="text-sm text-orange-700 mt-1">
                  <strong>Mobile Number:</strong> {mobileNumber || property?.gas_mobile_number}
                </p>
                <p className="text-sm text-orange-700">
                  <strong>Provider:</strong> {providerName || property?.gas_provider}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSavePropertyPrompt(false);
                    saveBill();
                  }}
                  className="flex-1"
                >
                  No, Just Save Bill
                </Button>
                <Button
                  onClick={saveGasDetailsToProperty}
                  disabled={savingProperty}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {savingProperty ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  {savingProperty ? 'Saving...' : 'Yes, Save to Property'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {!fetchedData ? (
          // Fetch Form
          <div className="space-y-4">
            {/* Show message if property has pre-saved values */}
            {hasPreSavedValues && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <Flame size={14} />
                  This property has saved Gas connection details.
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Mobile: {property.gas_mobile_number} | Provider: {providers.find(p => p.code === property.gas_provider)?.name || property.gas_provider}
                </p>
              </div>
            )}

            {/* Mobile Number Input - shown if property doesn't have it or user wants to override */}
            <div>
              <Label>Mobile Number {!hasPreSavedValues && '*'}</Label>
              <Input
                type="tel"
                placeholder="Enter 10 digit mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                disabled={hasPreSavedValues && mobileNumber === property?.gas_mobile_number}
              />
              <p className="text-xs text-slate-500 mt-1">
                Mobile number registered with gas connection
                {hasPreSavedValues && (
                  <span className="text-green-600 block">Using saved value from property</span>
                )}
              </p>
            </div>

            {/* Gas Provider Input - shown if property doesn't have it or user wants to override */}
            <div>
              <Label>Gas Provider {!hasPreSavedValues && '*'}</Label>
              <Select 
                value={providerName} 
                onValueChange={setProviderName}
                disabled={hasPreSavedValues && providerName === property?.gas_provider}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gas provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.code} value={provider.code}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasPreSavedValues && (
                <p className="text-xs text-green-600 mt-1">Using saved value from property</p>
              )}
            </div>

            <Button
              onClick={handleFetch}
              disabled={loading || (!mobileNumber && !property?.gas_mobile_number) || (!providerName && !property?.gas_provider)}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Flame size={16} className="mr-2" />}
              {loading ? 'Fetching...' : 'Fetch Connection Details'}
            </Button>
          </div>
        ) : (
          // Bill Details Form
          <div className="space-y-4">
            {/* Fetched Gas Connection Summary */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-orange-600" />
                    <span className="font-semibold text-orange-900">Gas Connection Details</span>
                  </div>
                  <Badge className="bg-orange-200 text-orange-700">
                    {fetchedData.provider_name}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-orange-500">Consumer Name</p>
                    <p className="font-medium flex items-center gap-1">
                      <User size={12} /> {fetchedData.consumer_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-500">Consumer ID</p>
                    <p className="font-mono text-xs">{fetchedData.consumer_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-500">Consumer Number</p>
                    <p className="font-mono text-xs">{fetchedData.consumer_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-500">Provider</p>
                    <p className="font-medium">{fetchedData.provider_name || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-orange-500">Address</p>
                    <p className="text-sm flex items-start gap-1">
                      <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                      {fetchedData.address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-500">Distributor</p>
                    <p className="text-sm">{fetchedData.distributor_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-orange-500">Distributor Contact</p>
                    <p className="text-sm flex items-center gap-1">
                      <Phone size={12} /> {fetchedData.distributor_contact || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry Fields */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Bill Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Billing Period Start *</Label>
                  <Input
                    type="date"
                    value={billingPeriodStart}
                    onChange={(e) => setBillingPeriodStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Billing Period End *</Label>
                  <Input
                    type="date"
                    value={billingPeriodEnd}
                    onChange={(e) => setBillingPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <Label>Units Consumed</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 12"
                    value={unitsConsumed}
                    onChange={(e) => {
                      setUnitsConsumed(e.target.value);
                      calculateTotal();
                    }}
                  />
                  <p className="text-xs text-slate-500">KG or SCM</p>
                </div>
                <div>
                  <Label>Rate per Unit (Rs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 50"
                    value={ratePerUnit}
                    onChange={(e) => {
                      setRatePerUnit(e.target.value);
                      calculateTotal();
                    }}
                  />
                </div>
                <div>
                  <Label>Fixed Charges (Rs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 100"
                    value={fixedCharges}
                    onChange={(e) => {
                      setFixedCharges(e.target.value);
                      calculateTotal();
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label>Total Bill (Rs) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Total amount"
                    value={totalBill}
                    onChange={(e) => setTotalBill(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Status Section */}
              <div className="mt-4 pt-4 border-t border-orange-100">
                <h4 className="font-medium mb-3 text-orange-800">Payment Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Status *</Label>
                    <Select
                      value={paymentStatus}
                      onValueChange={(value) => {
                        setPaymentStatus(value);
                        if (value === 'Unpaid') {
                          setPaymentDate('');
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {paymentStatus === 'Paid' && (
                    <div>
                      <Label>Payment Date *</Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setFetchedData(null)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Flame size={16} className="mr-2" />}
                {saving ? 'Saving...' : 'Save Bill'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// FileUploadSection Component
const FileUploadSection = React.memo(({ 
  currentUrl, 
  selectedFile, 
  filePreview, 
  onFileSelect, 
  onClear, 
  propertyName,
  vendor,
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
          onClick={() => openReceipt(currentUrl, propertyName, vendor, date)}
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

// BillForm Component - For Manual Addition/Edit
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

      <div>
        <Label>Vendor *</Label>
        <Input
          required
          value={formData.vendor}
          onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          placeholder="e.g., IGL, MGL"
        />
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
          />
        </div>
        <div>
          <Label>Rate per Unit (Rs) *</Label>
          <Input
            type="number"
            step="0.01"
            required
            value={formData.rate_per_unit}
            onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })}
          />
        </div>
        <div>
          <Label>Fixed Charges (Rs) *</Label>
          <Input
            type="number"
            step="0.01"
            required
            value={formData.fixed_charges}
            onChange={(e) => setFormData({ ...formData, fixed_charges: e.target.value })}
          />
        </div>
      </div>

      <PhoneNumberInput
        value={formData.phone_number || ''}
        onChange={(value) => setFormData({ ...formData, phone_number: value })}
        propertyId={formData.property_id}
        excludeId={selectedBill?.id}
        excludeType="gas"
        label="Phone Number (Optional)"
        placeholder="Enter 10 digit mobile number"
      />

      <FileUploadSection
        currentUrl={formData.bill_url}
        selectedFile={selectedFile}
        filePreview={filePreview}
        onFileSelect={handleFileSelect}
        onClear={clearSelectedFile}
        propertyName={properties.find(p => p.id === formData.property_id)?.name || 'Property'}
        vendor={formData.vendor}
        date={formData.billing_period_start}
        uploading={uploading}
        openReceipt={openReceipt}
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

      <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={uploading}>
        {uploading ? 'Uploading...' : submitText}
      </Button>
    </form>
  );
});

BillForm.displayName = 'BillForm';

export const GasPage = () => {
  const [properties, setProperties] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [providers, setProviders] = useState([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [formData, setFormData] = useState({
    property_id: '',
    billing_period_start: '',
    billing_period_end: '',
    units_consumed: '',
    rate_per_unit: '',
    fixed_charges: '',
    total_bill: '',
    due_date: '',
    payment_date: '',
    status: 'Unpaid',
    vendor: '',
    phone_number: '',
    bill_url: ''
  });

  useEffect(() => {
    fetchData();
    fetchProviders();
  }, [selectedProperty]);

  const fetchData = async () => {
    try {
      const filter = selectedProperty !== 'all' ? `?property_id=${selectedProperty}` : '';
      const [propsRes, billsRes] = await Promise.all([
        api.get('/properties'),
        api.get(`/gas-bills${filter}`)
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

  const fetchProviders = async () => {
    try {
      const response = await api.get('/gas-bills/provider-list');
      setProviders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      // Fallback providers
      setProviders([
        { code: "indane", name: "Indane (Indian Oil)", type: "LPG" },
        { code: "bharat_gas", name: "Bharat Gas (BPCL)", type: "LPG" },
        { code: "hp_gas", name: "HP Gas (Hindustan Petroleum)", type: "LPG" },
        { code: "adani_gas", name: "Adani Gas", type: "PNG" },
        { code: "mahanagar_gas", name: "Mahanagar Gas (MGL)", type: "PNG" },
        { code: "gujarat_gas", name: "Gujarat Gas", type: "PNG" },
      ]);
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

  const openReceipt = (url, propertyName, vendor, date) => {
    if (!url) return;

    const cleanPropertyName = propertyName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanVendor = vendor.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = date || new Date().toISOString().split('T')[0];
    
    if (url.toLowerCase().includes('.pdf') || url.includes('raw/upload')) {
      const filename = `${cleanPropertyName}_${cleanVendor}_Gas_${timestamp}.pdf`;
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
      rate_per_unit: '',
      fixed_charges: '',
      total_bill: '',
      due_date: '',
      payment_date: '',
      status: 'Unpaid',
      vendor: '',
      phone_number: '',
      bill_url: ''
    });
    setSelectedBill(null);
    clearSelectedFile();
  };

  const handleDeleteBill = async () => {
    if (!itemToDelete) return;
    
    try {
      await api.delete(`/gas-bills/${itemToDelete}`);
      toast.success('Gas bill deleted');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to delete gas bill');
    }
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

      await api.post('/gas-bills', {
        ...formData,
        units_consumed: parseFloat(formData.units_consumed),
        rate_per_unit: parseFloat(formData.rate_per_unit),
        fixed_charges: parseFloat(formData.fixed_charges),
        total_bill: parseFloat(formData.total_bill),
        billing_period_start: new Date(formData.billing_period_start).toISOString(),
        billing_period_end: new Date(formData.billing_period_end).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
        bill_url: billUrl
      });
      
      toast.success('Gas bill created successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to create gas bill');
    }
  };

  const handleEdit = (bill) => {
    setSelectedBill(bill);
    setFormData({
      property_id: bill.property_id,
      billing_period_start: new Date(bill.billing_period_start).toISOString().split('T')[0],
      billing_period_end: new Date(bill.billing_period_end).toISOString().split('T')[0],
      units_consumed: bill.units_consumed.toString(),
      rate_per_unit: bill.rate_per_unit.toString(),
      fixed_charges: bill.fixed_charges.toString(),
      total_bill: bill.total_bill.toString(),
      due_date: new Date(bill.due_date).toISOString().split('T')[0],
      payment_date: bill.payment_date ? new Date(bill.payment_date).toISOString().split('T')[0] : '',
      status: bill.status,
      vendor: bill.vendor,
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

      await api.put(`/gas-bills/${selectedBill.id}`, {
        ...formData,
        units_consumed: parseFloat(formData.units_consumed),
        rate_per_unit: parseFloat(formData.rate_per_unit),
        fixed_charges: parseFloat(formData.fixed_charges),
        total_bill: parseFloat(formData.total_bill),
        billing_period_start: new Date(formData.billing_period_start).toISOString(),
        billing_period_end: new Date(formData.billing_period_end).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null,
        bill_url: billUrl
      });
      
      toast.success('Gas bill updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to update gas bill');
    }
  };

  const handleView = (bill) => {
    setSelectedBill(bill);
    setViewDialogOpen(true);
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
    <div className="p-8" data-testid="gas-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Gas Bills
          </h1>
          <p className="text-slate-600">Track gas consumption and bills</p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gas Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this gas bill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBill} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Gas Bill</DialogTitle>
          </DialogHeader>
          <BillForm 
            formData={formData}
            setFormData={setFormData}
            properties={properties}
            selectedBill={selectedBill}
            onSubmit={handleUpdate}
            submitText="Update Gas Bill"
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
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gas Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Fuel size={32} className="text-orange-700" />
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
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Vendor</p>
                  <p className="text-sm font-medium text-slate-900">{selectedBill.vendor}</p>
                </div>
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
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Rate per Unit</p>
                  <p className="text-sm text-slate-700">Rs {selectedBill.rate_per_unit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fixed Charges</p>
                  <p className="text-sm text-slate-700">Rs {selectedBill.fixed_charges}</p>
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
                      <Button
                        variant="link"
                        className="text-blue-600 p-0 h-auto"
                        onClick={() => openReceipt(
                          selectedBill.bill_url,
                          getPropertyName(selectedBill.property_id),
                          selectedBill.vendor,
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

      {/* Add Bill Button and Fetcher */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus size={18} className="mr-2" />
                Add Gas Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Gas Bill</DialogTitle>
              </DialogHeader>
              <BillForm 
                formData={formData}
                setFormData={setFormData}
                properties={properties}
                selectedBill={selectedBill}
                onSubmit={handleSubmit}
                submitText="Create Gas Bill"
                uploading={uploading}
                selectedFile={selectedFile}
                filePreview={filePreview}
                handleFileSelect={handleFileSelect}
                clearSelectedFile={clearSelectedFile}
                openReceipt={openReceipt}
              />
            </DialogContent>
          </Dialog>
          
          {selectedProperty !== 'all' && (
            <GasBillFetcher 
              propertyId={selectedProperty}
              onSuccess={fetchData}
              providers={providers}
            />
          )}
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {bills.map((bill) => (
          <motion.div
            key={bill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid={`gas-bill-${bill.id}`}
          >
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{getPropertyName(bill.property_id)}</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Vendor: {bill.vendor}</p>
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
                          bill.vendor,
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
                      data-testid={`view-gas-${bill.id}`}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleEdit(bill)}
                      data-testid={`edit-gas-${bill.id}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        setItemToDelete(bill.id);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-gas-${bill.id}`}
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
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Rate/Unit</p>
                    <p className="text-lg font-bold text-slate-900">Rs {bill.rate_per_unit}</p>
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
          <Fuel size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No gas bills yet</h3>
          <p className="text-slate-600">Add your first gas bill</p>
        </div>
      )}
    </div>
  );
};