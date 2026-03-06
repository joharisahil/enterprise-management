import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import {
  Truck, Plus, Edit, Trash2, Fuel, Gauge, Eye, Download, Upload,
  FileText, AlertTriangle, Wrench, AlertCircle, Calendar, User, MapPin,
  CheckCircle, XCircle, X, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const vehicleTypes = ['Car', 'Truck', 'Van', 'Bike', 'Bus', 'JCB', 'Tractor', 'Crane'];
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
  seating_capacity: '',
  owner_name: '',
  file_status: false,
  site_name: '',
  date_of_registration: '',
  tax_upto: '',
  remark: '',
  fastag_company: '',
  fastag_balance: '',
  fastag_user_id: '',
  fastag_password: '',
  fastag_sold: false,
  fastag_sold_date: ''
};
const FastagPasswordInput = ({ formData, setFormData }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        value={formData.fastag_password}
        onChange={(e) =>
          setFormData({ ...formData, fastag_password: e.target.value })
        }
        placeholder="FASTag Password"
      />

      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-2 text-slate-500 hover:text-slate-700"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

const VehicleForm = ({ formData, setFormData, onSubmit, submitText }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
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
      <div>
        <Label>Owner Name</Label>
        <Input
          value={formData.owner_name}
          onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
          placeholder="John Doe"
        />
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
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

      <div>
        <Label>Site Name</Label>
        <Input
          value={formData.site_name}
          onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
          placeholder="Mumbai HQ"
        />
      </div>
    </div>

    <div className="grid grid-cols-4 gap-4">
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
      <div>
        <Label>Color</Label>
        <Input
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          placeholder="White"
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

    <div className="grid grid-cols-3 gap-4">
      <div>
        <Label>DOR (Date of Registration)</Label>
        <Input
          type="date"
          value={formData.date_of_registration}
          onChange={(e) => setFormData({ ...formData, date_of_registration: e.target.value })}
        />
      </div>
      <div>
        <Label>Tax Upto</Label>
        <Input
          value={formData.tax_upto}
          onChange={(e) => setFormData({ ...formData, tax_upto: e.target.value })}
          placeholder="2025-03-31 or Dec 2025"
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
          value={formData.tank_capacity_liters}
          onChange={(e) => setFormData({ ...formData, tank_capacity_liters: e.target.value })}
          placeholder="50"
        />
      </div>
    </div>

    {/* FASTag Section */}
    <div className="border-t pt-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">FASTag Information</h3>

      <div className="grid grid-cols-4 gap-4">

        <div>
          <Label>FASTag Company</Label>
          <Input
            value={formData.fastag_company}
            onChange={(e) =>
              setFormData({ ...formData, fastag_company: e.target.value })
            }
            placeholder="Paytm / ICICI / HDFC"
          />
        </div>

        <div>
          <Label>FASTag Balance</Label>
          <Input
            type="number"
            value={formData.fastag_balance}
            onChange={(e) =>
              setFormData({ ...formData, fastag_balance: e.target.value })
            }
            placeholder="500"
          />
        </div>

        <div>
          <Label>FASTag User ID</Label>
          <Input
            value={formData.fastag_user_id}
            onChange={(e) =>
              setFormData({ ...formData, fastag_user_id: e.target.value })
            }
            placeholder="User ID"
          />
        </div>

        <div>
          <Label>FASTag Password</Label>
          <FastagPasswordInput formData={formData} setFormData={setFormData} />
        </div>

      </div>

      <div className="flex items-center gap-3 pt-4">
        <Switch
          checked={formData.fastag_sold}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, fastag_sold: checked })
          }
        />
        <Label>FASTag Sold</Label>
      </div>
    </div>


    <div className="flex items-center gap-3 pt-6">
      <Switch
        checked={formData.file_status}
        onCheckedChange={(checked) => setFormData({ ...formData, file_status: checked })}
      />
      <Label>File Status (Complete)</Label>
    </div>



    <div>
      <Label>Remark</Label>
      <Textarea
        value={formData.remark}
        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
        placeholder="Any additional notes about this vehicle..."
        rows={2}
      />
    </div>

    <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800" data-testid="submit-vehicle-button">
      {submitText}
    </Button>
  </form>
);

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleReport, setVehicleReport] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);

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
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        average_kmpl: parseFloat(formData.average_kmpl),
        tank_capacity_liters: parseFloat(formData.tank_capacity_liters),
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
        date_of_registration: formData.date_of_registration ? new Date(formData.date_of_registration).toISOString() : null,
        fastag_balance: formData.fastag_balance
          ? parseFloat(formData.fastag_balance)
          : null,
        fastag_sold_date: formData.fastag_sold_date
          ? new Date(formData.fastag_sold_date).toISOString()
          : null
      };

      await api.post('/vehicles', payload);

      toast.success('Vehicle added successfully');
      setDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(
        error.response?.data?.detail?.[0]?.msg || 'Failed to add vehicle'
      );
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
      seating_capacity: vehicle.seating_capacity?.toString() || '',
      owner_name: vehicle.owner_name || '',
      file_status: vehicle.file_status || false,
      site_name: vehicle.site_name || '',
      date_of_registration: vehicle.date_of_registration ? vehicle.date_of_registration.split('T')[0] : '',
      tax_upto: vehicle.tax_upto || '',
      remark: vehicle.remark || '',

      fastag_company: vehicle.fastag_company || '',
      fastag_balance: vehicle.fastag_balance?.toString() || '',
      fastag_user_id: vehicle.fastag_user_id || '',
      fastag_password: vehicle.fastag_password || '',
      fastag_sold: vehicle.fastag_sold || false,
      fastag_sold_date: vehicle.fastag_sold_date || ''
    });
    setEditDialogOpen(true);
  };

  const handleView = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setViewDialogOpen(true);

    try {
      const response = await api.get(`/vehicles/${vehicle.id}/full-report`);
      setVehicleReport(response.data);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error('Failed to load vehicle report');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        average_kmpl: parseFloat(formData.average_kmpl),
        tank_capacity_liters: parseFloat(formData.tank_capacity_liters),
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
        date_of_registration: formData.date_of_registration
          ? new Date(formData.date_of_registration).toISOString()
          : null,

        fastag_balance: formData.fastag_balance
          ? parseFloat(formData.fastag_balance)
          : null,

        fastag_sold_date: formData.fastag_sold_date
          ? new Date(formData.fastag_sold_date).toISOString()
          : null
      };

      await api.put(`/vehicles/${selectedVehicle.id}`, payload);

      toast.success('Vehicle updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(
        error.response?.data?.detail?.[0]?.msg || 'Failed to update vehicle'
      );
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

  const handleExport = async () => {
    try {
      const response = await api.get('/vehicles/export/csv');
      const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Vehicles exported successfully');
    } catch (error) {
      console.error("Export error:", error);
      toast.error('Failed to export vehicles');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/vehicles/template/csv');
      const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch (error) {
      console.error("Template error:", error);
      toast.error('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('Please paste CSV data');
      return;
    }

    setImporting(true);
    try {
      const response = await api.post('/vehicles/import/csv', { csv_data: importData });
      toast.success(`Imported ${response.data.imported} vehicles`);
      if (response.data.errors.length > 0) {
        toast.warning(`${response.data.errors.length} rows had errors`);
      }
      setImportDialogOpen(false);
      setImportData('');
      fetchVehicles();
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error.response?.data?.detail || 'Failed to import vehicles');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!vehicleReport) return;

    const { vehicle, documents, challans, services, accidents, summary } = vehicleReport;

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vehicle Report - ${vehicle.registration_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
          .info-item { background: #f8fafc; padding: 12px; border-radius: 8px; }
          .info-item label { font-size: 11px; color: #64748b; text-transform: uppercase; display: block; }
          .info-item span { font-size: 14px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
          th { background: #f1f5f9; font-weight: 600; }
          .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card .value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .badge-yellow { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Vehicle Report</h1>
            <p style="color: #64748b;">Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: bold;">${vehicle.registration_number}</div>
            <div style="color: #64748b;">${vehicle.brand} ${vehicle.model}</div>
          </div>
        </div>
        
        <h2>Vehicle Information</h2>
        <div class="info-grid">
          <div class="info-item"><label>Type</label><span>${vehicle.type}</span></div>
          <div class="info-item"><label>Year</label><span>${vehicle.year || 'N/A'}</span></div>
          <div class="info-item"><label>Fuel Type</label><span>${vehicle.fuel_type}</span></div>
          <div class="info-item"><label>Color</label><span>${vehicle.color || 'N/A'}</span></div>
          <div class="info-item"><label>Chassis Number</label><span>${vehicle.chassis_number || 'N/A'}</span></div>
          <div class="info-item"><label>Engine Number</label><span>${vehicle.engine_number || 'N/A'}</span></div>
          <div class="info-item"><label>Owner Name</label><span>${vehicle.owner_name || 'N/A'}</span></div>
          <div class="info-item"><label>Site Name</label><span>${vehicle.site_name || 'N/A'}</span></div>
          <div class="info-item"><label>File Status</label><span>${vehicle.file_status ? 'Yes' : 'No'}</span></div>
          <div class="info-item"><label>Date of Registration</label><span>${vehicle.date_of_registration ? new Date(vehicle.date_of_registration).toLocaleDateString() : 'N/A'}</span></div>
          <div class="info-item"><label>Tax Upto</label><span>${vehicle.tax_upto || 'N/A'}</span></div>
          <div class="info-item"><label>Average Mileage</label><span>${vehicle.average_kmpl} km/l</span></div>
          <div class="info-item"><label>Tank Capacity</label><span>${vehicle.tank_capacity_liters} L</span></div>
          <div class="info-item"><label>Seating Capacity</label><span>${vehicle.seating_capacity || 'N/A'}</span></div>
          <div class="info-item"><label>Remark</label><span>${vehicle.remark || 'N/A'}</span></div>
        </div>
        
        <h2>Summary</h2>
        <div class="summary-cards">
          <div class="summary-card"><div class="value">${summary.total_documents || 0}</div><div class="label">Documents</div></div>
          <div class="summary-card"><div class="value">${summary.total_challans || 0}</div><div class="label">Challans</div></div>
          <div class="summary-card"><div class="value">${summary.total_services || 0}</div><div class="label">Services</div></div>
          <div class="summary-card"><div class="value">${summary.total_accidents || 0}</div><div class="label">Accidents</div></div>
        </div>
        
        <h2>Documents (${documents.length})</h2>
        ${documents.length > 0 ? `
          <table>
            <thead><tr><th>Type</th><th>Policy Number</th><th>Provider</th><th>Issue Date</th><th>Expiry Date</th><th>Status</th></tr></thead>
            <tbody>
              ${documents.map(d => `
                <tr>
                  <td>${d.document_type}</td>
                  <td>${d.policy_number}</td>
                  <td>${d.provider}</td>
                  <td>${new Date(d.issue_date).toLocaleDateString()}</td>
                  <td>${new Date(d.expiry_date).toLocaleDateString()}</td>
                  <td><span class="badge ${d.status === 'Active' ? 'badge-green' : 'badge-red'}">${d.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #94a3b8;">No documents found</p>'}
        
        <h2>Challans (${challans.length}) - Total: Rs ${(summary.total_challan_amount || 0).toLocaleString()}</h2>
        ${challans.length > 0 ? `
          <table>
            <thead><tr><th>Challan No</th><th>Date</th><th>Violation</th><th>Amount</th><th>Location</th><th>Status</th></tr></thead>
            <tbody>
              ${challans.map(c => `
                <tr>
                  <td>${c.challan_number}</td>
                  <td>${new Date(c.date).toLocaleDateString()}</td>
                  <td>${c.violation_type}</td>
                  <td>Rs ${(c.amount || 0).toLocaleString()}</td>
                  <td>${c.location}</td>
                  <td><span class="badge ${c.status === 'Paid' ? 'badge-green' : 'badge-red'}">${c.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #94a3b8;">No challans found</p>'}
        
        <h2>Service Records (${services.length}) - Total Cost: Rs ${(summary.total_service_cost || 0).toLocaleString()}</h2>
        ${services.length > 0 ? `
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Odometer</th><th>Cost</th><th>Vendor</th></tr></thead>
            <tbody>
              ${services.map(s => `
                <tr>
                  <td>${new Date(s.date).toLocaleDateString()}</td>
                  <td>${s.service_type}</td>
                  <td>${s.description}</td>
                  <td>${s.odometer_reading || 0} km</td>
                  <td>Rs ${(s.total_cost || 0).toLocaleString()}</td>
                  <td>${s.vendor || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #94a3b8;">No service records found</p>'}
        
        <h2>Accidents (${accidents.length})</h2>
        ${accidents.length > 0 ? `
          <table>
            <thead><tr><th>Date</th><th>Location</th><th>Description</th><th>Damage Est.</th><th>Claim Status</th></tr></thead>
            <tbody>
              ${accidents.map(a => `
                <tr>
                  <td>${new Date(a.date).toLocaleDateString()}</td>
                  <td>${a.location}</td>
                  <td>${a.description}</td>
                  <td>Rs ${(a.damage_estimate || 0).toLocaleString()}</td>
                  <td><span class="badge badge-yellow">${a.claim_status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color: #94a3b8;">No accidents found</p>'}
        
        <div class="footer">
          <p>Enterprise ERP System - Vehicle Report</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing/saving
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedVehicle(null);
  };

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

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} data-testid="download-template-btn">
            <Download size={16} className="mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="import-btn">
            <Upload size={16} className="mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="export-btn">
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-700 hover:bg-emerald-800" data-testid="add-vehicle-button">
                <Plus size={18} className="mr-2" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
              </DialogHeader>
              <VehicleForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                submitText="Add Vehicle"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <VehicleForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            submitText="Update Vehicle"
          />
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Vehicles from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">
                Paste your CSV data below. First row should be headers.
              </p>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download size={14} className="mr-2" />
                Download Template with Sample Data
              </Button>
            </div>
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="registration_number,type,brand,model,year,..."
              rows={10}
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={importing} className="bg-emerald-700 hover:bg-emerald-800">
                {importing ? 'Importing...' : 'Import Vehicles'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog - Comprehensive Report */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) { setVehicleReport(null); } }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Vehicle Details</DialogTitle>
              {vehicleReport && (
                <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                  <Download size={16} className="mr-2" />
                  Download PDF Report
                </Button>
              )}
            </div>
          </DialogHeader>

          {!vehicleReport ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Vehicle Header */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Truck size={40} className="text-emerald-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 font-mono">{vehicleReport.vehicle.registration_number}</h3>
                  <p className="text-lg text-slate-600">{vehicleReport.vehicle.brand} {vehicleReport.vehicle.model} {vehicleReport.vehicle.year && `(${vehicleReport.vehicle.year})`}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{vehicleReport.vehicle.type}</Badge>
                    <Badge variant="outline">{vehicleReport.vehicle.fuel_type}</Badge>
                    {vehicleReport.vehicle.file_status ? (
                      <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle size={12} className="mr-1" />File Complete</Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-700"><XCircle size={12} className="mr-1" />File Incomplete</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <FileText size={24} className="mx-auto text-blue-700 mb-2" />
                    <p className="text-2xl font-bold text-blue-700">{vehicleReport.summary.total_documents || 0}</p>
                    <p className="text-xs text-blue-600">Documents ({vehicleReport.summary.active_documents || 0} active)</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle size={24} className="mx-auto text-amber-700 mb-2" />
                    <p className="text-2xl font-bold text-amber-700">{vehicleReport.summary.total_challans || 0}</p>
                    <p className="text-xs text-amber-600">Challans (Rs {(vehicleReport.summary.total_challan_amount || 0).toLocaleString()})</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <Wrench size={24} className="mx-auto text-purple-700 mb-2" />
                    <p className="text-2xl font-bold text-purple-700">{vehicleReport.summary.total_services || 0}</p>
                    <p className="text-xs text-purple-600">Services (Rs {(vehicleReport.summary.total_service_cost || 0).toLocaleString()})</p>
                  </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-200">
                  <CardContent className="p-4 text-center">
                    <AlertCircle size={24} className="mx-auto text-rose-700 mb-2" />
                    <p className="text-2xl font-bold text-rose-700">{vehicleReport.summary.total_accidents || 0}</p>
                    <p className="text-xs text-rose-600">Accidents</p>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Info Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Owner</p>
                  <p className="font-semibold">{vehicleReport.vehicle.owner_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Site</p>
                  <p className="font-semibold">{vehicleReport.vehicle.site_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">DOR</p>
                  <p className="font-semibold">{vehicleReport.vehicle.date_of_registration ? new Date(vehicleReport.vehicle.date_of_registration).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tax Upto</p>
                  <p className="font-semibold">{vehicleReport.vehicle.tax_upto || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Chassis No.</p>
                  <p className="font-mono text-sm">{vehicleReport.vehicle.chassis_number || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Engine No.</p>
                  <p className="font-mono text-sm">{vehicleReport.vehicle.engine_number || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Avg Mileage</p>
                  <p className="font-semibold">{vehicleReport.vehicle.average_kmpl} km/l</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tank Capacity</p>
                  <p className="font-semibold">{vehicleReport.vehicle.tank_capacity_liters} L</p>
                </div>
              </div>

              {vehicleReport.vehicle.remark && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700 uppercase tracking-wide mb-1">Remark</p>
                  <p className="text-sm text-amber-900">{vehicleReport.vehicle.remark}</p>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">FASTag Company</p>
                <p className="font-semibold">{vehicleReport.vehicle.fastag_company || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">FASTag Balance</p>
                <p className="font-semibold">
                  {vehicleReport.vehicle.fastag_balance ? `₹${vehicleReport.vehicle.fastag_balance}` : 'N/A'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">FASTag Status</p>
                <p className="font-semibold">
                  {vehicleReport.vehicle.fastag_sold ? 'Sold' : 'Active'}
                </p>
              </div>


              {/* Tabs for Related Data */}
              <Tabs defaultValue="documents" className="mt-6">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="documents">Documents ({vehicleReport.documents.length})</TabsTrigger>
                  <TabsTrigger value="challans">Challans ({vehicleReport.challans.length})</TabsTrigger>
                  <TabsTrigger value="services">Services ({vehicleReport.services.length})</TabsTrigger>
                  <TabsTrigger value="accidents">Accidents ({vehicleReport.accidents.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="mt-4">
                  {vehicleReport.documents.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No documents found</p>
                  ) : (
                    <div className="space-y-2">
                      {vehicleReport.documents.map((doc) => (
                        <Card key={doc.id} className="border-slate-200">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-blue-600" />
                              <div>
                                <p className="font-semibold">{doc.document_type}</p>
                                <p className="text-sm text-slate-500">{doc.policy_number} - {doc.provider}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={doc.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                                {doc.status}
                              </Badge>
                              <p className="text-xs text-slate-500 mt-1">
                                Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="challans" className="mt-4">
                  {vehicleReport.challans.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No challans found</p>
                  ) : (
                    <div className="space-y-2">
                      {vehicleReport.challans.map((challan) => (
                        <Card key={challan.id} className="border-slate-200">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <AlertTriangle size={20} className="text-amber-600" />
                              <div>
                                <p className="font-semibold">{challan.challan_number}</p>
                                <p className="text-sm text-slate-500">{challan.violation_type} - {challan.location}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">Rs {(challan.amount || 0).toLocaleString()}</p>
                              <Badge className={challan.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                                {challan.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="services" className="mt-4">
                  {vehicleReport.services.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No service records found</p>
                  ) : (
                    <div className="space-y-2">
                      {vehicleReport.services.map((service) => (
                        <Card key={service.id} className="border-slate-200">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Wrench size={20} className="text-purple-600" />
                              <div>
                                <p className="font-semibold">{service.service_type}</p>
                                <p className="text-sm text-slate-500">{service.description}</p>
                                <p className="text-xs text-slate-400">{new Date(service.date).toLocaleDateString()} - {service.odometer_reading} km</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">Rs {(service.total_cost || 0).toLocaleString()}</p>
                              <p className="text-xs text-slate-500">{service.vendor || 'N/A'}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="accidents" className="mt-4">
                  {vehicleReport.accidents.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No accidents found</p>
                  ) : (
                    <div className="space-y-2">
                      {vehicleReport.accidents.map((accident) => (
                        <Card key={accident.id} className="border-slate-200">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <AlertCircle size={20} className="text-rose-600" />
                              <div>
                                <p className="font-semibold">{new Date(accident.date).toLocaleDateString()}</p>
                                <p className="text-sm text-slate-500">{accident.location}</p>
                                <p className="text-xs text-slate-400">{accident.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">Rs {(accident.damage_estimate || 0).toLocaleString()}</p>
                              <Badge className="bg-amber-100 text-amber-700">{accident.claim_status}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vehicle Cards Grid */}
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
                  {vehicle.file_status ? (
                    <CheckCircle size={18} className="text-emerald-600" />
                  ) : (
                    <XCircle size={18} className="text-rose-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{vehicle.type}</Badge>
                  <Badge variant="outline">{vehicle.fuel_type}</Badge>
                  {vehicle.year && <Badge variant="outline">{vehicle.year}</Badge>}
                </div>

                {vehicle.owner_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User size={14} />
                    <span>{vehicle.owner_name}</span>
                  </div>
                )}

                {vehicle.site_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} />
                    <span>{vehicle.site_name}</span>
                  </div>
                )}

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
