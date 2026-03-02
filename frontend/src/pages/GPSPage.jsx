import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Navigation, Plus, Play, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const GPSPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [gpsDevices, setGpsDevices] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [simulateDialogOpen, setSimulateDialogOpen] = useState(false);
  const [calculateDialogOpen, setCalculateDialogOpen] = useState(false);
  
  const [deviceFormData, setDeviceFormData] = useState({
    imei: '',
    provider: 'Simulation',
    vehicle_id: '',
    is_active: true
  });

  const [simulateFormData, setSimulateFormData] = useState({
    device_id: '',
    start_time: '',
    end_time: ''
  });

  const [calculateFormData, setCalculateFormData] = useState({
    vehicle_id: '',
    start_time: '',
    end_time: '',
    fuel_price_per_liter: '100'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, devicesRes, tripsRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/gps-devices'),
        api.get('/trips')
      ]);
      
      setVehicles(vehiclesRes.data.data);
      setGpsDevices(devicesRes.data.data);
      setTrips(tripsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/gps-devices', deviceFormData);
      toast.success('GPS device added successfully');
      setDeviceDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add GPS device');
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post(`/gps-devices/${simulateFormData.device_id}/simulate`, {
        start_time: new Date(simulateFormData.start_time).toISOString(),
        end_time: new Date(simulateFormData.end_time).toISOString()
      });
      
      toast.success(`Generated ${response.data.count} GPS location points`);
      setSimulateDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to simulate GPS data');
    }
  };

  const handleCalculateTrip = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/trips/calculate', {
        vehicle_id: calculateFormData.vehicle_id,
        start_time: new Date(calculateFormData.start_time).toISOString(),
        end_time: new Date(calculateFormData.end_time).toISOString(),
        fuel_price_per_liter: parseFloat(calculateFormData.fuel_price_per_liter)
      });
      
      toast.success('Trip calculated successfully');
      setCalculateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to calculate trip');
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
    <div className="p-8" data-testid="gps-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            GPS & Telematics
          </h1>
          <p className="text-slate-600">Provider-agnostic GPS tracking with simulation mode</p>
        </div>
      </div>

      <Tabs defaultValue="devices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="devices">
            <Navigation size={16} className="mr-2" />
            GPS Devices
          </TabsTrigger>
          <TabsTrigger value="trips">
            <MapPin size={16} className="mr-2" />
            Trips
          </TabsTrigger>
          <TabsTrigger value="fuel">
            <TrendingUp size={16} className="mr-2" />
            Fuel Intelligence
          </TabsTrigger>
        </TabsList>

        {/* GPS Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <div className="flex gap-3">
            <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-800 hover:bg-blue-900">
                  <Plus size={18} className="mr-2" />
                  Add GPS Device
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add GPS Device</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleDeviceSubmit} className="space-y-4">
                  <div>
                    <Label>IMEI Number *</Label>
                    <Input
                      required
                      value={deviceFormData.imei}
                      onChange={(e) => setDeviceFormData({ ...deviceFormData, imei: e.target.value })}
                      placeholder="867567027623456"
                    />
                  </div>

                  <div>
                    <Label>Provider</Label>
                    <Select
                      value={deviceFormData.provider}
                      onValueChange={(value) => setDeviceFormData({ ...deviceFormData, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Simulation">Simulation (Default)</SelectItem>
                        <SelectItem value="LocoNav">LocoNav (Future)</SelectItem>
                        <SelectItem value="Teltonika">Teltonika (Future)</SelectItem>
                        <SelectItem value="Fleetx">Fleetx (Future)</SelectItem>
                        <SelectItem value="Geotab">Geotab (Future)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">Provider-agnostic architecture</p>
                  </div>

                  <div>
                    <Label>Vehicle *</Label>
                    <Select
                      value={deviceFormData.vehicle_id}
                      onValueChange={(value) => setDeviceFormData({ ...deviceFormData, vehicle_id: value })}
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

                  <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900">
                    Add Device
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={simulateDialogOpen} onOpenChange={setSimulateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                  <Play size={18} className="mr-2" />
                  Generate GPS Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Simulate GPS Location Data</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSimulate} className="space-y-4">
                  <div>
                    <Label>GPS Device *</Label>
                    <Select
                      value={simulateFormData.device_id}
                      onValueChange={(value) => setSimulateFormData({ ...simulateFormData, device_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        {gpsDevices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.imei} - {getVehicleName(device.vehicle_id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Start Time *</Label>
                    <Input
                      type="datetime-local"
                      required
                      value={simulateFormData.start_time}
                      onChange={(e) => setSimulateFormData({ ...simulateFormData, start_time: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>End Time *</Label>
                    <Input
                      type="datetime-local"
                      required
                      value={simulateFormData.end_time}
                      onChange={(e) => setSimulateFormData({ ...simulateFormData, end_time: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Generate Mock Data
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={calculateDialogOpen} onOpenChange={setCalculateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-purple-600 text-purple-700 hover:bg-purple-50">
                  <TrendingUp size={18} className="mr-2" />
                  Calculate Trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Calculate Trip from GPS Data</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCalculateTrip} className="space-y-4">
                  <div>
                    <Label>Vehicle *</Label>
                    <Select
                      value={calculateFormData.vehicle_id}
                      onValueChange={(value) => setCalculateFormData({ ...calculateFormData, vehicle_id: value })}
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
                    <Label>Start Time *</Label>
                    <Input
                      type="datetime-local"
                      required
                      value={calculateFormData.start_time}
                      onChange={(e) => setCalculateFormData({ ...calculateFormData, start_time: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>End Time *</Label>
                    <Input
                      type="datetime-local"
                      required
                      value={calculateFormData.end_time}
                      onChange={(e) => setCalculateFormData({ ...calculateFormData, end_time: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Fuel Price per Liter (Rs) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={calculateFormData.fuel_price_per_liter}
                      onChange={(e) => setCalculateFormData({ ...calculateFormData, fuel_price_per_liter: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                    Calculate Trip Metrics
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gpsDevices.map((device) => (
              <Card key={device.id} className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">IMEI</p>
                      <p className="text-lg font-mono font-bold text-slate-900">{device.imei}</p>
                    </div>
                    <Badge variant={device.is_active ? "default" : "secondary"}>
                      {device.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Vehicle</p>
                      <p className="text-sm font-semibold">{getVehicleName(device.vehicle_id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Provider</p>
                      <Badge variant="outline">{device.provider}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {gpsDevices.length === 0 && (
            <div className="text-center py-16">
              <Navigation size={64} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No GPS devices yet</h3>
              <p className="text-slate-600">Add your first GPS device to start tracking</p>
            </div>
          )}
        </TabsContent>

        {/* Trips Tab */}
        <TabsContent value="trips" className="space-y-6">
          <div className="space-y-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} getVehicleName={getVehicleName} />
            ))}
          </div>

          {trips.length === 0 && (
            <div className="text-center py-16">
              <MapPin size={64} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No trips calculated yet</h3>
              <p className="text-slate-600">Generate GPS data and calculate trips</p>
            </div>
          )}
        </TabsContent>

        {/* Fuel Intelligence Tab */}
        <TabsContent value="fuel" className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Fuel Efficiency Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Distance</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {trips.reduce((sum, t) => sum + t.distance_km, 0).toFixed(2)} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Fuel Consumed</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {trips.reduce((sum, t) => sum + t.fuel_consumed_liters, 0).toFixed(2)} L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Fuel Cost</p>
                  <p className="text-3xl font-bold text-rose-600">
                    Rs {trips.reduce((sum, t) => sum + t.fuel_cost, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {trips.length === 0 && (
            <div className="text-center py-16">
              <TrendingUp size={64} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No fuel data yet</h3>
              <p className="text-slate-600">Calculate trips to see fuel intelligence</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TripCard = ({ trip, getVehicleName }) => {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-slate-900">{getVehicleName(trip.vehicle_id)}</h3>
            <p className="text-sm text-slate-600">
              {new Date(trip.start_time).toLocaleString()} - {new Date(trip.end_time).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Distance</p>
            <p className="text-lg font-bold text-blue-700">{trip.distance_km} km</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Avg Speed</p>
            <p className="text-lg font-bold text-slate-900">{trip.average_speed} km/h</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Idle Time</p>
            <p className="text-lg font-bold text-amber-600">{trip.idle_time_minutes.toFixed(0)} min</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fuel Used</p>
            <p className="text-lg font-bold text-orange-600">{trip.fuel_consumed_liters.toFixed(2)} L</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fuel Cost</p>
            <p className="text-lg font-bold text-rose-600">Rs {trip.fuel_cost.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};