import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { User, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    license_number: '',
    license_expiry: '',
    contact: '',
    email: ''
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/drivers');
      setDrivers(response.data.data);
    } catch (error) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/drivers', {
        ...formData,
        license_expiry: new Date(formData.license_expiry).toISOString()
      });
      
      toast.success('Driver added successfully');
      setDialogOpen(false);
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add driver');
    }
  };

  const isLicenseExpiring = (expiryDate) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isLicenseExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const getRiskLevel = (riskScore) => {
    if (riskScore === 0) return { label: 'Excellent', color: 'bg-emerald-100 text-emerald-700' };
    if (riskScore < 20) return { label: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (riskScore < 50) return { label: 'Moderate', color: 'bg-amber-100 text-amber-700' };
    return { label: 'High Risk', color: 'bg-rose-100 text-rose-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="drivers-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Drivers
          </h1>
          <p className="text-slate-600">Manage drivers with license tracking and risk scoring</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900">
              <Plus size={18} className="mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Driver</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>License Number *</Label>
                  <Input
                    required
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="MH01 20200012345"
                  />
                </div>
                <div>
                  <Label>License Expiry *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact *</Label>
                  <Input
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="driver@example.com"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900">
                Add Driver
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => {
          const riskLevel = getRiskLevel(driver.risk_score || 0);
          const expiring = isLicenseExpiring(driver.license_expiry);
          const expired = isLicenseExpired(driver.license_expiry);

          return (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border-slate-200 shadow-sm ${expired ? 'border-l-4 border-l-rose-500' : expiring ? 'border-l-4 border-l-amber-500' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User size={24} className="text-blue-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{driver.full_name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{driver.license_number}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">License Expiry</p>
                      <p className={`text-sm font-semibold ${
                        expired ? 'text-rose-600' : expiring ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                        {new Date(driver.license_expiry).toLocaleDateString()}
                      </p>
                      {expired && (
                        <Badge variant="destructive" className="mt-1">
                          <AlertCircle size={12} className="mr-1" />
                          Expired
                        </Badge>
                      )}
                      {expiring && !expired && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 mt-1">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Contact</p>
                      <p className="text-sm font-medium text-slate-900">{driver.contact}</p>
                      {driver.email && (
                        <p className="text-xs text-slate-600">{driver.email}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Driver Risk Score</p>
                      <div className="flex items-center justify-between">
                        <Badge className={riskLevel.color}>
                          {riskLevel.label}
                        </Badge>
                        <span className="text-2xl font-bold text-slate-900">{driver.risk_score || 0}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Based on violations and accidents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {drivers.length === 0 && (
        <div className="text-center py-16">
          <User size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No drivers yet</h3>
          <p className="text-slate-600">Add your first driver</p>
        </div>
      )}
    </div>
  );
};