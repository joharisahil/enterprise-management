import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { Building2, Plus, Edit, Trash2, MapPin, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Commercial',
    address: '',
    area_sqft: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data.data);
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/properties', {
        ...formData,
        area_sqft: parseFloat(formData.area_sqft)
      });
      
      toast.success('Property created successfully');
      setDialogOpen(false);
      setFormData({ name: '', type: 'Commercial', address: '', area_sqft: '' });
      fetchProperties();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to create property');
    }
  };

  const handleEdit = (property) => {
    setSelectedProperty(property);
    setFormData({
      name: property.name,
      type: property.type,
      address: property.address,
      area_sqft: property.area_sqft.toString()
    });
    setEditDialogOpen(true);
  };

  const handleView = (property) => {
    setSelectedProperty(property);
    setViewDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/properties/${selectedProperty.id}`, {
        ...formData,
        area_sqft: parseFloat(formData.area_sqft)
      });
      
      toast.success('Property updated successfully');
      setEditDialogOpen(false);
      setSelectedProperty(null);
      setFormData({ name: '', type: 'Commercial', address: '', area_sqft: '' });
      fetchProperties();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail || 'Failed to update property');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted');
      fetchProperties();
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to delete property');
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
    <div className="p-8" data-testid="properties-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Properties
          </h1>
          <p className="text-slate-600">Manage your commercial, residential & industrial properties</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900" data-testid="add-property-button">
              <Plus size={18} className="mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  required
                  data-testid="property-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mumbai Office Complex"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Property Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="property-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  required
                  data-testid="property-address-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              
              <div>
                <Label htmlFor="area_sqft">Area (sq ft)</Label>
                <Input
                  id="area_sqft"
                  type="number"
                  required
                  data-testid="property-area-input"
                  value={formData.area_sqft}
                  onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                  placeholder="5000"
                />
              </div>
              
              <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900" data-testid="submit-property-button">
                Create Property
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Property Name</Label>
              <Input
                id="edit-name"
                required
                data-testid="edit-property-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Mumbai Office Complex"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-type">Property Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger data-testid="edit-property-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                required
                data-testid="edit-property-address-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-area_sqft">Area (sq ft)</Label>
              <Input
                id="edit-area_sqft"
                type="number"
                required
                data-testid="edit-property-area-input"
                value={formData.area_sqft}
                onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                placeholder="5000"
              />
            </div>
            
            <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900" data-testid="update-property-button">
              Update Property
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 size={32} className="text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{selectedProperty.name}</h3>
                  <Badge variant="outline">{selectedProperty.type}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-slate-500" />
                    <p className="text-sm text-slate-700">{selectedProperty.address}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Area</p>
                  <p className="text-lg font-semibold text-slate-900">{selectedProperty.area_sqft.toLocaleString()} sq ft</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm text-slate-700">{new Date(selectedProperty.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Property ID</p>
                  <p className="text-xs text-slate-500 font-mono">{selectedProperty.id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            data-testid={`property-card-${property.id}`}
          >
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <Building2 size={24} className="text-blue-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{property.type}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{property.address}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">
                    {property.area_sqft.toLocaleString()} sq ft
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(property)}
                      data-testid={`view-property-${property.id}`}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(property)}
                      data-testid={`edit-property-${property.id}`}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleDelete(property.id)}
                      data-testid={`delete-property-${property.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-16">
          <Building2 size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties yet</h3>
          <p className="text-slate-600 mb-4">Add your first property to get started</p>
        </div>
      )}
    </div>
  );
};
