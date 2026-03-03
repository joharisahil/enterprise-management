import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Fuel, Plus, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const GasPage = () => {
  const [properties, setProperties] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [formData, setFormData] = useState({
    property_id: '',
    billing_period_start: '',
    billing_period_end: '',
    units_consumed: '',
    rate_per_unit: '',
    fixed_charges: '',
    total_bill: '',
    due_date: '',
    payment_date: '',
    status: 'Unpaid',
    vendor: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedProperty]);

  const fetchData = async () => {
    try {
      const filter = selectedProperty !== 'all' ? `?property_id=${selectedProperty}` : '';
      const [propsRes, billsRes] = await Promise.all([
        api.get('/properties'),
        api.get(`/gas-bills${filter}`)
      ]);
      
      setProperties(propsRes.data.data);
      setBills(billsRes.data.data);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/gas-bills', {
        ...formData,
        units_consumed: parseFloat(formData.units_consumed),
        rate_per_unit: parseFloat(formData.rate_per_unit),
        fixed_charges: parseFloat(formData.fixed_charges),
        total_bill: parseFloat(formData.total_bill),
        billing_period_start: new Date(formData.billing_period_start).toISOString(),
        billing_period_end: new Date(formData.billing_period_end).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null
      });
      
      toast.success('Gas bill created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to create gas bill');
    }
  };

  const handleView = (bill) => {
    setSelectedBill(bill);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gas bill?')) return;
    
    try {
      await api.delete(`/gas-bills/${id}`);
      toast.success('Gas bill deleted');
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to delete gas bill');
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
    <div className="p-8" data-testid="gas-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Gas Bills
          </h1>
          <p className="text-slate-600">Track gas consumption and bills</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus size={18} className="mr-2" />
              Add Gas Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Gas Bill</DialogTitle>
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

              <div>
                <Label>Vendor *</Label>
                <Input
                  required
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="e.g., IGL, MGL"
                />
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
                  />
                </div>
                <div>
                  <Label>Rate per Unit (Rs) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.rate_per_unit}
                    onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fixed Charges (Rs) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.fixed_charges}
                    onChange={(e) => setFormData({ ...formData, fixed_charges: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Bill (Rs) *</Label>
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

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                Create Gas Bill
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gas Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Fuel size={32} className="text-orange-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{getPropertyName(selectedBill.property_id)}</h3>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedBill.billing_period_start).toLocaleDateString()} - {new Date(selectedBill.billing_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Vendor</p>
                  <p className="text-sm font-medium text-slate-900">{selectedBill.vendor}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                  <Badge className={selectedBill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                    {selectedBill.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Units Consumed</p>
                  <p className="text-lg font-bold text-slate-900">{selectedBill.units_consumed}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Rate per Unit</p>
                  <p className="text-sm text-slate-700">Rs {selectedBill.rate_per_unit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fixed Charges</p>
                  <p className="text-sm text-slate-700">Rs {selectedBill.fixed_charges}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Bill</p>
                  <p className="text-lg font-bold text-slate-900">Rs {selectedBill.total_bill.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                  <p className="text-sm text-slate-700">{new Date(selectedBill.due_date).toLocaleDateString()}</p>
                </div>
                {selectedBill.payment_date && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment Date</p>
                    <p className="text-sm text-slate-700">{new Date(selectedBill.payment_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            data-testid={`gas-bill-${bill.id}`}
          >
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{getPropertyName(bill.property_id)}</h3>
                    <p className="text-sm text-slate-600">
                      {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Vendor: {bill.vendor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                      {bill.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(bill)}
                      data-testid={`view-gas-${bill.id}`}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleDelete(bill.id)}
                      data-testid={`delete-gas-${bill.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Units Consumed</p>
                    <p className="text-lg font-bold text-slate-900">{bill.units_consumed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Rate/Unit</p>
                    <p className="text-lg font-bold text-slate-900">Rs {bill.rate_per_unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Bill</p>
                    <p className="text-lg font-bold text-slate-900">Rs {bill.total_bill.toLocaleString()}</p>
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
          <Fuel size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No gas bills yet</h3>
          <p className="text-slate-600">Add your first gas bill</p>
        </div>
      )}
    </div>
  );
};
