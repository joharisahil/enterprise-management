import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { AlertTriangle, Plus, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ChallansPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [challans, setChallans] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: null,
    challan_number: '',
    date: '',
    violation_type: '',
    amount: '',
    status: 'Unpaid',
    payment_date: '',
    location: '',
    proof_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedVehicle]);

  const fetchData = async () => {
    try {
      const filter = selectedVehicle !== 'all' ? `?vehicle_id=${selectedVehicle}` : '';
      const [vehiclesRes, driversRes, challansRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get(`/challans${filter}`)
      ]);
      
      setVehicles(vehiclesRes.data.data);
      setDrivers(driversRes.data.data);
      setChallans(challansRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/challans', {
        ...formData,
        driver_id: formData.driver_id || null,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null
      });
      
      toast.success('Challan record created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create challan');
    }
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.registration_number : vehicleId;
  };

  const getDriverName = (driverId) => {
    if (!driverId) return 'N/A';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.full_name : driverId;
  };

  const paidChallans = challans.filter(c => c.status === 'Paid');
  const unpaidChallans = challans.filter(c => c.status === 'Unpaid');

  const unpaidTotal = unpaidChallans.reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="challans-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Traffic Challans
          </h1>
          <p className="text-slate-600">Track vehicle violations and fines</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700" data-testid="add-challan-button">
              <Plus size={18} className="mr-2" />
              Add Challan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Traffic Challan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vehicle *</Label>
                  <Select
                    value={formData.vehicle_id}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
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

                <div>
                  <Label>Driver (Optional)</Label>
                  <Select
                    value={formData.driver_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, driver_id: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Challan Number *</Label>
                  <Input
                    required
                    value={formData.challan_number}
                    onChange={(e) => setFormData({ ...formData, challan_number: e.target.value })}
                    placeholder="CH-2024-001234"
                  />
                </div>

                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Violation Type *</Label>
                <Input
                  required
                  value={formData.violation_type}
                  onChange={(e) => setFormData({ ...formData, violation_type: e.target.value })}
                  placeholder="e.g., Overspeed, Red Light, No Helmet"
                />
              </div>

              <div>
                <Label>Location *</Label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., NH-48, Delhi-Gurgaon Expressway"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (Rs ) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="1000"
                  />
                </div>

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

              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700">
                Create Challan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Challans</p>
                <p className="text-3xl font-bold text-slate-900">{challans.length}</p>
              </div>
              <AlertTriangle size={32} className="text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Unpaid Challans</p>
                <p className="text-3xl font-bold text-rose-600">{unpaidChallans.length}</p>
              </div>
              <AlertTriangle size={32} className="text-rose-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Unpaid Amount</p>
                <p className="text-3xl font-bold text-rose-600">Rs {unpaidTotal.toLocaleString()}</p>
              </div>
              <DollarSign size={32} className="text-rose-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-64">
            <SelectValue />
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
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({challans.length})</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid ({unpaidChallans.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidChallans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {challans.map((challan) => (
            <ChallanCard key={challan.id} challan={challan} getVehicleName={getVehicleName} getDriverName={getDriverName} />
          ))}
        </TabsContent>

        <TabsContent value="unpaid" className="space-y-4">
          {unpaidChallans.map((challan) => (
            <ChallanCard key={challan.id} challan={challan} getVehicleName={getVehicleName} getDriverName={getDriverName} />
          ))}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {paidChallans.map((challan) => (
            <ChallanCard key={challan.id} challan={challan} getVehicleName={getVehicleName} getDriverName={getDriverName} />
          ))}
        </TabsContent>
      </Tabs>

      {challans.length === 0 && (
        <div className="text-center py-16">
          <AlertTriangle size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No challans yet</h3>
          <p className="text-slate-600">Clean driving record!</p>
        </div>
      )}
    </div>
  );
};

const ChallanCard = ({ challan, getVehicleName, getDriverName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`challan-card-${challan.id}`}
    >
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle size={20} className="text-rose-600" />
                <h3 className="font-semibold text-lg text-slate-900 font-mono">{challan.challan_number}</h3>
              </div>
              <p className="text-sm text-slate-600 mb-1">
                {getVehicleName(challan.vehicle_id)} • Driver: {getDriverName(challan.driver_id)}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(challan.date).toLocaleDateString()} • {challan.location}
              </p>
            </div>
            <Badge className={challan.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}>
              {challan.status === 'Paid' ? <CheckCircle size={14} className="mr-1" /> : <AlertTriangle size={14} className="mr-1" />}
              {challan.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Violation</p>
              <p className="text-sm font-semibold text-slate-900">{challan.violation_type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fine Amount</p>
              <p className="text-lg font-bold text-rose-600">Rs {challan.amount.toLocaleString()}</p>
            </div>
            {challan.payment_date && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Paid On</p>
                <p className="text-sm font-medium text-emerald-700">{new Date(challan.payment_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
