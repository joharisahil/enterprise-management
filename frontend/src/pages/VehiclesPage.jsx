import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Truck, Plus, Edit, Trash2, Fuel, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const vehicleTypes = ['Car', 'Truck', 'Van', 'Bike', 'Bus'];
const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    registration_number: '',
    type: 'Car',
    brand: '',
    model: '',
    year: '',
    chassis_number: '',
    engine_number: '',
    color: '',
    fuel_type: 'Diesel',
    average_kmpl: '',
    tank_capacity_liters: '',
    seating_capacity: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.data);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/vehicles', {
        ...formData,
        average_kmpl: parseFloat(formData.average_kmpl),
        tank_capacity_liters: parseFloat(formData.tank_capacity_liters)
      });
      
      toast.success('Vehicle added successfully');
      setDialogOpen(false);
      setFormData({
        registration_number: '',
        type: 'Car',
        brand: '',
        model: '',
        fuel_type: 'Diesel',
        average_kmpl: '',
        tank_capacity_liters: ''
      });
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to add vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Vehicle deleted');
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to delete vehicle');
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
    <div className="p-8" data-testid="vehicles-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Fleet Management
          </h1>
          <p className="text-slate-600">Manage your vehicle fleet and tracking</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-700 hover:bg-emerald-800" data-testid="add-vehicle-button">
              <Plus size={18} className="mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Registration Number</Label>
                <Input
                  required
                  data-testid="vehicle-reg-input"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="MH-02-DN-4921"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger data-testid="vehicle-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Fuel Type</Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                  >
                    <SelectTrigger data-testid="vehicle-fuel-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Brand</Label>
                  <Input
                    required
                    data-testid="vehicle-brand-input"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Tata"
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    required
                    data-testid="vehicle-model-input"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ace"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Average (km/l)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    data-testid="vehicle-kmpl-input"
                    value={formData.average_kmpl}
                    onChange={(e) => setFormData({ ...formData, average_kmpl: e.target.value })}
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label>Tank Capacity (L)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    data-testid="vehicle-tank-input"
                    value={formData.tank_capacity_liters}
                    onChange={(e) => setFormData({ ...formData, tank_capacity_liters: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800" data-testid="submit-vehicle-button">
                Add Vehicle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            data-testid={`vehicle-card-${vehicle.id}`}
          >
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-md">
                      <Truck size={24} className="text-emerald-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-mono">{vehicle.registration_number}</CardTitle>
                      <p className="text-sm text-slate-600">{vehicle.brand} {vehicle.model}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline">{vehicle.type}</Badge>
                  <Badge variant="outline">{vehicle.fuel_type}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Avg</p>
                      <p className="text-sm font-semibold">{vehicle.average_kmpl} km/l</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel size={16} className="text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Tank</p>
                      <p className="text-sm font-semibold">{vehicle.tank_capacity_liters}L</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    data-testid={`edit-vehicle-${vehicle.id}`}
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    onClick={() => handleDelete(vehicle.id)}
                    data-testid={`delete-vehicle-${vehicle.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-16">
          <Truck size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No vehicles yet</h3>
          <p className="text-slate-600 mb-4">Add your first vehicle to start fleet management</p>
        </div>
      )}
    </div>
  );
};
