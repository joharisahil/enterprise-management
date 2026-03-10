import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { 
  AlertTriangle, Plus, DollarSign, CheckCircle, Car, User, Filter, X,
  Calendar, Clock, MapPin, Gauge, TrendingUp, TrendingDown, AlertOctagon,
  Shield, Bell, CreditCard, Ban, Eye, Download, Phone, FileText, Info,
  Users, AlertCircle, Trash2, FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ChallansPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [challans, setChallans] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [phoneWarning, setPhoneWarning] = useState("");
  const [vehicleWarnings, setVehicleWarnings] = useState([]);
  const [driverWarnings, setDriverWarnings] = useState([]);
  const [exporting, setExporting] = useState(false);
  
const [formData, setFormData] = useState({
  id: null, // Add this for edit mode
  vehicle_id: '',
  driver_id: null,
  challan_number: '',
  date: '',
  phone_number: '',
  violation_type: '',
  amount: '',
  status: 'Unpaid',
  payment_date: '',
  location: '',
  proof_url: ''
});

  useEffect(() => {
    fetchData();
  }, [selectedVehicle, selectedDriver, selectedStatus]);

  const fetchData = async () => {
    try {
      let url = '/challans?';
      const params = [];
      
      if (selectedVehicle !== 'all') params.push(`vehicle_id=${selectedVehicle}`);
      if (selectedStatus !== 'all') params.push(`status=${selectedStatus}`);
      
      url += params.join('&');
      
      const [vehiclesRes, driversRes, challansRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get(url)
      ]);

      setVehicles(vehiclesRes.data.data);
      setDrivers(driversRes.data.data);
      
      // Filter by driver on client side (since backend might not support it)
      let filteredChallans = challansRes.data.data;
      if (selectedDriver !== 'all') {
        filteredChallans = filteredChallans.filter(c => c.driver_id === selectedDriver);
      }
      
      setChallans(filteredChallans);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

const checkVehicleWarnings = async (vehicleId) => {
  if (!vehicleId) return;

  try {
    const params = new URLSearchParams();
    if (formData.date) params.append('date', formData.date);
    if (formData.violation_type) params.append('violation_type', formData.violation_type);
    
    const response = await api.get(`/warnings/vehicle/${vehicleId}?${params}`);
    setVehicleWarnings(response.data.warnings);
  } catch (error) {
    console.error('Error checking vehicle warnings:', error);
  }
};

const checkDriverWarnings = async (driverId) => {
  if (!driverId || driverId === 'none') return;

  try {
    const params = new URLSearchParams();
    if (formData.date) params.append('date', formData.date);
    
    const response = await api.get(`/warnings/driver/${driverId}?${params}`);
    setDriverWarnings(response.data.warnings);
  } catch (error) {
    console.error('Error checking driver warnings:', error);
  }
};

  const handleVehicleChange = (value) => {
    setFormData({ ...formData, vehicle_id: value });
    checkVehicleWarnings(value);
  };

  const handleDriverChange = (value) => {
    setFormData({ ...formData, driver_id: value === 'none' ? null : value });
    if (value !== 'none') {
      checkDriverWarnings(value);
    } else {
      setDriverWarnings([]);
    }
  };

  const handleViolationTypeChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, violation_type: value });
    if (formData.vehicle_id) {
      checkVehicleWarnings(formData.vehicle_id);
    }
  };

  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum allowed size is 3MB");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      const res = await api.post("/upload-challan", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const { url } = res.data;
      setUploadedImage(url);
      setFormData(prev => ({
        ...prev,
        proof_url: url
      }));

      toast.success("Challan image uploaded successfully");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  let phoneTimer = null;

  const checkPhoneUsage = (value) => {
    if (!value || value.length !== 10 || !formData.vehicle_id) {
      setPhoneWarning("");
      return;
    }

    clearTimeout(phoneTimer);
    phoneTimer = setTimeout(async () => {
      try {
        const res = await api.get(`/check-phone-usage`, {
          params: {
            vehicle_id: formData.vehicle_id,
            phone_number: value,
            type: "challan"
          }
        });

        if (res.data.used_in.length > 0) {
          setPhoneWarning(
            `This number is already used in: ${res.data.used_in.join(", ")} challans for this vehicle`
          );
        } else {
          setPhoneWarning("");
        }
      } catch {
        setPhoneWarning("");
      }
    }, 500);
  };

  const markAsPaid = async (challanId, paymentDate) => {
    try {
      const isoDate = new Date(paymentDate).toISOString();
      await api.put(`/challans/${challanId}/pay?payment_date=${isoDate}`);
      toast.success("Challan marked as paid");
      fetchData();
    } catch (error) {
      toast.error("Failed to update challan");
    }
  };

  const deleteChallan = async (challanId) => {
    try {
      await api.delete(`/challans/${challanId}`);
      toast.success("Challan deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete challan");
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await api.post('/challans', {
      ...formData,
      driver_id: formData.driver_id === 'none' ? null : formData.driver_id,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null
    });

    toast.success('Challan record created successfully');
    
    // Close dialog first
    setDialogOpen(false);
    
    // Reset form after dialog is closed
    setTimeout(() => {
      setFormData({
  id: null,
  vehicle_id: '',
  driver_id: null,
  challan_number: '',
  date: '',
  phone_number: '',
  violation_type: '',
  amount: '',
  status: 'Unpaid',
  payment_date: '',
  location: '',
  proof_url: ''
});
      setUploadedImage(null);
      setPhoneWarning("");
      setVehicleWarnings([]);
      setDriverWarnings([]);
    }, 100); // Small delay to ensure dialog close animation completes
    
    fetchData();
  } catch (error) {
    console.error('Error creating challan:', error);
    toast.error(error.response?.data?.detail || 'Failed to create challan');
  }
};

  const handleExportExcel = async (exportType = 'all') => {
    try {
      setExporting(true);
      
      let response;
      let filename = '';
      
      if (exportType === 'filtered') {
        // Export current filtered view
        const vehicleMap = {};
        vehicles.forEach(v => {
          vehicleMap[v.id] = {
            registration_number: v.registration_number,
            brand: v.brand,
            model: v.model
          };
        });
        
        const driverMap = {};
        drivers.forEach(d => {
          driverMap[d.id] = {
            full_name: d.full_name
          };
        });
        
        response = await api.post('/export/challans/current-view/excel', {
          challans: filteredChallans,
          vehicle_map: vehicleMap,
          driver_map: driverMap
        }, {
          responseType: 'blob'
        });
        
        filename = `filtered_challans_${new Date().toISOString().split('T')[0]}.xlsx`;
        
      } else if (exportType === 'vehicle' && selectedVehicle !== 'all') {
        // Export specific vehicle
        let urlParams = `/export/challans/excel?vehicle_id=${selectedVehicle}`;
        if (selectedStatus !== 'all') {
          urlParams += `&status=${selectedStatus}`;
        }
        
        response = await api.get(urlParams, { responseType: 'blob' });
        
        const vehicle = vehicles.find(v => v.id === selectedVehicle);
        const vehicleReg = vehicle ? vehicle.registration_number.replace(/[^a-zA-Z0-9]/g, '_') : 'vehicle';
        filename = `${vehicleReg}_challans_${new Date().toISOString().split('T')[0]}.xlsx`;
        
      } else if (exportType === 'driver' && selectedDriver !== 'all' && selectedDriver !== 'all') {
        // Export specific driver
        let urlParams = `/export/challans/excel?driver_id=${selectedDriver}`;
        if (selectedStatus !== 'all') {
          urlParams += `&status=${selectedStatus}`;
        }
        
        response = await api.get(urlParams, { responseType: 'blob' });
        
        const driver = drivers.find(d => d.id === selectedDriver);
        const driverName = driver ? driver.full_name.replace(/[^a-zA-Z0-9]/g, '_') : 'driver';
        filename = `${driverName}_challans_${new Date().toISOString().split('T')[0]}.xlsx`;
        
      } else {
        // Export all with current filters
        let urlParams = '/export/challans/excel?';
        const params = [];
        
        if (selectedVehicle !== 'all') params.push(`vehicle_id=${selectedVehicle}`);
        if (selectedDriver !== 'all') params.push(`driver_id=${selectedDriver}`);
        if (selectedStatus !== 'all') params.push(`status=${selectedStatus}`);
        
        urlParams += params.join('&');
        
        response = await api.get(urlParams, { responseType: 'blob' });
        filename = `challans_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      }
      
      // Handle download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.detail || 'Failed to export challans');
    } finally {
      setExporting(false);
    }
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.registration_number : vehicleId;
  };

  const getDriverName = (driverId) => {
    if (!driverId) return 'N/A';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.full_name : driverId;
  };

  // Calculate dashboard stats
  const stats = useMemo(() => {
    const total = challans.length;
    const paid = challans.filter(c => c.status === 'Paid').length;
    const unpaid = challans.filter(c => c.status === 'Unpaid').length;
    const totalAmount = challans.reduce((sum, c) => sum + c.amount, 0);
    const unpaidAmount = challans.filter(c => c.status === 'Unpaid').reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = challans.filter(c => c.status === 'Paid').reduce((sum, c) => sum + c.amount, 0);
    
    // Violation type breakdown
    const violationTypes = {};
    challans.forEach(c => {
      violationTypes[c.violation_type] = (violationTypes[c.violation_type] || 0) + 1;
    });
    
    const topViolations = Object.entries(violationTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    // Monthly trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentChallans = challans.filter(c => new Date(c.date) >= thirtyDaysAgo);
    const recentAmount = recentChallans.reduce((sum, c) => sum + c.amount, 0);
    
    // Driver stats
    const driverStats = {};
    challans.forEach(c => {
      if (c.driver_id) {
        driverStats[c.driver_id] = (driverStats[c.driver_id] || 0) + 1;
      }
    });
    
    const topDriver = Object.entries(driverStats)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      total,
      paid,
      unpaid,
      totalAmount,
      unpaidAmount,
      paidAmount,
      topViolations,
      recentChallans: recentChallans.length,
      recentAmount,
      topDriver: topDriver ? { id: topDriver[0], count: topDriver[1] } : null
    };
  }, [challans]);

  // Filter options
  const filteredChallans = useMemo(() => {
    return challans;
  }, [challans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="challans-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Traffic Challans
          </h1>
          <p className="text-slate-600">Track and manage vehicle violations and fines</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="border-slate-300"
                disabled={exporting || challans.length === 0}
              >
                <FileSpreadsheet size={18} className="mr-2 text-emerald-600" />
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => handleExportExcel('all')}
                disabled={exporting}
                className="cursor-pointer"
              >
                <Download size={14} className="mr-2" />
                All Challans
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExportExcel('filtered')}
                disabled={exporting || filteredChallans.length === 0}
                className="cursor-pointer"
              >
                <Download size={14} className="mr-2" />
                Current Filtered View ({filteredChallans.length})
              </DropdownMenuItem>
              {selectedVehicle !== 'all' && (
                <DropdownMenuItem 
                  onClick={() => handleExportExcel('vehicle')}
                  disabled={exporting}
                  className="cursor-pointer"
                >
                  <Download size={14} className="mr-2" />
                  This Vehicle Only
                </DropdownMenuItem>
              )}
              {selectedDriver !== 'all' && selectedDriver !== 'all' && (
                <DropdownMenuItem 
                  onClick={() => handleExportExcel('driver')}
                  disabled={exporting}
                  className="cursor-pointer"
                >
                  <Download size={14} className="mr-2" />
                  This Driver Only
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                // Reset form when dialog is closed
                setFormData({
                  vehicle_id: '',
                  driver_id: null,
                  challan_number: '',
                  date: '',
                  phone_number: '',
                  violation_type: '',
                  amount: '',
                  status: 'Unpaid',
                  payment_date: '',
                  location: '',
                  proof_url: ''
                });
                setUploadedImage(null);
                setPhoneWarning("");
                setVehicleWarnings([]);
                setDriverWarnings([]);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-rose-600 hover:bg-rose-700" data-testid="add-challan-button">
                <Plus size={18} className="mr-2" />
                Add Challan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Traffic Challan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Warnings Section */}
          {/* Warnings Section with Details */}
    {(vehicleWarnings.length > 0 || driverWarnings.length > 0) && (
      <div className="space-y-3">
        {vehicleWarnings.map((warning, index) => (
          <Alert key={`vehicle-${index}`} className={
            warning.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 
            warning.severity === 'info' ? 'bg-blue-50 border-blue-200' : 
            'bg-rose-50 border-rose-200'
          }>
            <div className="flex items-start gap-2">
              <AlertCircle className={`h-4 w-4 mt-0.5 ${
                warning.severity === 'warning' ? 'text-amber-600' : 
                warning.severity === 'info' ? 'text-blue-600' : 
                'text-rose-600'
              }`} />
              <div className="flex-1">
                <AlertDescription className={
                  warning.severity === 'warning' ? 'text-amber-700' : 
                  warning.severity === 'info' ? 'text-blue-700' : 
                  'text-rose-700'
                }>
                  <p className="font-medium mb-1">{warning.message}</p>
                  
                  {/* Vehicle same day details */}
                  {warning.type === 'multiple_same_day' && warning.details && (
                    <div className="mt-2 space-y-1 text-sm">
                      {warning.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Clock size={12} />
                          <span>{detail.time} - {detail.type} (Rs {detail.amount.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Pending amount */}
                  {warning.type === 'pending' && warning.totalAmount && (
                    <p className="mt-1 text-sm font-medium">
                      Total pending amount: Rs {warning.totalAmount.toLocaleString()}
                    </p>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
        
        {driverWarnings.map((warning, index) => (
          <Alert key={`driver-${index}`} className={
            warning.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 
            warning.severity === 'info' ? 'bg-blue-50 border-blue-200' : 
            'bg-rose-50 border-rose-200'
          }>
            <div className="flex items-start gap-2">
              <User className={`h-4 w-4 mt-0.5 ${
                warning.severity === 'warning' ? 'text-amber-600' : 
                warning.severity === 'info' ? 'text-blue-600' : 
                'text-rose-600'
              }`} />
              <div className="flex-1">
                <AlertDescription className={
                  warning.severity === 'warning' ? 'text-amber-700' : 
                  warning.severity === 'info' ? 'text-blue-700' : 
                  'text-rose-700'
                }>
                  <p className="font-medium mb-1">{warning.message}</p>
                  
                  {/* Driver same day details */}
                  {warning.type === 'driver_multiple_same_day' && warning.details && (
                    <div className="mt-2 space-y-1 text-sm">
                      {warning.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Car size={12} />
                          <span>{detail.vehicle} - {detail.time} - {detail.type} (Rs {detail.amount.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Driver week summary with vehicle details */}
                  {warning.type === 'driver_week_multiple' && warning.details && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium">Vehicles involved:</p>
                      <p className="mt-1">{warning.details.vehicles}</p>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </div>
    )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vehicle *</Label>
                  <Select
                    value={formData.vehicle_id}
                    onValueChange={handleVehicleChange}
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
                  <Label>Driver (Optional)</Label>
                  <Select
                    value={formData.driver_id || 'none'}
                    onValueChange={handleDriverChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Challan Number *</Label>
                  <Input
                    required
                    value={formData.challan_number}
                    onChange={(e) => setFormData({ ...formData, challan_number: e.target.value })}
                    placeholder="CH-2024-001234"
                  />
                </div>

                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Violation Type *</Label>
                <Input
                  required
                  value={formData.violation_type}
                  onChange={handleViolationTypeChange}
                  placeholder="e.g., Overspeed, Red Light, No Helmet"
                />
              </div>

              <div>
                <Label>Location *</Label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., NH-48, Delhi-Gurgaon Expressway"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (Rs) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="1000"
                  />
                </div>

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

              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  maxLength={10}
                  value={formData.phone_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone_number: value });
                    checkPhoneUsage(value);
                  }}
                />
                {phoneWarning && (
                  <p className="text-red-600 text-sm mt-1">{phoneWarning}</p>
                )}
              </div>

              <div>
                <Label>Upload Challan Image</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 3MB • Images auto-compressed
                </p>
                {uploading && (
                  <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                )}

                {uploadedImage && (
                  uploadedImage.includes(".pdf") || uploadedImage.includes("/raw/") ? (
                    <a
                      href={uploadedImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-blue-600 underline"
                    >
                      View Uploaded PDF
                    </a>
                  ) : (
                    <img
                      src={uploadedImage}
                      alt="Uploaded Challan"
                      className="mt-3 rounded-lg border w-64"
                    />
                  )
                )}
              </div>

              <Button
                type="submit"
                disabled={uploading}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Create Challan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Challans</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {stats.recentChallans} in last 30 days
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <AlertTriangle size={24} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Unpaid Challans</p>
                <p className="text-3xl font-bold text-rose-600">{stats.unpaid}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {stats.unpaid > 0 ? `${Math.round((stats.unpaid / stats.total) * 100)}% of total` : 'No pending'}
                </p>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <Ban size={24} className="text-rose-600" />
              </div>
            </div>
            <Progress value={(stats.unpaid / stats.total) * 100} className="mt-3 h-1.5 bg-rose-100" indicatorClassName="bg-rose-600" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Unpaid Amount</p>
                <p className="text-3xl font-bold text-rose-600">Rs {stats.unpaidAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Avg: Rs {stats.unpaid > 0 ? Math.round(stats.unpaidAmount / stats.unpaid) : 0} per challan
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <DollarSign size={24} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Paid Amount</p>
                <p className="text-3xl font-bold text-emerald-600">Rs {stats.paidAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {stats.paid} challans cleared
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp size={16} />
              Top Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topViolations.length > 0 ? (
              <div className="space-y-2">
                {stats.topViolations.map(([type, count], index) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{type}</span>
                    <Badge variant="outline" className="font-mono">{count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No violations recorded</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users size={16} />
              Driver Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topDriver ? (
              <div>
                <p className="text-sm text-slate-700">Most frequent offender:</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {getDriverName(stats.topDriver.id)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {stats.topDriver.count} challans
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No driver data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock size={16} />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{stats.recentChallans}</span> challans in last 30 days
            </p>
            <p className="text-sm text-slate-700 mt-1">
              Amount: <span className="font-semibold text-rose-600">Rs {stats.recentAmount.toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by vehicle" />
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

        <Select value={selectedDriver} onValueChange={setSelectedDriver}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>

        {(selectedVehicle !== 'all' || selectedDriver !== 'all' || selectedStatus !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedVehicle('all');
              setSelectedDriver('all');
              setSelectedStatus('all');
            }}
            className="text-slate-600 hover:text-slate-900"
          >
            <X size={14} className="mr-1" />
            Clear Filters
          </Button>
        )}

        {/* Quick Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportExcel('filtered')}
          disabled={exporting || filteredChallans.length === 0}
          className="ml-auto border-slate-300"
        >
          <FileSpreadsheet size={16} className="mr-1 text-emerald-600" />
          Export Current View
        </Button>
      </div>

      {/* Summary Cards for filtered view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm bg-rose-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-700 uppercase tracking-wide mb-1">Filtered Unpaid</p>
                <p className="text-2xl font-bold text-rose-700">
                  {challans.filter(c => c.status === 'Unpaid').length}
                </p>
              </div>
              <Ban size={20} className="text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 uppercase tracking-wide mb-1">Filtered Paid</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {challans.filter(c => c.status === 'Paid').length}
                </p>
              </div>
              <CheckCircle size={20} className="text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 uppercase tracking-wide mb-1">Filtered Amount</p>
                <p className="text-2xl font-bold text-amber-700">
                  Rs {challans.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign size={20} className="text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Challans List */}
      <AnimatePresence>
        <div className="space-y-4">
          {filteredChallans.map((challan) => (
            <ChallanCard 
              key={challan.id} 
              challan={challan} 
              getVehicleName={getVehicleName} 
              getDriverName={getDriverName} 
              markAsPaid={markAsPaid}
              deleteChallan={deleteChallan} 
            />
          ))}
        </div>
      </AnimatePresence>

      {filteredChallans.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200"
        >
          <AlertTriangle size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No challans found</h3>
          <p className="text-slate-600">
            {selectedVehicle !== 'all' || selectedDriver !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first challan record'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

const ChallanCard = ({ challan, getVehicleName, getDriverName, markAsPaid, deleteChallan }) => {
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  const downloadFile = async (url, challanNumber) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      let extension = "jpg";
      const contentType = response.headers.get("content-type");

      if (
        contentType?.includes("pdf") ||
        url.toLowerCase().includes(".pdf") ||
        url.includes("/raw/")
      ) {
        extension = "pdf";
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `challan-${challanNumber}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Download failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
      data-testid={`challan-card-${challan.id}`}
    >
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Header with badges */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-100 rounded-md">
                    <AlertTriangle size={18} className="text-rose-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 font-mono">{challan.challan_number}</h3>
                </div>
                <Badge className={challan.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}>
                  {challan.status === 'Paid' ? <CheckCircle size={12} className="mr-1" /> : <AlertTriangle size={12} className="mr-1" />}
                  {challan.status}
                </Badge>
                {challan.driver_id && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User size={12} className="mr-1" />
                    Driver Linked
                  </Badge>
                )}
              </div>

              {/* Vehicle and Driver info */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Car size={14} className="text-slate-400" />
                  <span className="font-medium">{getVehicleName(challan.vehicle_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={14} className="text-slate-400" />
                  <span>{getDriverName(challan.driver_id)}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Violation</p>
                  <p className="text-sm font-semibold text-slate-900">{challan.violation_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fine Amount</p>
                  <p className="text-lg font-bold text-rose-600">Rs {challan.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date</p>
                  <p className="text-sm">{new Date(challan.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm text-slate-600">{challan.location}</p>
                </div>
              </div>

              {/* Payment info and Phone */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {challan.payment_date && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle size={12} />
                      <span>Paid on {new Date(challan.payment_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {challan.phone_number && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone size={12} className="text-slate-400" />
                      <span>{challan.phone_number}</span>
                    </div>
                  )}
                </div>

                {/* Proof document */}
                {challan.proof_url && (
                  <div className="flex items-center gap-2">
                    {challan.proof_url.includes(".pdf") || challan.proof_url.includes("/raw/") ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadFile(challan.proof_url, challan.challan_number)}
                        className="h-7 px-2 text-xs"
                      >
                        <FileText size={12} className="mr-1" />
                        Download PDF
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadFile(challan.proof_url, challan.challan_number)}
                        className="h-7 px-2 text-xs"
                      >
                        <Eye size={12} className="mr-1" />
                        View Image
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1 ml-4">
              {challan.status === "Unpaid" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mark Challan as Paid</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Label>Payment Date</Label>
                            <Input
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                            />
                            <Button
                              className="w-full bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => {
                                if (!paymentDate) {
                                  toast.error("Please select payment date");
                                  return;
                                }
                                markAsPaid(challan.id, paymentDate);
                                setPayDialogOpen(false);
                              }}
                            >
                              Confirm Payment
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TooltipTrigger>
                    <TooltipContent>Mark as Paid</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <AlertDialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Delete Challan</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Challan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The challan record will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteChallan(challan.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};