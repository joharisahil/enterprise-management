import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Wrench, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const serviceTypes = ['Routine', 'Repair', 'Inspection', 'Emergency'];

export const ServicePage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_date: '',
    service_type: 'Routine',
    odometer_reading: '',
    cost: '',
    vendor: '',
    next_service_due_km: '',
    next_service_due_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedVehicle]);

  const fetchData = async () => {
    try {
      const filter = selectedVehicle !== 'all' ? `?vehicle_id=${selectedVehicle}` : '';
      const [vehiclesRes, servicesRes] = await Promise.all([
        api.get('/vehicles'),
        api.get(`/service-records${filter}`)
      ]);
      
      setVehicles(vehiclesRes.data.data);
      setServices(servicesRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/service-records', {
        ...formData,
        service_date: new Date(formData.service_date).toISOString(),
        odometer_reading: parseFloat(formData.odometer_reading),
        cost: parseFloat(formData.cost),
        next_service_due_km: formData.next_service_due_km ? parseFloat(formData.next_service_due_km) : null,
        next_service_due_date: formData.next_service_due_date ? new Date(formData.next_service_due_date).toISOString() : null
      });
      
      toast.success('Service record created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create service record');
    }
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.registration_number : vehicleId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="service-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Service & Maintenance
          </h1>
          <p className="text-slate-600">Track vehicle service history and schedules</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus size={18} className="mr-2" />
              Add Service Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Service Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Service Type *</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Odometer Reading (km) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={formData.odometer_reading}
                    onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cost (Rs) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Vendor *</Label>
                <Input
                  required
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Service center name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Next Service Due (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.next_service_due_km}
                    onChange={(e) => setFormData({ ...formData, next_service_due_km: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Next Service Due (date)</Label>
                  <Input
                    type="date"
                    value={formData.next_service_due_date}
                    onChange={(e) => setFormData({ ...formData, next_service_due_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional service details..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Create Service Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      <div className="space-y-4">
        {services.map((service) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{getVehicleName(service.vehicle_id)}</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(service.service_date).toLocaleDateString()} • {service.service_type} Service
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-700">Rs {service.cost.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Odometer</p>
                    <p className="text-sm font-semibold">{service.odometer_reading} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Vendor</p>
                    <p className="text-sm font-semibold">{service.vendor}</p>
                  </div>
                  {service.next_service_due_km && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Next Service (km)</p>
                      <p className="text-sm font-semibold text-amber-600">{service.next_service_due_km} km</p>
                    </div>
                  )}
                  {service.next_service_due_date && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Next Service (date)</p>
                      <p className="text-sm font-semibold text-amber-600">
                        {new Date(service.next_service_due_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {service.notes && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{service.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-16">
          <Wrench size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No service records yet</h3>
          <p className="text-slate-600">Add your first service record</p>
        </div>
      )}
    </div>
  );
};