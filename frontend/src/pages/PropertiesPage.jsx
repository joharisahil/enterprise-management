import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Building2, Plus, Edit, Trash2, MapPin, Eye, X, Zap, Cloud, Loader2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [operatorCodes, setOperatorCodes] = useState([]);
  const [gasProviders, setGasProviders] = useState([]);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [fetchedBillData, setFetchedBillData] = useState(null);
  const [showBillFetchDialog, setShowBillFetchDialog] = useState(false);
  const [fetchingGasBill, setFetchingGasBill] = useState(false);
  const [fetchedGasBillData, setFetchedGasBillData] = useState(null);
  const [showGasBillFetchDialog, setShowGasBillFetchDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Commercial',
    address: '',
    area_sqft: '',
    // Electricity bill fields
    consumer_id: '',
    operator_code: '',
    consumer_name: '',
    electricity_board: '',
    circle: '',
    division: '',
    sub_division: '',
    meter_number: '',
    sanctioned_load_kw: '',
    connection_type: '',
    tariff_category: '',
    // Gas connection fields
    gas_mobile_number: '',
    gas_provider: '',
    gas_consumer_number: '',
    gas_consumer_name: '',
  });

  // Bill fetch form data for electricity
  const [billFetchData, setBillFetchData] = useState({
    consumer_id: '',
    operator_code: '',
    billing_period_start: '',
    billing_period_end: '',
    due_date: '',
    previous_reading: '',
    current_reading: '',
    units_consumed: '',
    slab_charges: '',
    fixed_charges: '',
    taxes: '',
    penalty: '0'
  });

  // Bill fetch form data for gas
  const [gasBillFetchData, setGasBillFetchData] = useState({
    mobile_number: '',
    provider_name: '',
    billing_period_start: '',
    billing_period_end: '',
    due_date: '',
    units_consumed: '',
    rate_per_unit: '',
    fixed_charges: '',
    total_bill: ''
  });

  useEffect(() => {
    fetchProperties();
    fetchOperatorCodes();
    fetchGasProviders();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data.data);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load properties');
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
      setOperatorCodes([
        { code: "MH", name: "Maharashtra", state: "Maharashtra" },
        { code: "DL", name: "Delhi", state: "Delhi" },
        { code: "GJ", name: "Gujarat", state: "Gujarat" },
        { code: "TN", name: "Tamil Nadu", state: "Tamil Nadu" },
        { code: "KA", name: "Karnataka", state: "Karnataka" },
        { code: "UP", name: "Uttar Pradesh", state: "Uttar Pradesh" },
        { code: "WB", name: "West Bengal", state: "West Bengal" },
        { code: "RJ", name: "Rajasthan", state: "Rajasthan" },
        { code: "MP", name: "Madhya Pradesh", state: "Madhya Pradesh" },
        { code: "AP", name: "Andhra Pradesh", state: "Andhra Pradesh" },
        { code: "TS", name: "Telangana", state: "Telangana" },
        { code: "KL", name: "Kerala", state: "Kerala" },
        { code: "PB", name: "Punjab", state: "Punjab" },
        { code: "HR", name: "Haryana", state: "Haryana" },
        { code: "BR", name: "Bihar", state: "Bihar" },
      ]);
    }
  };

  const fetchGasProviders = async () => {
    try {
      const response = await api.get('/gas-bills/provider-list');
      setGasProviders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch gas providers:', error);
      setGasProviders([
        { code: "indane", name: "Indane (Indian Oil)", type: "LPG" },
        { code: "bharat_gas", name: "Bharat Gas (BPCL)", type: "LPG" },
        { code: "hp_gas", name: "HP Gas (Hindustan Petroleum)", type: "LPG" },
        { code: "adani_gas", name: "Adani Gas", type: "PNG" },
        { code: "mahanagar_gas", name: "Mahanagar Gas (MGL)", type: "PNG" },
        { code: "gujarat_gas", name: "Gujarat Gas", type: "PNG" },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        area_sqft: parseFloat(formData.area_sqft),
        // Electricity fields
        consumer_id: formData.consumer_id || null,
        operator_code: formData.operator_code || null,
        consumer_name: formData.consumer_name || null,
        electricity_board: formData.electricity_board || null,
        circle: formData.circle || null,
        division: formData.division || null,
        sub_division: formData.sub_division || null,
        meter_number: formData.meter_number || null,
        sanctioned_load_kw: formData.sanctioned_load_kw ? parseFloat(formData.sanctioned_load_kw) : null,
        connection_type: formData.connection_type || null,
        tariff_category: formData.tariff_category || null,
        // Gas fields
        gas_mobile_number: formData.gas_mobile_number || null,
        gas_provider: formData.gas_provider || null,
        gas_consumer_number: formData.gas_consumer_number || null,
        gas_consumer_name: formData.gas_consumer_name || null,
      };
      
      await api.post('/properties', payload);
      
      toast.success('Property created successfully');
      setDialogOpen(false);
      resetForm();
      fetchProperties();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to create property');
    }
  };

  const handleEdit = (property) => {
    setSelectedProperty(property);
    setFormData({
      name: property.name,
      type: property.type,
      address: property.address,
      area_sqft: property.area_sqft.toString(),
      // Electricity fields
      consumer_id: property.consumer_id || '',
      operator_code: property.operator_code || '',
      consumer_name: property.consumer_name || '',
      electricity_board: property.electricity_board || '',
      circle: property.circle || '',
      division: property.division || '',
      sub_division: property.sub_division || '',
      meter_number: property.meter_number || '',
      sanctioned_load_kw: property.sanctioned_load_kw?.toString() || '',
      connection_type: property.connection_type || '',
      tariff_category: property.tariff_category || '',
      // Gas fields
      gas_mobile_number: property.gas_mobile_number || '',
      gas_provider: property.gas_provider || '',
      gas_consumer_number: property.gas_consumer_number || '',
      gas_consumer_name: property.gas_consumer_name || '',
    });
    setEditDialogOpen(true);
  };

  const handleView = (property) => {
    setSelectedProperty(property);
    setViewDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        area_sqft: parseFloat(formData.area_sqft),
        // Electricity fields
        consumer_id: formData.consumer_id || null,
        operator_code: formData.operator_code || null,
        consumer_name: formData.consumer_name || null,
        electricity_board: formData.electricity_board || null,
        circle: formData.circle || null,
        division: formData.division || null,
        sub_division: formData.sub_division || null,
        meter_number: formData.meter_number || null,
        sanctioned_load_kw: formData.sanctioned_load_kw ? parseFloat(formData.sanctioned_load_kw) : null,
        connection_type: formData.connection_type || null,
        tariff_category: formData.tariff_category || null,
        // Gas fields
        gas_mobile_number: formData.gas_mobile_number || null,
        gas_provider: formData.gas_provider || null,
        gas_consumer_number: formData.gas_consumer_number || null,
        gas_consumer_name: formData.gas_consumer_name || null,
      };
      
      await api.put(`/properties/${selectedProperty.id}`, payload);
      
      toast.success('Property updated successfully');
      setEditDialogOpen(false);
      setSelectedProperty(null);
      resetForm();
      fetchProperties();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to update property');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted');
      fetchProperties();
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to delete property');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Commercial',
      address: '',
      area_sqft: '',
      consumer_id: '',
      operator_code: '',
      consumer_name: '',
      electricity_board: '',
      circle: '',
      division: '',
      sub_division: '',
      meter_number: '',
      sanctioned_load_kw: '',
      connection_type: '',
      tariff_category: '',
      gas_mobile_number: '',
      gas_provider: '',
      gas_consumer_number: '',
      gas_consumer_name: '',
    });
  };

  const resetBillFetchForm = () => {
    setBillFetchData({
      consumer_id: '',
      operator_code: '',
      billing_period_start: '',
      billing_period_end: '',
      due_date: '',
      previous_reading: '',
      current_reading: '',
      units_consumed: '',
      slab_charges: '',
      fixed_charges: '',
      taxes: '',
      penalty: '0'
    });
    setFetchedBillData(null);
  };

  const resetGasBillFetchForm = () => {
    setGasBillFetchData({
      mobile_number: '',
      provider_name: '',
      billing_period_start: '',
      billing_period_end: '',
      due_date: '',
      units_consumed: '',
      rate_per_unit: '',
      fixed_charges: '',
      total_bill: ''
    });
    setFetchedGasBillData(null);
  };

  const handleFetchBill = async () => {
    const property = selectedProperty;
    const consumerId = billFetchData.consumer_id || property?.consumer_id;
    const operatorCode = billFetchData.operator_code || property?.operator_code;

    if (!consumerId) {
      toast.error('Please enter Consumer ID');
      return;
    }
    if (!operatorCode) {
      toast.error('Please select Operator');
      return;
    }

    setFetchingBill(true);
    try {
      const response = await api.post('/electricity-bills/fetch-from-surepass', {
        consumer_id: consumerId,
        operator_code: operatorCode,
        property_id: property?.id
      });
      
      if (response.data.success) {
        setFetchedBillData(response.data.bill_data);
        
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        setBillFetchData(prev => ({
          ...prev,
          billing_period_start: startOfMonth.toISOString().split('T')[0],
          billing_period_end: endOfMonth.toISOString().split('T')[0],
          due_date: new Date(today.setDate(today.getDate() + 15)).toISOString().split('T')[0]
        }));
        
        toast.success('Bill details fetched successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fetch bill details');
    } finally {
      setFetchingBill(false);
    }
  };

  const handleFetchGasBill = async () => {
    const property = selectedProperty;
    const mobileNumber = gasBillFetchData.mobile_number || property?.gas_mobile_number;
    const providerName = gasBillFetchData.provider_name || property?.gas_provider;

    if (!mobileNumber) {
      toast.error('Please enter Mobile Number');
      return;
    }
    if (mobileNumber.length !== 10) {
      toast.error('Mobile number must be 10 digits');
      return;
    }
    if (!providerName) {
      toast.error('Please select Gas Provider');
      return;
    }

    setFetchingGasBill(true);
    try {
      const response = await api.post('/gas-bills/fetch-from-surepass', {
        mobile_number: mobileNumber,
        provider_name: providerName,
        property_id: property?.id
      });
      
      if (response.data.success) {
        setFetchedGasBillData(response.data.gas_data);
        
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        setGasBillFetchData(prev => ({
          ...prev,
          billing_period_start: startOfMonth.toISOString().split('T')[0],
          billing_period_end: endOfMonth.toISOString().split('T')[0],
          due_date: new Date(today.setDate(today.getDate() + 15)).toISOString().split('T')[0],
          rate_per_unit: '50',
          fixed_charges: '0'
        }));
        
        toast.success('Gas connection details fetched successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fetch gas connection details');
    } finally {
      setFetchingGasBill(false);
    }
  };

  const handleSaveBill = async () => {
    if (!selectedProperty) return;

    try {
      await api.post('/electricity-bills/save-from-surepass', {
        property_id: selectedProperty.id,
        bill_data: fetchedBillData,
        billing_period_start: billFetchData.billing_period_start,
        billing_period_end: billFetchData.billing_period_end,
        due_date: billFetchData.due_date,
        previous_reading: parseFloat(billFetchData.previous_reading) || 0,
        current_reading: parseFloat(billFetchData.current_reading) || 0,
        units_consumed: parseFloat(billFetchData.units_consumed) || 0,
        slab_charges: parseFloat(billFetchData.slab_charges) || 0,
        fixed_charges: parseFloat(billFetchData.fixed_charges) || 0,
        taxes: parseFloat(billFetchData.taxes) || 0,
        penalty: parseFloat(billFetchData.penalty) || 0
      });
      
      toast.success('Electricity bill saved successfully');
      setShowBillFetchDialog(false);
      resetBillFetchForm();
      setFetchedBillData(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save bill');
    }
  };

  const handleSaveGasBill = async () => {
    if (!selectedProperty) return;

    try {
      await api.post('/gas-bills/save-from-surepass', {
        property_id: selectedProperty.id,
        gas_data: fetchedGasBillData,
        billing_period_start: gasBillFetchData.billing_period_start,
        billing_period_end: gasBillFetchData.billing_period_end,
        due_date: gasBillFetchData.due_date,
        units_consumed: parseFloat(gasBillFetchData.units_consumed) || 0,
        rate_per_unit: parseFloat(gasBillFetchData.rate_per_unit) || 0,
        fixed_charges: parseFloat(gasBillFetchData.fixed_charges) || 0,
        total_bill: parseFloat(gasBillFetchData.total_bill) || 0
      });
      
      toast.success('Gas bill saved successfully');
      setShowGasBillFetchDialog(false);
      resetGasBillFetchForm();
      setFetchedGasBillData(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save gas bill');
    }
  };

  const calculateUnits = () => {
    if (billFetchData.previous_reading && billFetchData.current_reading) {
      const units = parseFloat(billFetchData.current_reading) - parseFloat(billFetchData.previous_reading);
      setBillFetchData(prev => ({ ...prev, units_consumed: units.toFixed(2) }));
    }
  };

  const calculateGasTotal = () => {
    if (gasBillFetchData.units_consumed && gasBillFetchData.rate_per_unit) {
      const total = (parseFloat(gasBillFetchData.units_consumed) * parseFloat(gasBillFetchData.rate_per_unit)) + parseFloat(gasBillFetchData.fixed_charges || 0);
      setGasBillFetchData(prev => ({ ...prev, total_bill: total.toFixed(2) }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="properties-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Properties
          </h1>
          <p className="text-slate-600">Manage your commercial, residential & industrial properties</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900" data-testid="add-property-button">
              <Plus size={18} className="mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="electricity">Electricity Details</TabsTrigger>
                <TabsTrigger value="gas">Gas Connection</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Property Name *</Label>
                    <Input
                      id="name"
                      required
                      data-testid="property-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Mumbai Office Complex"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Property Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger data-testid="property-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      required
                      data-testid="property-address-input"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="area_sqft">Area (sq ft) *</Label>
                    <Input
                      id="area_sqft"
                      type="number"
                      required
                      data-testid="property-area-input"
                      value={formData.area_sqft}
                      onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="electricity" className="space-y-4">
                  <div>
                    <Label htmlFor="consumer_id">Consumer ID / Account Number</Label>
                    <Input
                      id="consumer_id"
                      value={formData.consumer_id}
                      onChange={(e) => setFormData({ ...formData, consumer_id: e.target.value })}
                      placeholder="e.g., 1700034632254745"
                    />
                    <p className="text-xs text-slate-500 mt-1">Found on your electricity bill</p>
                  </div>

                  <div>
                    <Label htmlFor="operator_code">Operator / State</Label>
                    <Select
                      value={formData.operator_code}
                      onValueChange={(value) => setFormData({ ...formData, operator_code: value })}
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
                  </div>

                  <div>
                    <Label htmlFor="consumer_name">Consumer Name</Label>
                    <Input
                      id="consumer_name"
                      value={formData.consumer_name}
                      onChange={(e) => setFormData({ ...formData, consumer_name: e.target.value })}
                      placeholder="Name as per electricity bill"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="electricity_board">Electricity Board</Label>
                      <Input
                        id="electricity_board"
                        value={formData.electricity_board}
                        onChange={(e) => setFormData({ ...formData, electricity_board: e.target.value })}
                        placeholder="e.g., MSEB, TATA Power"
                      />
                    </div>
                    <div>
                      <Label htmlFor="circle">Circle</Label>
                      <Input
                        id="circle"
                        value={formData.circle}
                        onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
                        placeholder="Circle name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="division">Division</Label>
                      <Input
                        id="division"
                        value={formData.division}
                        onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                        placeholder="Division name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sub_division">Sub-Division</Label>
                      <Input
                        id="sub_division"
                        value={formData.sub_division}
                        onChange={(e) => setFormData({ ...formData, sub_division: e.target.value })}
                        placeholder="Sub-division name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meter_number">Meter Number</Label>
                      <Input
                        id="meter_number"
                        value={formData.meter_number}
                        onChange={(e) => setFormData({ ...formData, meter_number: e.target.value })}
                        placeholder="Electricity meter number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sanctioned_load_kw">Sanctioned Load (kW)</Label>
                      <Input
                        id="sanctioned_load_kw"
                        type="number"
                        step="0.01"
                        value={formData.sanctioned_load_kw}
                        onChange={(e) => setFormData({ ...formData, sanctioned_load_kw: e.target.value })}
                        placeholder="e.g., 5.0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="connection_type">Connection Type</Label>
                      <Select
                        value={formData.connection_type}
                        onValueChange={(value) => setFormData({ ...formData, connection_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select connection type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Residential">Residential</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                          <SelectItem value="Industrial">Industrial</SelectItem>
                          <SelectItem value="Agricultural">Agricultural</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tariff_category">Tariff Category</Label>
                      <Input
                        id="tariff_category"
                        value={formData.tariff_category}
                        onChange={(e) => setFormData({ ...formData, tariff_category: e.target.value })}
                        placeholder="e.g., LT-I, HT-II"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="gas" className="space-y-4">
                  <div>
                    <Label htmlFor="gas_mobile_number">Mobile Number (Registered with Gas Connection)</Label>
                    <Input
                      id="gas_mobile_number"
                      type="tel"
                      maxLength={10}
                      value={formData.gas_mobile_number}
                      onChange={(e) => setFormData({ ...formData, gas_mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="Enter 10 digit mobile number"
                    />
                    <p className="text-xs text-slate-500 mt-1">Mobile number registered with gas connection</p>
                  </div>

                  <div>
                    <Label htmlFor="gas_provider">Gas Provider</Label>
                    <Select
                      value={formData.gas_provider}
                      onValueChange={(value) => setFormData({ ...formData, gas_provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gas provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {gasProviders.map((provider) => (
                          <SelectItem key={provider.code} value={provider.code}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="gas_consumer_number">Consumer Number</Label>
                    <Input
                      id="gas_consumer_number"
                      value={formData.gas_consumer_number}
                      onChange={(e) => setFormData({ ...formData, gas_consumer_number: e.target.value })}
                      placeholder="Gas consumer number (if known)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gas_consumer_name">Consumer Name</Label>
                    <Input
                      id="gas_consumer_name"
                      value={formData.gas_consumer_name}
                      onChange={(e) => setFormData({ ...formData, gas_consumer_name: e.target.value })}
                      placeholder="Name as per gas connection"
                    />
                  </div>
                </TabsContent>

                <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900" data-testid="submit-property-button">
                  Create Property
                </Button>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="electricity">Electricity Details</TabsTrigger>
              <TabsTrigger value="gas">Gas Connection</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleUpdate} className="space-y-4 mt-4">
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Property Name *</Label>
                  <Input
                    id="edit-name"
                    required
                    data-testid="edit-property-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mumbai Office Complex"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-type">Property Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger data-testid="edit-property-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-address">Address *</Label>
                  <Input
                    id="edit-address"
                    required
                    data-testid="edit-property-address-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-area_sqft">Area (sq ft) *</Label>
                  <Input
                    id="edit-area_sqft"
                    type="number"
                    required
                    data-testid="edit-property-area-input"
                    value={formData.area_sqft}
                    onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                    placeholder="5000"
                  />
                </div>
              </TabsContent>

              <TabsContent value="electricity" className="space-y-4">
                <div>
                  <Label htmlFor="edit-consumer_id">Consumer ID / Account Number</Label>
                  <Input
                    id="edit-consumer_id"
                    value={formData.consumer_id}
                    onChange={(e) => setFormData({ ...formData, consumer_id: e.target.value })}
                    placeholder="e.g., 1700034632254745"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-operator_code">Operator / State</Label>
                  <Select
                    value={formData.operator_code}
                    onValueChange={(value) => setFormData({ ...formData, operator_code: value })}
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
                </div>

                <div>
                  <Label htmlFor="edit-consumer_name">Consumer Name</Label>
                  <Input
                    id="edit-consumer_name"
                    value={formData.consumer_name}
                    onChange={(e) => setFormData({ ...formData, consumer_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-electricity_board">Electricity Board</Label>
                    <Input
                      id="edit-electricity_board"
                      value={formData.electricity_board}
                      onChange={(e) => setFormData({ ...formData, electricity_board: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-circle">Circle</Label>
                    <Input
                      id="edit-circle"
                      value={formData.circle}
                      onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-division">Division</Label>
                    <Input
                      id="edit-division"
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-sub_division">Sub-Division</Label>
                    <Input
                      id="edit-sub_division"
                      value={formData.sub_division}
                      onChange={(e) => setFormData({ ...formData, sub_division: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gas" className="space-y-4">
                <div>
                  <Label htmlFor="edit-gas_mobile_number">Mobile Number (Registered with Gas Connection)</Label>
                  <Input
                    id="edit-gas_mobile_number"
                    type="tel"
                    maxLength={10}
                    value={formData.gas_mobile_number}
                    onChange={(e) => setFormData({ ...formData, gas_mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Enter 10 digit mobile number"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-gas_provider">Gas Provider</Label>
                  <Select
                    value={formData.gas_provider}
                    onValueChange={(value) => setFormData({ ...formData, gas_provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gas provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {gasProviders.map((provider) => (
                        <SelectItem key={provider.code} value={provider.code}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-gas_consumer_number">Consumer Number</Label>
                  <Input
                    id="edit-gas_consumer_number"
                    value={formData.gas_consumer_number}
                    onChange={(e) => setFormData({ ...formData, gas_consumer_number: e.target.value })}
                    placeholder="Gas consumer number (if known)"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-gas_consumer_name">Consumer Name</Label>
                  <Input
                    id="edit-gas_consumer_name"
                    value={formData.gas_consumer_name}
                    onChange={(e) => setFormData({ ...formData, gas_consumer_name: e.target.value })}
                    placeholder="Name as per gas connection"
                  />
                </div>
              </TabsContent>

              <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900" data-testid="update-property-button">
                Update Property
              </Button>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="electricity">Electricity Details</TabsTrigger>
                <TabsTrigger value="gas">Gas Connection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 size={32} className="text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{selectedProperty.name}</h3>
                    <Badge variant="outline">{selectedProperty.type}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 text-slate-500" />
                      <p className="text-sm text-slate-700">{selectedProperty.address}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Area</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedProperty.area_sqft.toLocaleString()} sq ft</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Created</p>
                    <p className="text-sm text-slate-700">{new Date(selectedProperty.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Property ID</p>
                    <p className="text-xs text-slate-500 font-mono">{selectedProperty.id}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="electricity" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Consumer ID</p>
                    <p className="text-sm font-mono">{selectedProperty.consumer_id || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Operator</p>
                    <p className="text-sm">{selectedProperty.operator_code || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Consumer Name</p>
                    <p className="text-sm">{selectedProperty.consumer_name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Electricity Board</p>
                    <p className="text-sm">{selectedProperty.electricity_board || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Circle</p>
                    <p className="text-sm">{selectedProperty.circle || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Division</p>
                    <p className="text-sm">{selectedProperty.division || 'Not set'}</p>
                  </div>
                </div>

                {(selectedProperty.consumer_id || selectedProperty.operator_code) && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => {
                        setBillFetchData({
                          ...billFetchData,
                          consumer_id: selectedProperty.consumer_id || '',
                          operator_code: selectedProperty.operator_code || '',
                        });
                        setShowBillFetchDialog(true);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Cloud size={16} className="mr-2" />
                      Fetch Electricity Bill
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="gas" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Mobile Number</p>
                    <p className="text-sm">{selectedProperty.gas_mobile_number || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Gas Provider</p>
                    <p className="text-sm">{selectedProperty.gas_provider ? gasProviders.find(p => p.code === selectedProperty.gas_provider)?.name || selectedProperty.gas_provider : 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Consumer Number</p>
                    <p className="text-sm font-mono">{selectedProperty.gas_consumer_number || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Consumer Name</p>
                    <p className="text-sm">{selectedProperty.gas_consumer_name || 'Not set'}</p>
                  </div>
                </div>

                {(selectedProperty.gas_mobile_number || selectedProperty.gas_provider) && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => {
                        setGasBillFetchData({
                          ...gasBillFetchData,
                          mobile_number: selectedProperty.gas_mobile_number || '',
                          provider_name: selectedProperty.gas_provider || '',
                        });
                        setShowGasBillFetchDialog(true);
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <Flame size={16} className="mr-2" />
                      Fetch Gas Bill
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Fetch Electricity Bill Dialog */}
      <Dialog open={showBillFetchDialog} onOpenChange={(open) => { setShowBillFetchDialog(open); if (!open) resetBillFetchForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap size={20} className="text-purple-600" />
              Fetch Electricity Bill
            </DialogTitle>
          </DialogHeader>

          {!fetchedBillData ? (
            <div className="space-y-4">
              <div>
                <Label>Consumer ID / Account Number *</Label>
                <Input
                  placeholder="Enter electricity consumer ID"
                  value={billFetchData.consumer_id}
                  onChange={(e) => setBillFetchData(prev => ({ ...prev, consumer_id: e.target.value }))}
                />
                <p className="text-xs text-slate-500 mt-1">Found on your electricity bill</p>
              </div>

              <div>
                <Label>Operator / State *</Label>
                <Select
                  value={billFetchData.operator_code}
                  onValueChange={(value) => setBillFetchData(prev => ({ ...prev, operator_code: value }))}
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
              </div>

              <Button
                onClick={handleFetchBill}
                disabled={fetchingBill}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {fetchingBill ? <Loader2 size={16} className="animate-spin mr-2" /> : <Cloud size={16} className="mr-2" />}
                {fetchingBill ? 'Fetching...' : 'Fetch Bill Details'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-purple-600" />
                      <span className="font-semibold text-purple-900">Fetched Bill Details</span>
                    </div>
                    <Badge className="bg-purple-200 text-purple-700">
                      {fetchedBillData.operator_code}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-purple-500">Consumer Name</p>
                      <p className="font-medium">{fetchedBillData.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-500">Bill Amount</p>
                      <p className="font-bold text-lg text-purple-700">₹{fetchedBillData.bill_amount?.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-purple-500">Address</p>
                      <p className="text-sm flex items-center gap-1">
                        <MapPin size={12} /> {fetchedBillData.address || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Additional Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Billing Period Start *</Label>
                    <Input
                      type="date"
                      value={billFetchData.billing_period_start}
                      onChange={(e) => setBillFetchData(prev => ({ ...prev, billing_period_start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Billing Period End *</Label>
                    <Input
                      type="date"
                      value={billFetchData.billing_period_end}
                      onChange={(e) => setBillFetchData(prev => ({ ...prev, billing_period_end: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>Previous Reading (kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={billFetchData.previous_reading}
                      onChange={(e) => {
                        setBillFetchData(prev => ({ ...prev, previous_reading: e.target.value }));
                        calculateUnits();
                      }}
                    />
                  </div>
                  <div>
                    <Label>Current Reading (kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={billFetchData.current_reading}
                      onChange={(e) => {
                        setBillFetchData(prev => ({ ...prev, current_reading: e.target.value }));
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
                      value={billFetchData.units_consumed}
                      onChange={(e) => setBillFetchData(prev => ({ ...prev, units_consumed: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Slab Charges (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={billFetchData.slab_charges}
                      onChange={(e) => setBillFetchData(prev => ({ ...prev, slab_charges: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Fixed Charges (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={billFetchData.fixed_charges}
                      onChange={(e) => setBillFetchData(prev => ({ ...prev, fixed_charges: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <Label>Taxes (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={billFetchData.taxes}
                      onChange={(e) => setBillFetchData(prev => ({ ...prev, taxes: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Penalty (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={billFetchData.penalty}
                      onChange={(e) => setBillFetchData(prev => ({ ...prev, penalty: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={billFetchData.due_date}
                      onChange={(e) => setBillFetchData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFetchedBillData(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveBill}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Save Bill
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fetch Gas Bill Dialog */}
      <Dialog open={showGasBillFetchDialog} onOpenChange={(open) => { setShowGasBillFetchDialog(open); if (!open) resetGasBillFetchForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame size={20} className="text-orange-600" />
              Fetch Gas Bill
            </DialogTitle>
          </DialogHeader>

          {!fetchedGasBillData ? (
            <div className="space-y-4">
              <div>
                <Label>Mobile Number *</Label>
                <Input
                  type="tel"
                  placeholder="Enter 10 digit mobile number"
                  value={gasBillFetchData.mobile_number}
                  onChange={(e) => setGasBillFetchData(prev => ({ ...prev, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  maxLength={10}
                />
                <p className="text-xs text-slate-500 mt-1">Mobile number registered with gas connection</p>
              </div>

              <div>
                <Label>Gas Provider *</Label>
                <Select
                  value={gasBillFetchData.provider_name}
                  onValueChange={(value) => setGasBillFetchData(prev => ({ ...prev, provider_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gas provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {gasProviders.map((provider) => (
                      <SelectItem key={provider.code} value={provider.code}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleFetchGasBill}
                disabled={fetchingGasBill}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {fetchingGasBill ? <Loader2 size={16} className="animate-spin mr-2" /> : <Flame size={16} className="mr-2" />}
                {fetchingGasBill ? 'Fetching...' : 'Fetch Connection Details'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-orange-600" />
                      <span className="font-semibold text-orange-900">Gas Connection Details</span>
                    </div>
                    <Badge className="bg-orange-200 text-orange-700">
                      {fetchedGasBillData.provider_name}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-orange-500">Consumer Name</p>
                      <p className="font-medium">{fetchedGasBillData.consumer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-orange-500">Consumer ID</p>
                      <p className="font-mono text-xs">{fetchedGasBillData.consumer_id || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-orange-500">Address</p>
                      <p className="text-sm flex items-center gap-1">
                        <MapPin size={12} /> {fetchedGasBillData.address || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-orange-500">Distributor</p>
                      <p className="text-sm">{fetchedGasBillData.distributor_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-orange-500">Distributor Contact</p>
                      <p className="text-sm">{fetchedGasBillData.distributor_contact || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Bill Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Billing Period Start *</Label>
                    <Input
                      type="date"
                      value={gasBillFetchData.billing_period_start}
                      onChange={(e) => setGasBillFetchData(prev => ({ ...prev, billing_period_start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Billing Period End *</Label>
                    <Input
                      type="date"
                      value={gasBillFetchData.billing_period_end}
                      onChange={(e) => setGasBillFetchData(prev => ({ ...prev, billing_period_end: e.target.value }))}
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
                      value={gasBillFetchData.units_consumed}
                      onChange={(e) => {
                        setGasBillFetchData(prev => ({ ...prev, units_consumed: e.target.value }));
                        calculateGasTotal();
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
                      value={gasBillFetchData.rate_per_unit}
                      onChange={(e) => {
                        setGasBillFetchData(prev => ({ ...prev, rate_per_unit: e.target.value }));
                        calculateGasTotal();
                      }}
                    />
                  </div>
                  <div>
                    <Label>Fixed Charges (Rs)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 100"
                      value={gasBillFetchData.fixed_charges}
                      onChange={(e) => {
                        setGasBillFetchData(prev => ({ ...prev, fixed_charges: e.target.value }));
                        calculateGasTotal();
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
                      value={gasBillFetchData.total_bill}
                      onChange={(e) => setGasBillFetchData(prev => ({ ...prev, total_bill: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      required
                      value={gasBillFetchData.due_date}
                      onChange={(e) => setGasBillFetchData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFetchedGasBillData(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveGasBill}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Save Bill
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            data-testid={`property-card-${property.id}`}
          >
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <Building2 size={24} className="text-blue-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{property.type}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{property.address}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {property.area_sqft.toLocaleString()} sq ft
                    </span>
                    {property.consumer_id && (
                      <Badge variant="outline" className="text-xs bg-purple-50">
                        <Zap size={10} className="mr-1" />
                        Elec Ready
                      </Badge>
                    )}
                    {property.gas_mobile_number && (
                      <Badge variant="outline" className="text-xs bg-orange-50">
                        <Flame size={10} className="mr-1" />
                        Gas Ready
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(property)}
                      data-testid={`view-property-${property.id}`}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(property)}
                      data-testid={`edit-property-${property.id}`}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleDelete(property.id)}
                      data-testid={`delete-property-${property.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-16">
          <Building2 size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties yet</h3>
          <p className="text-slate-600 mb-4">Add your first property to get started</p>
        </div>
      )}
    </div>
  );
};