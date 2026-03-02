import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Droplet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const WaterPage = () => {
  const [properties, setProperties] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    property_id: '',
    billing_period_start: '',
    billing_period_end: '',
    units_consumed: '',
    sewage_charges: '',
    tanker_usage: '0',
    total_bill: '',
    due_date: '',
    payment_date: '',
    status: 'Unpaid'
  });

  useEffect(() => {
    fetchData();
  }, [selectedProperty]);

  const fetchData = async () => {
    try {
      const filter = selectedProperty !== 'all' ? `?property_id=${selectedProperty}` : '';
      const [propsRes, billsRes] = await Promise.all([
        api.get('/properties'),
        api.get(`/water-bills${filter}`)
      ]);
      
      setProperties(propsRes.data.data);
      setBills(billsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/water-bills', {
        ...formData,
        units_consumed: parseFloat(formData.units_consumed),
        sewage_charges: parseFloat(formData.sewage_charges),
        tanker_usage: parseFloat(formData.tanker_usage),
        total_bill: parseFloat(formData.total_bill),
        billing_period_start: new Date(formData.billing_period_start).toISOString(),
        billing_period_end: new Date(formData.billing_period_end).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null
      });
      
      toast.success('Water bill created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create water bill');
    }
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
    <div className="p-8" data-testid="water-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Water Bills
          </h1>
          <p className="text-slate-600">Track water consumption and sewage charges</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700">
              <Plus size={18} className="mr-2" />
              Add Water Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Water Bill</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Property *</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) => setFormData({ ...formData, property_id: value })}
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
                    value={formData.billing_period_start}
                    onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Billing Period End *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.billing_period_end}
                    onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Units Consumed *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.units_consumed}
                    onChange={(e) => setFormData({ ...formData, units_consumed: e.target.value })}
                    placeholder="Liters/m³"
                  />
                </div>
                <div>
                  <Label>Sewage Charges (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sewage_charges}
                    onChange={(e) => setFormData({ ...formData, sewage_charges: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tanker Usage (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tanker_usage}
                    onChange={(e) => setFormData({ ...formData, tanker_usage: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Bill (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.total_bill}
                    onChange={(e) => setFormData({ ...formData, total_bill: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">
                Create Water Bill
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      <div className="space-y-4">
        {bills.map((bill) => (
          <motion.div
            key={bill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{getPropertyName(bill.property_id)}</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                    {bill.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Units Consumed</p>
                    <p className="text-lg font-bold text-slate-900">{bill.units_consumed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sewage</p>
                    <p className="text-lg font-bold text-slate-900">₹{bill.sewage_charges}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Bill</p>
                    <p className="text-lg font-bold text-slate-900">₹{bill.total_bill.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                    <p className="text-sm font-medium">{new Date(bill.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {bills.length === 0 && (
        <div className="text-center py-16">
          <Droplet size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No water bills yet</h3>
          <p className="text-slate-600">Add your first water bill</p>
        </div>
      )}
    </div>
  );
};