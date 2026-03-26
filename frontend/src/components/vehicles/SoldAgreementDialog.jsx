import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Trash2, Eye, FileText, User, Phone, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

export const SoldAgreementDialog = ({ vehicle, open, onOpenChange, onSuccess }) => {
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_phone: '',
    agreement_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [uploading, setUploading] = useState(false);
  const [agreementData, setAgreementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (open && vehicle?.id) {
      fetchAgreement();
    }
  }, [open, vehicle]);

  const fetchAgreement = async () => {
    if (!vehicle?.id) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/vehicles/${vehicle.id}/sold-agreement`);
      if (response.data.has_agreement) {
        setAgreementData(response.data.agreement);
        setFormData({
          buyer_name: response.data.agreement.buyer_name || '',
          buyer_phone: response.data.agreement.buyer_phone || '',
          agreement_date: response.data.agreement.agreement_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          notes: response.data.agreement.notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!vehicle?.id) return;
    
    setUploading(true);
    try {
      const response = await api.post(`/vehicles/${vehicle.id}/sold-agreement`, {
        ...formData,
        agreement_date: new Date(formData.agreement_date).toISOString()
      });
      
      toast.success('Agreement details saved successfully');
      if (onSuccess) onSuccess();
      fetchAgreement();
    } catch (error) {
      console.error('Error saving agreement:', error);
      toast.error(error.response?.data?.detail || 'Failed to save agreement');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post(`/vehicles/${vehicle.id}/upload-agreement`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Agreement document uploaded successfully');
      fetchAgreement();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = api.defaults.baseURL || 'http://localhost:8000/api';
      const downloadUrl = `${baseURL}/vehicles/${vehicle.id}/download-agreement`;
      
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${vehicle.registration_number.replace(/[^a-zA-Z0-9]/g, "_")}_sold_agreement.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/vehicles/${vehicle.id}/sold-agreement`);
      toast.success('Agreement deleted successfully');
      setAgreementData(null);
      setFormData({
        buyer_name: '',
        buyer_phone: '',
        agreement_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete agreement');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {agreementData ? 'Sold Vehicle Details' : 'Mark Vehicle as Sold'}
            </DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vehicle Info */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700">Vehicle</p>
                      <p className="font-mono font-bold text-lg">{vehicle?.registration_number}</p>
                      <p className="text-sm text-emerald-600">{vehicle?.brand} {vehicle?.model}</p>
                    </div>
                    <Badge className="bg-emerald-600 text-white">Sold</Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Agreement Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <User size={14} /> Buyer Name <span className="text-slate-400 text-xs">(Optional)</span>
                    </Label>
                    <Input
                      value={formData.buyer_name}
                      onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                      placeholder="Enter buyer name"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone size={14} /> Buyer Phone <span className="text-slate-400 text-xs">(Optional)</span>
                    </Label>
                    <Input
                      value={formData.buyer_phone}
                      onChange={(e) => setFormData({ ...formData, buyer_phone: e.target.value })}
                      placeholder="Enter buyer phone number"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar size={14} /> Agreement Date <span className="text-slate-400 text-xs">(Optional)</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.agreement_date}
                    onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Notes <span className="text-slate-400 text-xs">(Optional)</span></Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the sale..."
                    rows={3}
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                >
                  {uploading ? 'Saving...' : agreementData ? 'Update Details' : 'Save Agreement Details'}
                </Button>
              </form>
              
              {/* Document Upload Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium">Agreement Document</Label>
                  {agreementData?.agreement_url && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleDownload}>
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                      <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 size={14} className="mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="agreement-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('agreement-upload').click()}
                    disabled={uploading}
                    className="flex-1"
                  >
                    <Upload size={14} className="mr-1" />
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                  <p className="text-xs text-slate-500">PDF, JPG, PNG (Max 10MB)</p>
                </div>
                
                {agreementData?.agreement_url && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-emerald-600" />
                      <span className="text-sm text-emerald-700">Document uploaded</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      {agreementData.agreement_file_type?.toUpperCase()} file • Uploaded on {new Date(agreementData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {/* View Sold Details Section */}
              {agreementData && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Sold Details</h4>
                  <div className="space-y-2 text-sm">
                    {agreementData.buyer_name && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Buyer Name:</span>
                        <span className="font-medium">{agreementData.buyer_name}</span>
                      </div>
                    )}
                    {agreementData.buyer_phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Buyer Phone:</span>
                        <span className="font-medium">{agreementData.buyer_phone}</span>
                      </div>
                    )}
                    {agreementData.agreement_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Agreement Date:</span>
                        <span className="font-medium">{new Date(agreementData.agreement_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {agreementData.notes && (
                      <div>
                        <span className="text-slate-600">Notes:</span>
                        <p className="mt-1 p-2 bg-slate-50 rounded text-slate-700">{agreementData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agreement Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the agreement document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};