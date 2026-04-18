import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Cloud, Download, Loader2, MapPin, User, Phone, FileText, Calendar, Save } from 'lucide-react';
import api from '../../utils/api';

const ElectricityBillFetcher = ({ propertyId, onSuccess, operatorCodes = [] }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [property, setProperty] = useState(null);
  const [consumerId, setConsumerId] = useState('');
  const [operatorCode, setOperatorCode] = useState('');
  const [fetchedData, setFetchedData] = useState(null);
  const [showSavePropertyPrompt, setShowSavePropertyPrompt] = useState(false);
  
  // Form fields for manual entry after fetch
  const [billingPeriodStart, setBillingPeriodStart] = useState('');
  const [billingPeriodEnd, setBillingPeriodEnd] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [previousReading, setPreviousReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [unitsConsumed, setUnitsConsumed] = useState('');
  const [slabCharges, setSlabCharges] = useState('');
  const [fixedCharges, setFixedCharges] = useState('');
  const [taxes, setTaxes] = useState('');
  const [penalty, setPenalty] = useState('0');

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
      if (response.data.consumer_id) {
        setConsumerId(response.data.consumer_id);
      }
      if (response.data.operator_code) {
        setOperatorCode(response.data.operator_code);
      }
    } catch (error) {
      console.error('Failed to fetch property details:', error);
    }
  };

  const saveConsumerDetailsToProperty = async () => {
    if (!property) return;
    
    setSavingProperty(true);
    try {
      await api.put(`/properties/${propertyId}`, {
        ...property,
        consumer_id: consumerId,
        operator_code: operatorCode,
        consumer_name: fetchedData?.full_name || property.consumer_name,
      });
      
      toast.success('Consumer details saved to property');
      setShowSavePropertyPrompt(false);
      // Proceed to save bill after saving property
      await saveBill();
    } catch (error) {
      toast.error('Failed to save consumer details to property');
    } finally {
      setSavingProperty(false);
    }
  };

  const handleFetch = async () => {
    // Check if we have consumer_id from property or from input
    let finalConsumerId = consumerId;
    let finalOperatorCode = operatorCode;
    
    // If property has these values but they're not in state, use property values
    if (property?.consumer_id && !finalConsumerId) {
      finalConsumerId = property.consumer_id;
      setConsumerId(property.consumer_id);
    }
    if (property?.operator_code && !finalOperatorCode) {
      finalOperatorCode = property.operator_code;
      setOperatorCode(property.operator_code);
    }

    if (!finalConsumerId) {
      toast.error('Please enter Consumer ID');
      return;
    }
    if (!finalOperatorCode) {
      toast.error('Please select Operator');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/electricity-bills/fetch-from-surepass', {
        consumer_id: finalConsumerId,
        operator_code: finalOperatorCode,
        property_id: propertyId
      });
      
      if (response.data.success) {
        setFetchedData(response.data.bill_data);
        
        // Set default dates
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        setBillingPeriodStart(startOfMonth.toISOString().split('T')[0]);
        setBillingPeriodEnd(endOfMonth.toISOString().split('T')[0]);
        
        const dueDateObj = new Date(today);
        dueDateObj.setDate(today.getDate() + 15);
        setDueDate(dueDateObj.toISOString().split('T')[0]);
        
        toast.success('Bill details fetched successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fetch bill details');
    } finally {
      setLoading(false);
    }
  };

  const saveBill = async () => {
    setSaving(true);
    try {
      const response = await api.post('/electricity-bills/save-from-surepass', {
        property_id: propertyId,
        bill_data: fetchedData,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        due_date: dueDate,
        previous_reading: parseFloat(previousReading) || 0,
        current_reading: parseFloat(currentReading) || 0,
        units_consumed: parseFloat(unitsConsumed) || 0,
        slab_charges: parseFloat(slabCharges) || 0,
        fixed_charges: parseFloat(fixedCharges) || 0,
        taxes: parseFloat(taxes) || 0,
        penalty: parseFloat(penalty) || 0
      });
      
      if (response.data.success) {
        toast.success('Electricity bill saved successfully');
        setOpen(false);
        resetForm();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    // Check if property has consumer_id and operator_code saved
    const hasConsumerId = property?.consumer_id;
    const hasOperatorCode = property?.operator_code;
    const currentConsumerId = consumerId || property?.consumer_id;
    const currentOperatorCode = operatorCode || property?.operator_code;
    
    // If property doesn't have these values saved, and we have them from the form,
    // prompt user to save them to property
    if ((!hasConsumerId || !hasOperatorCode) && currentConsumerId && currentOperatorCode) {
      setShowSavePropertyPrompt(true);
    } else {
      await saveBill();
    }
  };

  const resetForm = () => {
    setConsumerId(property?.consumer_id || '');
    setOperatorCode(property?.operator_code || '');
    setFetchedData(null);
    setBillingPeriodStart('');
    setBillingPeriodEnd('');
    setDueDate('');
    setPreviousReading('');
    setCurrentReading('');
    setUnitsConsumed('');
    setSlabCharges('');
    setFixedCharges('');
    setTaxes('');
    setPenalty('0');
    setShowSavePropertyPrompt(false);
  };

  const calculateUnits = () => {
    if (previousReading && currentReading) {
      const units = parseFloat(currentReading) - parseFloat(previousReading);
      setUnitsConsumed(units.toFixed(2));
    }
  };

  // Check if property has pre-saved values
  const hasPreSavedValues = property?.consumer_id && property?.operator_code;
  const showConsumerIdInput = !hasPreSavedValues || (hasPreSavedValues && consumerId !== property?.consumer_id);
  const showOperatorInput = !hasPreSavedValues || (hasPreSavedValues && operatorCode !== property?.operator_code);

  return (
    <Dialog open={open} onOpenChange={(open) => { setOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
          <Cloud size={16} className="mr-2" />
          Fetch from Surepass
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud size={20} className="text-purple-600" />
            Fetch Electricity Bill from Surepass
          </DialogTitle>
        </DialogHeader>

        {/* Save to Property Prompt Dialog */}
        <Dialog open={showSavePropertyPrompt} onOpenChange={setShowSavePropertyPrompt}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Save size={20} className="text-purple-600" />
                Save Consumer Details?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-600">
                Do you want to save the Consumer ID and Operator details to this property for future use?
              </p>
              <div className="bg-purple-50 p-3 rounded-md">
                <p className="text-sm font-medium text-purple-900">Details to save:</p>
                <p className="text-sm text-purple-700 mt-1">
                  <strong>Consumer ID:</strong> {consumerId || property?.consumer_id}
                </p>
                <p className="text-sm text-purple-700">
                  <strong>Operator:</strong> {operatorCode || property?.operator_code}
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
                  onClick={saveConsumerDetailsToProperty}
                  disabled={savingProperty}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
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
                  <FileText size={14} />
                  This property has saved Consumer ID and Operator details.
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Consumer ID: {property.consumer_id} | Operator: {property.operator_code}
                </p>
              </div>
            )}

            {/* Consumer ID Input - shown if property doesn't have it or user wants to override */}
            <div>
              <Label>Consumer ID / Account Number {!hasPreSavedValues && '*'}</Label>
              <Input
                placeholder="Enter electricity consumer ID"
                value={consumerId}
                onChange={(e) => setConsumerId(e.target.value)}
                disabled={hasPreSavedValues && consumerId === property?.consumer_id}
              />
              <p className="text-xs text-slate-500 mt-1">
                Found on your electricity bill (e.g., 1700034632254745)
                {hasPreSavedValues && (
                  <span className="text-green-600 block">Using saved value from property</span>
                )}
              </p>
            </div>

            {/* Operator Input - shown if property doesn't have it or user wants to override */}
            <div>
              <Label>Operator / State {!hasPreSavedValues && '*'}</Label>
              <Select 
                value={operatorCode} 
                onValueChange={setOperatorCode}
                disabled={hasPreSavedValues && operatorCode === property?.operator_code}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state/operator" />
                </SelectTrigger>
                <SelectContent>
                  {operatorCodes.map((op) => (
                    <SelectItem key={op.code} value={op.code}>
                      {op.name} ({op.code})
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
              disabled={loading || (!consumerId && !property?.consumer_id) || (!operatorCode && !property?.operator_code)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Cloud size={16} className="mr-2" />}
              {loading ? 'Fetching...' : 'Fetch Bill Details'}
            </Button>
          </div>
        ) : (
          // Bill Details Form
          <div className="space-y-4">
            {/* Fetched Bill Summary */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-purple-600" />
                    <span className="font-semibold text-purple-900">Fetched Bill Details</span>
                  </div>
                  <Badge className="bg-purple-200 text-purple-700">
                    {fetchedData.operator_code}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-purple-500">Consumer Name</p>
                    <p className="font-medium flex items-center gap-1">
                      <User size={12} /> {fetchedData.full_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-500">Bill Amount</p>
                    <p className="font-bold text-lg text-purple-700">₹{fetchedData.bill_amount?.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-purple-500">Address</p>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin size={12} /> {fetchedData.address || 'N/A'}
                    </p>
                  </div>
                  {fetchedData.mobile && (
                    <div>
                      <p className="text-xs text-purple-500">Mobile</p>
                      <p className="text-sm flex items-center gap-1">
                        <Phone size={12} /> {fetchedData.mobile}
                      </p>
                    </div>
                  )}
                  {fetchedData.email && (
                    <div>
                      <p className="text-xs text-purple-500">Email</p>
                      <p className="text-sm">{fetchedData.email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry Fields */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Additional Information</h4>
              
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

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label>Previous Reading (kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={previousReading}
                    onChange={(e) => {
                      setPreviousReading(e.target.value);
                      calculateUnits();
                    }}
                  />
                </div>
                <div>
                  <Label>Current Reading (kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentReading}
                    onChange={(e) => {
                      setCurrentReading(e.target.value);
                      calculateUnits();
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <Label>Units Consumed (kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={unitsConsumed}
                    onChange={(e) => setUnitsConsumed(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Slab Charges (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={slabCharges}
                    onChange={(e) => setSlabCharges(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fixed Charges (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fixedCharges}
                    onChange={(e) => setFixedCharges(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <Label>Taxes (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={taxes}
                    onChange={(e) => setTaxes(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Penalty (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={penalty}
                    onChange={(e) => setPenalty(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
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
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Download size={16} className="mr-2" />}
                {saving ? 'Saving...' : 'Save Bill'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ElectricityBillFetcher;