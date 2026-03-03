import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Truck, Plus, Edit, Trash2, Fuel, Gauge, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const vehicleTypes = ['Car', 'Truck', 'Van', 'Bike', 'Bus'];
const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];

const initialFormData = {
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
};

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

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
        year: formData.year ? parseInt(formData.year) : null,
        average_kmpl: parseFloat(formData.average_kmpl),
        tank_capacity_liters: parseFloat(formData.tank_capacity_liters),
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null
      });
      
      toast.success('Vehicle added successfully');
      setDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to add vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      registration_number: vehicle.registration_number,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year?.toString() || '',
      chassis_number: vehicle.chassis_number || '',
      engine_number: vehicle.engine_number || '',
      color: vehicle.color || '',
      fuel_type: vehicle.fuel_type,
      average_kmpl: vehicle.average_kmpl.toString(),
      tank_capacity_liters: vehicle.tank_capacity_liters.toString(),
      seating_capacity: vehicle.seating_capacity?.toString() || ''
    });
    setEditDialogOpen(true);
  };

  const handleView = (vehicle) => {
    setSelectedVehicle(vehicle);
    setViewDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/vehicles/${selectedVehicle.id}`, {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        average_kmpl: parseFloat(formData.average_kmpl),
        tank_capacity_liters: parseFloat(formData.tank_capacity_liters),
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null
      });
      
      toast.success('Vehicle updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to update vehicle');
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

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedVehicle(null);
  };

  const VehicleForm = ({ onSubmit, submitText }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Registration Number *</Label>
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
          <Label>Type *</Label>
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
          <Label>Fuel Type *</Label>
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
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Brand *</Label>
          <Input
            required
            data-testid="vehicle-brand-input"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="Tata"
          />
        </div>
        <div>
          <Label>Model *</Label>
          <Input
            required
            data-testid="vehicle-model-input"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="Ace"
          />
        </div>
        <div>
          <Label>Year</Label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="2024"
            min="1900"
            max="2100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Chassis Number</Label>
          <Input
            value={formData.chassis_number}
            onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
            placeholder="MABXXXXXXXXXX1234"
          />
        </div>
        <div>
          <Label>Engine Number</Label>
          <Input
            value={formData.engine_number}
            onChange={(e) => setFormData({ ...formData, engine_number: e.target.value })}
            placeholder="ENG123456"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Color</Label>
          <Input
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="White"
          />
        </div>
        <div>
          <Label>Seating Capacity</Label>
          <Input
            type="number"
            value={formData.seating_capacity}
            onChange={(e) => setFormData({ ...formData, seating_capacity: e.target.value })}
            placeholder="5"
            min="1"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Average (km/l) *</Label>
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
          <Label>Tank Capacity (L) *</Label>
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
        {submitText}
      </Button>
    </form>
  );

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
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-700 hover:bg-emerald-800" data-testid="add-vehicle-button">
              <Plus size={18} className="mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <VehicleForm onSubmit={handleSubmit} submitText="Add Vehicle" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <VehicleForm onSubmit={handleUpdate} submitText="Update Vehicle" />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Truck size={32} className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 font-mono">{selectedVehicle.registration_number}</h3>
                  <p className="text-sm text-slate-600">{selectedVehicle.brand} {selectedVehicle.model}</p>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Badge variant="outline">{selectedVehicle.type}</Badge>
                <Badge variant="outline">{selectedVehicle.fuel_type}</Badge>
                {selectedVehicle.year && <Badge variant="outline">{selectedVehicle.year}</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedVehicle.chassis_number && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Chassis Number</p>
                    <p className="text-sm font-mono text-slate-700">{selectedVehicle.chassis_number}</p>
                  </div>
                )}
                {selectedVehicle.engine_number && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Engine Number</p>
                    <p className="text-sm font-mono text-slate-700">{selectedVehicle.engine_number}</p>
                  </div>
                )}
                {selectedVehicle.color && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Color</p>
                    <p className="text-sm text-slate-700">{selectedVehicle.color}</p>
                  </div>
                )}
                {selectedVehicle.seating_capacity && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Seating Capacity</p>
                    <p className="text-sm text-slate-700">{selectedVehicle.seating_capacity}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Average Mileage</p>
                  <p className="text-lg font-bold text-slate-900">{selectedVehicle.average_kmpl} km/l</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tank Capacity</p>
                  <p className="text-lg font-bold text-slate-900">{selectedVehicle.tank_capacity_liters} L</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Vehicle ID</p>
                  <p className="text-xs font-mono text-slate-500">{selectedVehicle.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm text-slate-700">{new Date(selectedVehicle.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                    onClick={() => handleView(vehicle)}
                    data-testid={`view-vehicle-${vehicle.id}`}
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(vehicle)}
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
