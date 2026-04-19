import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Flame, Loader2, MapPin, User, Phone, Calendar, Save } from 'lucide-react';
import api from '../../utils/api';

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

export default GasBillFetcher;