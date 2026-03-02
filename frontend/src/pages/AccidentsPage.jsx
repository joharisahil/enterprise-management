import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { AlertOctagon, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const claimStatuses = ['Filed', 'Under Review', 'Approved', 'Rejected', 'Settled'];

export const AccidentsPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    accident_date: '',
    location: '',
    fir_number: '',
    damage_description: '',
    repair_cost: '',
    claim_amount: '',
    settlement_amount: '',
    claim_status: 'Filed'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, driversRes, accidentsRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/accidents')
      ]);
      
      setVehicles(vehiclesRes.data.data);
      setDrivers(driversRes.data.data);
      setAccidents(accidentsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/accidents', {
        ...formData,
        driver_id: formData.driver_id || null,
        accident_date: new Date(formData.accident_date).toISOString(),
        repair_cost: parseFloat(formData.repair_cost || 0),
        claim_amount: parseFloat(formData.claim_amount || 0),
        settlement_amount: parseFloat(formData.settlement_amount || 0)
      });
      
      toast.success('Accident record created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create accident record');
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

  const getStatusColor = (status) => {
    const colors = {
      'Filed': 'bg-blue-100 text-blue-700',
      'Under Review': 'bg-amber-100 text-amber-700',
      'Approved': 'bg-emerald-100 text-emerald-700',
      'Rejected': 'bg-rose-100 text-rose-700',
      'Settled': 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="accidents-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Accidents & Claims
          </h1>
          <p className="text-slate-600">Track accidents and insurance claims</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700">
              <Plus size={18} className="mr-2" />
              Report Accident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Accident</DialogTitle>
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
                    value={formData.driver_id}
                    onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                  <Label>Accident Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.accident_date}
                    onChange={(e) => setFormData({ ...formData, accident_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>FIR Number</Label>
                  <Input
                    value={formData.fir_number}
                    onChange={(e) => setFormData({ ...formData, fir_number: e.target.value })}
                    placeholder="e.g., FIR-2024-001"
                  />
                </div>
              </div>

              <div>
                <Label>Location *</Label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Accident location"
                />
              </div>

              <div>
                <Label>Damage Description *</Label>
                <Textarea
                  required
                  value={formData.damage_description}
                  onChange={(e) => setFormData({ ...formData, damage_description: e.target.value })}
                  placeholder="Describe the damage..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Repair Cost (Rs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.repair_cost}
                    onChange={(e) => setFormData({ ...formData, repair_cost: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Claim Amount (Rs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.claim_amount}
                    onChange={(e) => setFormData({ ...formData, claim_amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Settlement (Rs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.settlement_amount}
                    onChange={(e) => setFormData({ ...formData, settlement_amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Claim Status *</Label>
                <Select
                  value={formData.claim_status}
                  onValueChange={(value) => setFormData({ ...formData, claim_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {claimStatuses.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700">
                Report Accident
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {accidents.map((accident) => (
          <motion.div
            key={accident.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-slate-200 shadow-sm border-l-4 border-l-rose-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertOctagon size={20} className="text-rose-600" />
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{getVehicleName(accident.vehicle_id)}</h3>
                        <p className="text-sm text-slate-600">
                          {new Date(accident.accident_date).toLocaleDateString()} • {accident.location}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-slate-700">{accident.damage_description}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Driver</p>
                        <p className="text-sm font-semibold">{getDriverName(accident.driver_id)}</p>
                      </div>
                      {accident.fir_number && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">FIR Number</p>
                          <p className="text-sm font-mono font-semibold">{accident.fir_number}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Repair Cost</p>
                        <p className="text-sm font-bold text-rose-600">Rs {accident.repair_cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Claim Amount</p>
                        <p className="text-sm font-bold text-blue-600">Rs {accident.claim_amount.toLocaleString()}</p>
                      </div>
                    </div>

                    {accident.settlement_amount > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Settlement Amount</p>
                        <p className="text-lg font-bold text-emerald-600">Rs {accident.settlement_amount.toLocaleString()}</p>
                      </div>
                    )}

                    <Badge className={getStatusColor(accident.claim_status)}>
                      {accident.claim_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {accidents.length === 0 && (
        <div className="text-center py-16">
          <AlertOctagon size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No accident records</h3>
          <p className="text-slate-600">Clean driving record!</p>
        </div>
      )}
    </div>
  );
};