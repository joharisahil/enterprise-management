import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { FileText, Plus, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const documentTypes = ['Insurance', 'PUC', 'Fitness', 'RC', 'Permit', 'Custom'];

export const DocumentsPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedDocHistory, setSelectedDocHistory] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    document_type: 'Insurance',
    custom_document_name: '',
    policy_number: '',
    provider: '',
    issue_date: '',
    expiry_date: '',
    premium: '',
    coverage: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchData();
  }, [selectedVehicle]);

  const fetchData = async () => {
    try {
      const filter = selectedVehicle !== 'all' ? `?vehicle_id=${selectedVehicle}` : '';
      const [vehiclesRes, docsRes] = await Promise.all([
        api.get('/vehicles'),
        api.get(`/vehicle-documents${filter}`)
      ]);
      
      setVehicles(vehiclesRes.data.data);
      setDocuments(docsRes.data.data);
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
      await api.post('/vehicle-documents', {
        ...formData,
        issue_date: new Date(formData.issue_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        premium: formData.premium ? parseFloat(formData.premium) : null
      });
      
      toast.success('Document added successfully (version tracked)');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to add document');
    }
  };

  const viewHistory = async (documentId) => {
    try {
      const response = await api.get(`/vehicle-documents/${documentId}/history`);
      setSelectedDocHistory(response.data);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load document history');
    }
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.registration_number : vehicleId;
  };

  const isExpiringSoon = (expiryDate) => {
    const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 60 && daysLeft > 0;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="documents-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Vehicle Documents
          </h1>
          <p className="text-slate-600">Versioned document management with expiry tracking</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900">
              <Plus size={18} className="mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Vehicle Document</DialogTitle>
              <p className="text-sm text-slate-500">Previous versions will be preserved automatically</p>
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
                  <Label>Document Type *</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.document_type === 'Custom' && (
                  <div>
                    <Label>Document Name *</Label>
                    <Input
                      required
                      value={formData.custom_document_name}
                      onChange={(e) => setFormData({ ...formData, custom_document_name: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <Label>Policy/Document Number *</Label>
                  <Input
                    required
                    value={formData.policy_number}
                    onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Provider *</Label>
                <Input
                  required
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., ICICI Lombard, HDFC Ergo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Issue Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expiry Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Premium (Rs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.premium}
                    onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Coverage</Label>
                  <Input
                    value={formData.coverage}
                    onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                    placeholder="e.g., Comprehensive, Third Party"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900">
                Add Document (Auto-Versioned)
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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

      <div className="space-y-4">
        {documents.map((doc) => {
          const expiringSoon = isExpiringSoon(doc.expiry_date);
          const expired = isExpired(doc.expiry_date);

          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border-slate-200 shadow-sm ${
                expired ? 'border-l-4 border-l-rose-500' : 
                expiringSoon ? 'border-l-4 border-l-amber-500' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText size={20} className="text-blue-700" />
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900">
                            {doc.document_type === 'Custom' ? doc.custom_document_name : doc.document_type}
                          </h3>
                          <p className="text-sm text-slate-600">{getVehicleName(doc.vehicle_id)}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Version {doc.version}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Policy Number</p>
                          <p className="text-sm font-mono font-semibold">{doc.policy_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Provider</p>
                          <p className="text-sm font-semibold">{doc.provider}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiry Date</p>
                          <p className={`text-sm font-semibold ${
                            expired ? 'text-rose-600' : expiringSoon ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {new Date(doc.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                        {doc.premium && (
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Premium</p>
                            <p className="text-sm font-semibold">Rs {doc.premium.toLocaleString()}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {expired && (
                          <Badge variant="destructive">
                            <AlertCircle size={12} className="mr-1" />
                            Expired
                          </Badge>
                        )}
                        {expiringSoon && !expired && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            Expiring in {Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                          </Badge>
                        )}
                        <Badge className={doc.is_current ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                          {doc.is_current ? 'Current' : 'Archived'}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewHistory(doc.id)}
                      className="flex items-center gap-2"
                    >
                      <Clock size={16} />
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Version History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Version History</DialogTitle>
            {selectedDocHistory && (
              <p className="text-sm text-slate-600">
                {selectedDocHistory.document_type} - {getVehicleName(selectedDocHistory.vehicle_id)}
              </p>
            )}
          </DialogHeader>
          {selectedDocHistory && (
            <div className="space-y-4">
              {selectedDocHistory.history.map((version, index) => (
                <Card key={version.id} className={index === 0 ? 'border-blue-500 border-2' : 'border-slate-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          Version {version.version}
                        </Badge>
                        {index === 0 && <Badge className="bg-emerald-100 text-emerald-700">Current</Badge>}
                        {version.status === 'Expired' && <Badge variant="destructive">Expired</Badge>}
                        {version.status === 'Renewed' && <Badge className="bg-blue-100 text-blue-700">Renewed</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">
                        Created: {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Policy Number</p>
                        <p className="font-mono font-semibold">{version.policy_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Provider</p>
                        <p className="font-semibold">{version.provider}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Issue Date</p>
                        <p>{new Date(version.issue_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expiry Date</p>
                        <p>{new Date(version.expiry_date).toLocaleDateString()}</p>
                      </div>
                      {version.premium && (
                        <div>
                          <p className="text-xs text-slate-500">Premium</p>
                          <p>Rs {version.premium.toLocaleString()}</p>
                        </div>
                      )}
                      {version.coverage && (
                        <div>
                          <p className="text-xs text-slate-500">Coverage</p>
                          <p>{version.coverage}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {documents.length === 0 && (
        <div className="text-center py-16">
          <FileText size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-600">Add your first vehicle document</p>
        </div>
      )}
    </div>
  );
};