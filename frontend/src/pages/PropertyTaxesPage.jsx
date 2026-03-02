import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Receipt, Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const taxTypes = ['House Tax', 'Property Tax', 'Municipal Tax', 'Other'];
const frequencies = ['Yearly', 'Half-Yearly', 'One-Time'];
const statusOptions = ['Paid', 'Unpaid'];

export const PropertyTaxesPage = () => {
  const [taxes, setTaxes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [formData, setFormData] = useState({
    property_id: '',
    tax_type: 'House Tax',
    custom_tax_name: '',
    amount: '',
    issue_date: '',
    expiry_date: '',
    payment_date: '',
    status: 'Unpaid',
    frequency: 'Yearly',
    receipt_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedProperty]);

  const fetchData = async () => {
    try {
      const [propsRes, taxesRes] = await Promise.all([
        api.get('/properties'),
        api.get(`/property-taxes${selectedProperty !== 'all' ? `?property_id=${selectedProperty}` : ''}`)
      ]);
      
      setProperties(propsRes.data.data);
      setTaxes(taxesRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/property-taxes', {
        ...formData,
        amount: parseFloat(formData.amount),
        issue_date: new Date(formData.issue_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null
      });
      
      toast.success('Property tax record created successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create tax record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tax record?')) return;
    
    try {
      await api.delete(`/property-taxes/${id}`);
      toast.success('Tax record deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete tax record');
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: '',
      tax_type: 'House Tax',
      custom_tax_name: '',
      amount: '',
      issue_date: '',
      expiry_date: '',
      payment_date: '',
      status: 'Unpaid',
      frequency: 'Yearly',
      receipt_url: ''
    });
  };

  const getPropertyName = (propertyId) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? prop.name : propertyId;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const paidTaxes = taxes.filter(t => t.status === 'Paid');
  const unpaidTaxes = taxes.filter(t => t.status === 'Unpaid');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="property-taxes-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Property Taxes
          </h1>
          <p className="text-slate-600">Track property taxes with frequency validation</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900" data-testid="add-tax-button">
              <Plus size={18} className="mr-2" />
              Add Tax Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Property Tax Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Property *</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                  required
                >
                  <SelectTrigger data-testid="tax-property-select">
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
                  <Label>Tax Type *</Label>
                  <Select
                    value={formData.tax_type}
                    onValueChange={(value) => setFormData({ ...formData, tax_type: value })}
                  >
                    <SelectTrigger data-testid="tax-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taxTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Frequency *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger data-testid="tax-frequency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((freq) => (
                        <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.tax_type === 'Other' && (
                <div>
                  <Label>Custom Tax Name</Label>
                  <Input
                    value={formData.custom_tax_name}
                    onChange={(e) => setFormData({ ...formData, custom_tax_name: e.target.value })}
                    placeholder="e.g., Development Tax"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (₹) *</Label>
                  <Input
                    type="number"
                    required
                    data-testid="tax-amount-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="15000"
                  />
                </div>

                <div>
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="tax-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Issue Date *</Label>
                  <Input
                    type="date"
                    required
                    data-testid="tax-issue-date-input"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Expiry Date *</Label>
                  <Input
                    type="date"
                    required
                    data-testid="tax-expiry-date-input"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Must match frequency: Yearly (+1 year), Half-Yearly (+6 months)
                  </p>
                </div>
              </div>

              {formData.status === 'Paid' && (
                <div>
                  <Label>Payment Date *</Label>
                  <Input
                    type="date"
                    required
                    data-testid="tax-payment-date-input"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900" data-testid="submit-tax-button">
                Create Tax Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
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

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({taxes.length})</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid ({unpaidTaxes.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidTaxes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {taxes.map((tax) => (
            <TaxCard key={tax.id} tax={tax} getPropertyName={getPropertyName} onDelete={handleDelete} />
          ))}
        </TabsContent>

        <TabsContent value="unpaid" className="space-y-4">
          {unpaidTaxes.map((tax) => (
            <TaxCard key={tax.id} tax={tax} getPropertyName={getPropertyName} onDelete={handleDelete} />
          ))}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {paidTaxes.map((tax) => (
            <TaxCard key={tax.id} tax={tax} getPropertyName={getPropertyName} onDelete={handleDelete} />
          ))}
        </TabsContent>
      </Tabs>

      {taxes.length === 0 && (
        <div className="text-center py-16">
          <Receipt size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No tax records yet</h3>
          <p className="text-slate-600 mb-4">Add your first property tax record</p>
        </div>
      )}
    </div>
  );
};

const TaxCard = ({ tax, getPropertyName, onDelete }) => {
  const isExpired = new Date(tax.expiry_date) < new Date();
  const isExpiringSoon = new Date(tax.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`tax-card-${tax.id}`}
    >
      <Card className={`border-slate-200 shadow-sm ${isExpired && tax.status === 'Unpaid' ? 'border-l-4 border-l-rose-500' : isExpiringSoon && tax.status === 'Unpaid' ? 'border-l-4 border-l-amber-500' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Receipt size={20} className="text-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {tax.tax_type === 'Other' ? tax.custom_tax_name : tax.tax_type}
                  </h3>
                  <p className="text-sm text-slate-600">{getPropertyName(tax.property_id)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                  <p className="text-lg font-bold text-slate-900">₹{tax.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Frequency</p>
                  <Badge variant="outline">{tax.frequency}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Issue Date</p>
                  <p className="text-sm font-medium">{new Date(tax.issue_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiry Date</p>
                  <p className={`text-sm font-medium ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : ''}`}>
                    {new Date(tax.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {tax.status === 'Paid' ? (
                  <>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle size={14} className="mr-1" />
                      Paid
                    </Badge>
                    {tax.payment_date && (
                      <span className="text-xs text-slate-600">
                        on {new Date(tax.payment_date).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Badge variant="destructive">
                      <AlertCircle size={14} className="mr-1" />
                      Unpaid
                    </Badge>
                    {isExpired && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {isExpiringSoon && !isExpired && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Expiring Soon</Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => onDelete(tax.id)}
              data-testid={`delete-tax-${tax.id}`}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
