import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Zap, Sun, Plus, TrendingUp, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ElectricityPage = () => {
  const [properties, setProperties] = useState([]);
  const [electricityBills, setElectricityBills] = useState([]);
  const [solarMeters, setSolarMeters] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [elecDialogOpen, setElecDialogOpen] = useState(false);
  const [solarDialogOpen, setSolarDialogOpen] = useState(false);
  const [viewElecDialogOpen, setViewElecDialogOpen] = useState(false);
  const [viewSolarDialogOpen, setViewSolarDialogOpen] = useState(false);
  const [selectedElecBill, setSelectedElecBill] = useState(null);
  const [selectedSolarMeter, setSelectedSolarMeter] = useState(null);

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
    status: 'Unpaid'
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
    billable_units: ''
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

  const handleElecSubmit = async (e) => {
    e.preventDefault();
    
    try {
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
        payment_date: elecFormData.payment_date ? new Date(elecFormData.payment_date).toISOString() : null
      });
      
      toast.success('Electricity bill created successfully');
      setElecDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create electricity bill');
    }
  };

  const handleSolarSubmit = async (e) => {
    e.preventDefault();
    
    try {
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
        billing_period_end: new Date(solarFormData.billing_period_end).toISOString()
      });
      
      toast.success('Solar meter data created successfully');
      setSolarDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create solar meter data');
    }
  };

  const handleDeleteElecBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this electricity bill?')) return;
    
    try {
      await api.delete(`/electricity-bills/${id}`);
      toast.success('Electricity bill deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete electricity bill');
    }
  };

  const handleDeleteSolarMeter = async (id) => {
    if (!window.confirm('Are you sure you want to delete this solar meter record?')) return;
    
    try {
      await api.delete(`/solar-meters/${id}`);
      toast.success('Solar meter record deleted');
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
    <div className="p-8" data-testid="electricity-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Electricity & Solar
          </h1>
          <p className="text-slate-600">Track grid electricity and solar net metering</p>
        </div>
      </div>

      {/* View Electricity Bill Dialog */}
      <Dialog open={viewElecDialogOpen} onOpenChange={setViewElecDialogOpen}>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Solar Meter Dialog */}
      <Dialog open={viewSolarDialogOpen} onOpenChange={setViewSolarDialogOpen}>
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
          <div className="flex justify-end">
            <Dialog open={elecDialogOpen} onOpenChange={setElecDialogOpen}>
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

                  <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900">
                    Create Bill
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {electricityBills.map((bill) => (
              <ElectricityBillCard 
                key={bill.id} 
                bill={bill} 
                getPropertyName={getPropertyName} 
                onView={handleViewElecBill}
                onDelete={handleDeleteElecBill}
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
            <Dialog open={solarDialogOpen} onOpenChange={setSolarDialogOpen}>
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

                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                    Create Solar Data
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
                onDelete={handleDeleteSolarMeter}
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

const ElectricityBillCard = ({ bill, getPropertyName, onView, onDelete }) => {
  return (
    <Card className="border-slate-200 shadow-sm" data-testid={`electricity-bill-${bill.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-slate-900">{getPropertyName(bill.property_id)}</h3>
            <p className="text-sm text-slate-600">
              {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
              {bill.status}
            </Badge>
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
              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => onDelete(bill.id)}
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

const SolarMeterCard = ({ meter, getPropertyName, onView, onDelete }) => {
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
          </div>
          <div className="flex items-center gap-2">
            <Sun size={20} className="text-amber-500" />
            <span className="text-sm font-semibold">{meter.installed_capacity_kw} kW</span>
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
              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => onDelete(meter.id)}
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
