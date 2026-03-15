import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import {
  Truck, Plus, Edit, Trash2, Fuel, Gauge, Eye, Download, Upload,
  FileText, AlertTriangle, Wrench, AlertCircle, Calendar, User, MapPin,
  CheckCircle, XCircle, X, EyeOff, RefreshCw, Info, Download as DownloadIcon,
  Search, Grid3x3, List, MoreVertical, Shield, Zap, Settings,
  Clock, AlertOctagon, CheckCircle2
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  tax_issue_date: '',
  tax_expiry_date: '',
  remark: '',
  fastag_company: '',
  fastag_balance: '',
  fastag_user_id: '',
  fastag_password: '',
  fastag_sold: false,
  fastag_sold_date: '',
  insurance_expiry: '',
  insurance_company: '',
  insurance_policy_number: '',
  puc_expiry: '',
  pucc_number: '',
  fit_up_to: '',
  registered_at: ''
};

// ==================== STATUS BADGE COMPONENT ====================

const StatusBadge = ({ daysLeft, type = 'document' }) => {
  const getStatusConfig = () => {
    if (daysLeft === null || daysLeft === undefined) {
      return { color: 'bg-slate-100 text-slate-700', label: 'N/A', icon: Info };
    }
    if (daysLeft <= 0) {
      return { color: 'bg-rose-100 text-rose-700', label: 'Expired', icon: AlertOctagon };
    }
    if (daysLeft <= 7) {
      return { color: 'bg-orange-100 text-orange-700', label: 'Critical', icon: AlertTriangle };
    }
    if (daysLeft <= 15) {
      return { color: 'bg-amber-100 text-amber-700', label: 'Warning', icon: AlertCircle };
    }
    if (daysLeft <= 30) {
      return { color: 'bg-yellow-100 text-yellow-700', label: 'Soon', icon: Clock };
    }
    return { color: 'bg-emerald-100 text-emerald-700', label: 'Valid', icon: CheckCircle2 };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1 px-2 py-0.5`}>
      <Icon size={12} />
      <span>{config.label}{daysLeft > 0 ? ` (${daysLeft}d)` : ''}</span>
    </Badge>
  );
};

// ==================== FASTAG PASSWORD INPUT ====================

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

// ==================== SURPASS VEHICLE FETCHER COMPONENT ====================

const SurepassVehicleFetcher = ({ onVehicleFetched, onClose }) => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [existingVehicle, setExistingVehicle] = useState(null);
  const [documentStatus, setDocumentStatus] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('input'); // input, preview, exists, saving

  const handleFetch = async () => {
    if (!registrationNumber.trim()) {
      toast.error('Please enter registration number');
      return;
    }

    setFetching(true);
    setError(null);

    try {
      const response = await api.post('/surepass/fetch-vehicle', {
        registration_number: registrationNumber.toUpperCase()
      });

      if (response.data.exists) {
        setExistingVehicle(response.data.vehicle);
        setDocumentStatus(response.data.document_status);

        if (!response.data.needs_update) {
          // Vehicle exists and documents are valid
          toast.info('Vehicle already exists with valid documents');
          setStep('exists');
        } else {
          // Vehicle exists but needs update
          setFetchedData(response.data.vehicle_data);
          setStep('preview');
        }
      } else {
        // New vehicle
        setFetchedData(response.data.vehicle_data);
        setStep('preview');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch vehicle details');
      toast.error(err.response?.data?.detail || 'Failed to fetch vehicle details');
    } finally {
      setFetching(false);
    }
  };

  // Update the SurepassVehicleFetcher component's handleSave function

  const handleSave = async (additionalData = {}) => {
    setLoading(true);
    try {
      // Extract document-specific data from fetchedData
      const vehicleToSave = {
        registration_number: fetchedData.registration_number,
        owner_name: fetchedData.owner_name,
        brand: fetchedData.brand,
        model: fetchedData.model,
        year: fetchedData.year,
        fuel_type: fetchedData.fuel_type,
        type: fetchedData.type || 'Car',
        color: fetchedData.color,
        chassis_number: fetchedData.chassis_number,
        engine_number: fetchedData.engine_number,
        seating_capacity: fetchedData.seating_capacity,
        date_of_registration: fetchedData.date_of_registration,

        // Map insurance data
        insurance_expiry: fetchedData.insurance_expiry,
        insurance_company: fetchedData.insurance_company,
        insurance_policy_number: fetchedData.insurance_policy_number,

        // Map PUC data
        puc_expiry: fetchedData.puc_expiry,
        pucc_number: fetchedData.pucc_number,

        // Map registration/fitness data
        fit_up_to: fetchedData.fit_up_to,
        tax_upto: fetchedData.tax_upto,
        registered_at: fetchedData.registered_at,

        // Add any additional manual fields
        ...additionalData,

        // Always set source to surepass
        source: 'surepass'
      };

      // Remove undefined values
      Object.keys(vehicleToSave).forEach(key =>
        vehicleToSave[key] === undefined && delete vehicleToSave[key]
      );

      console.log('Saving vehicle with data:', vehicleToSave);

      const response = await api.post('/vehicles/from-surepass', vehicleToSave);

      toast.success(existingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully');
      onVehicleFetched();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.detail || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getDaysLeftColor = (days) => {
    if (days === null || days === undefined) return 'bg-slate-50';
    if (days <= 0) return 'bg-rose-50 border-rose-200';
    if (days <= 7) return 'bg-orange-50 border-orange-200';
    if (days <= 15) return 'bg-amber-50 border-amber-200';
    if (days <= 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  if (step === 'exists' && existingVehicle) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Info size={20} />
            <h3 className="font-semibold">Vehicle Already Exists</h3>
          </div>
          <p className="text-sm text-blue-600 mb-3">
            {existingVehicle.registration_number} is already in your fleet with valid documents.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-xs text-slate-500">Insurance</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium">
                  {documentStatus?.insurance?.days_left ?
                    `${documentStatus.insurance.days_left} days left` :
                    existingVehicle.insurance_expiry ?
                      new Date(existingVehicle.insurance_expiry).toLocaleDateString() :
                      'N/A'}
                </span>
                <StatusBadge daysLeft={documentStatus?.insurance?.days_left} />
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-xs text-slate-500">PUC</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium">
                  {documentStatus?.puc?.days_left ?
                    `${documentStatus.puc.days_left} days left` :
                    existingVehicle.puc_expiry ?
                      new Date(existingVehicle.puc_expiry).toLocaleDateString() :
                      'N/A'}
                </span>
                <StatusBadge daysLeft={documentStatus?.puc?.days_left} />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={() => {
                setStep('input');
                setRegistrationNumber('');
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Try Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'preview' && fetchedData) {
    const insuranceDays = getDaysLeft(fetchedData.insurance_expiry);
    const pucDays = getDaysLeft(fetchedData.puc_expiry);

    return (
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle size={20} />
            <h3 className="font-semibold">Vehicle Details Fetched Successfully</h3>
          </div>
          <p className="text-sm text-emerald-600">
            Please review the auto-filled data below
          </p>
        </div>

        {/* Basic Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">Registration Number</p>
            <p className="font-mono font-semibold text-lg">{fetchedData.registration_number}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">Owner Name</p>
            <p className="font-semibold">{fetchedData.owner_name || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg col-span-2">
            <p className="text-xs text-slate-500">Vehicle</p>
            <p className="font-semibold">{fetchedData.brand} {fetchedData.model} {fetchedData.year ? `(${fetchedData.year})` : ''}</p>
          </div>
        </div>

        {/* Document Status Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className={`border-l-4 border-l-blue-500 ${getDaysLeftColor(insuranceDays)}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" />
                  <span className="text-sm font-medium">Insurance</span>
                </div>
                <StatusBadge daysLeft={insuranceDays} />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {fetchedData.insurance_company || 'Company N/A'}
              </p>
              <p className="text-xs font-mono">{fetchedData.insurance_policy_number || 'Policy N/A'}</p>
              {fetchedData.insurance_expiry && (
                <p className="text-xs text-slate-500 mt-1">
                  Expires: {new Date(fetchedData.insurance_expiry).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={`border-l-4 border-l-emerald-500 ${getDaysLeftColor(pucDays)}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" />
                  <span className="text-sm font-medium">PUC</span>
                </div>
                <StatusBadge daysLeft={pucDays} />
              </div>
              <p className="text-xs font-mono mt-2">{fetchedData.pucc_number || 'Number N/A'}</p>
              {fetchedData.puc_expiry && (
                <p className="text-xs text-slate-500 mt-1">
                  Expires: {new Date(fetchedData.puc_expiry).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Details */}
        <div className="border rounded-lg p-3">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Additional Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-slate-500">Fuel Type</p>
              <p>{fetchedData.fuel_type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Seating Capacity</p>
              <p>{fetchedData.seating_capacity || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Chassis Number</p>
              <p className="font-mono text-xs">{fetchedData.chassis_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Engine Number</p>
              <p className="font-mono text-xs">{fetchedData.engine_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Color</p>
              <p>{fetchedData.color || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Registered At</p>
              <p>{fetchedData.registered_at || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Optional Fields */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">Additional Information (Optional)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Site/Location</Label>
              <Input
                placeholder="e.g., Mumbai HQ"
                value={fetchedData.site_name || ''}
                onChange={(e) => setFetchedData({ ...fetchedData, site_name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Remark</Label>
              <Input
                placeholder="Any notes"
                value={fetchedData.remark || ''}
                onChange={(e) => setFetchedData({ ...fetchedData, remark: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={fetchedData.file_status || false}
              onCheckedChange={(checked) => setFetchedData({ ...fetchedData, file_status: checked })}
            />
            <Label className="text-xs text-slate-500">Mark as File Complete</Label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 sticky bottom-0 bg-white border-t">
          <Button
            variant="outline"
            onClick={() => setStep('input')}
            className="flex-1"
            disabled={loading}
          >
            Back
          </Button>
          <Button
            onClick={() => handleSave(fetchedData)}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800"
            disabled={loading}
          >
            {loading ? 'Saving...' : (existingVehicle ? 'Update Vehicle' : 'Save Vehicle')}
          </Button>
        </div>
      </div>
    );
  }

  // Input step
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-lg">
        <p className="text-sm text-slate-600 mb-3">
          Enter vehicle registration number to auto-fetch details from Surepass API
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="e.g., DL08AB1234"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              className="font-mono"
              disabled={fetching}
            />
          </div>
          <Button
            onClick={handleFetch}
            disabled={fetching || !registrationNumber.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {fetching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Fetching...
              </>
            ) : (
              'Fetch Details'
            )}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-rose-600 mt-2">{error}</p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">OR</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onClose}
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
};

// ==================== VEHICLE FORM COMPONENT ====================

const VehicleForm = ({ formData, setFormData, onSubmit, submitText, taxType, setTaxType }) => {

  useEffect(() => {
    if (taxType === "lifetime") {
      setFormData({ ...formData, tax_upto: "LIFETIME", tax_issue_date: '', tax_expiry_date: '' });
    } else if (taxType === "onetime") {
      setFormData({ ...formData, tax_upto: "ONE TIME", tax_issue_date: '', tax_expiry_date: '' });
    } else if (taxType === "exempted") {
      setFormData({ ...formData, tax_upto: "EXEMPTED", tax_issue_date: '', tax_expiry_date: '' });
    }
  }, [taxType]);

  useEffect(() => {
    if (taxType === "date" && formData.tax_issue_date && formData.tax_expiry_date) {
      setFormData({
        ...formData,
        tax_upto: `${formData.tax_issue_date} - ${formData.tax_expiry_date}`
      });
    }
  }, [formData.tax_issue_date, formData.tax_expiry_date]);

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
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
            onChange={(e) =>
              setFormData({ ...formData, date_of_registration: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Seating Capacity</Label>
          <Input
            type="number"
            value={formData.seating_capacity}
            onChange={(e) =>
              setFormData({ ...formData, seating_capacity: e.target.value })
            }
            placeholder="5"
            min="1"
          />
        </div>

        <div>
          <Label>Tax Type</Label>
          <Select
            value={taxType}
            onValueChange={(value) => setTaxType(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Range</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
              <SelectItem value="onetime">One Time</SelectItem>
              <SelectItem value="exempted">Exempted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {taxType === "date" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tax Issue Date</Label>
            <Input
              type="date"
              value={formData.tax_issue_date || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tax_issue_date: e.target.value
                })
              }
            />
          </div>

          <div>
            <Label>Tax Expiry Date</Label>
            <Input
              type="date"
              value={formData.tax_expiry_date || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tax_expiry_date: e.target.value
                })
              }
            />
          </div>
        </div>
      )}

      {(taxType === "lifetime" || taxType === "onetime" || taxType === "exempted") && (
        <div>
          <Label>Tax Status</Label>
          <Input
            value={
              taxType === "lifetime" ? "LIFETIME TAX" :
                taxType === "onetime" ? "ONE TIME TAX" :
                  "TAX EXEMPTED"
            }
            disabled
            className="bg-slate-50"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Average (km/l)</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.average_kmpl}
            onChange={(e) => setFormData({ ...formData, average_kmpl: e.target.value })}
            placeholder="15"
          />
        </div>

        <div>
          <Label>Tank Capacity (L)</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.tank_capacity_liters}
            onChange={(e) => setFormData({ ...formData, tank_capacity_liters: e.target.value })}
            placeholder="50"
          />
        </div>
      </div>

      {/* FASTag Section */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Zap size={16} className="text-emerald-600" />
          FASTag Information
        </h3>

        <div className="grid grid-cols-2 gap-4">
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

        {formData.fastag_sold && (
          <div className="mt-3">
            <Label>Sold Date</Label>
            <Input
              type="date"
              value={formData.fastag_sold_date || ''}
              onChange={(e) =>
                setFormData({ ...formData, fastag_sold_date: e.target.value })
              }
            />
          </div>
        )}
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
};

// ==================== VEHICLE CARD COMPONENT ====================

const VehicleCard = ({ vehicle, onView, onEdit, onDelete }) => {
  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const insuranceDays = getDaysLeft(vehicle.insurance_expiry);
  const pucDays = getDaysLeft(vehicle.puc_expiry);

  const getStatusColor = (days) => {
    if (days === null) return 'bg-slate-400';
    if (days <= 0) return 'bg-rose-500';
    if (days <= 7) return 'bg-orange-500';
    if (days <= 15) return 'bg-amber-500';
    if (days <= 30) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 w-1 h-full ${vehicle.file_status ? 'bg-emerald-500' : 'bg-amber-500'
          }`} />

        <CardHeader className="pb-2">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(vehicle)}>
                  <Eye size={14} className="mr-2" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                  <Edit size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(vehicle)} className="text-rose-600">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

          {/* Document Status Indicators */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Shield size={12} /> Insurance
              </span>
              {vehicle.insurance_expiry ? (
                <Badge className={`${getStatusColor(insuranceDays)} text-white`}>
                  {insuranceDays > 0 ? `${insuranceDays}d` : 'Expired'}
                </Badge>
              ) : (
                <span className="text-slate-400">Not added</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <FileText size={12} /> PUC
              </span>
              {vehicle.puc_expiry ? (
                <Badge className={`${getStatusColor(pucDays)} text-white`}>
                  {pucDays > 0 ? `${pucDays}d` : 'Expired'}
                </Badge>
              ) : (
                <span className="text-slate-400">Not added</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Gauge size={16} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Avg</p>
                <p className="text-sm font-semibold">{vehicle.average_kmpl || 'N/A'} km/l</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Fuel size={16} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Tank</p>
                <p className="text-sm font-semibold">{vehicle.tank_capacity_liters || 'N/A'}L</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onView(vehicle)}
            >
              <Eye size={14} className="mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(vehicle)}
            >
              <Edit size={14} className="mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ==================== VEHICLE DETAIL SHEET COMPONENT ====================

const VehicleDetailSheet = ({ vehicle, open, onOpenChange, vehicleReport, fastagPasses, onAddPass, onEditPass, onDeletePass, onRefresh, onFetchChallans }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [fetchingChallans, setFetchingChallans] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (vehicle && open) {
      setIsLoading(true);
      // Small timeout to ensure UI updates
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [vehicle, open]);  

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (days) => {
    if (days === null) return 'text-slate-600 bg-slate-50';
    if (days <= 0) return 'text-rose-600 bg-rose-50';
    if (days <= 7) return 'text-orange-600 bg-orange-50';
    if (days <= 15) return 'text-amber-600 bg-amber-50';
    if (days <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  const getStatusBadge = (daysLeft) => {
    if (daysLeft <= 0) return <Badge className="bg-rose-100 text-rose-700">Expired</Badge>;
    if (daysLeft <= 7) return <Badge className="bg-orange-100 text-orange-700">Critical ({daysLeft}d)</Badge>;
    if (daysLeft <= 15) return <Badge className="bg-amber-100 text-amber-700">Warning ({daysLeft}d)</Badge>;
    if (daysLeft <= 30) return <Badge className="bg-yellow-100 text-yellow-700">Soon ({daysLeft}d)</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700">Valid ({daysLeft}d)</Badge>;
  };

  const handleFetchChallans = async () => {
    setFetchingChallans(true);
    try {
      await onFetchChallans();
    } finally {
      setFetchingChallans(false);
    }
  };

  const generatePDF = async () => {
    if (!vehicle || !vehicleReport) return;

    setGeneratingPDF(true);

    try {
      // Dynamically import jsPDF and jspdf-autotable
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [16, 185, 129]; // Emerald-500
      const secondaryColor = [100, 116, 139]; // Slate-500
      const dangerColor = [225, 29, 72]; // Rose-600
      const warningColor = [245, 158, 11]; // Amber-500
      const infoColor = [59, 130, 246]; // Blue-500
      const successColor = [34, 197, 94]; // Green-500

      // Helper function to check if date is expired
      const isExpired = (date) => {
        if (!date) return false;
        return new Date(date) < new Date();
      };

      // Helper function to get days left
      const getDaysLeftText = (date) => {
        if (!date) return 'N/A';
        const days = getDaysLeft(date);
        if (days === null) return 'N/A';
        if (days < 0) return 'Expired';
        return `${days} days left`;
      };

      // Helper function to format currency - FIXED VERSION
      const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return 'Rs. 0';

        // Convert to number if it's a string
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        if (isNaN(numAmount)) return 'Rs. 0';

        // Format without special characters that cause PDF rendering issues
        const formattedNumber = numAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        return `Rs. ${formattedNumber}`;
      };

      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Vehicle Full Report', 14, 20);

      // Vehicle Registration Number
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(vehicle.registration_number, 14, 30);

      // Report generation date
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

      // Line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 38, 196, 38);

      let yPos = 45;

      // ==================== VEHICLE DETAILS SECTION ====================
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Vehicle Details', 14, yPos);
      yPos += 6;

      const vehicleDetails = [
        ['Registration Number', vehicle.registration_number],
        ['Owner Name', vehicle.owner_name || 'N/A'],
        ['Brand/Model', `${vehicle.brand} ${vehicle.model}`],
        ['Year', vehicle.year || 'N/A'],
        ['Type', vehicle.type],
        ['Fuel Type', vehicle.fuel_type],
        ['Color', vehicle.color || 'N/A'],
        ['Chassis Number', vehicle.chassis_number || 'N/A'],
        ['Engine Number', vehicle.engine_number || 'N/A'],
        ['Seating Capacity', vehicle.seating_capacity || 'N/A'],
        ['Average Mileage', vehicle.average_kmpl ? `${vehicle.average_kmpl} km/l` : 'N/A'],
        ['Tank Capacity', vehicle.tank_capacity_liters ? `${vehicle.tank_capacity_liters} L` : 'N/A'],
        ['Site Name', vehicle.site_name || 'N/A'],
        ['Source', vehicle.source || 'Manual'],
        ['File Status', vehicle.file_status ? 'Complete' : 'Incomplete']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: vehicleDetails,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 120 }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // ==================== DOCUMENTS SECTION ====================
      if (vehicleReport?.documents && vehicleReport.documents.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Documents', 14, yPos);
        yPos += 6;

        const documentsData = vehicleReport.documents.map(doc => {
          const daysLeft = getDaysLeft(doc.expiry_date);
          const status = daysLeft === 'Expired' ? 'Expired' :
            (typeof daysLeft === 'number' && daysLeft < 30 ? 'Expiring Soon' : 'Active');

          return [
            doc.document_type === 'Custom' ? (doc.custom_document_name || 'Custom') : doc.document_type,
            doc.provider || 'N/A',
            doc.policy_number || 'N/A',
            doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : 'N/A',
            doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A',
            status,
            doc.premium ? formatCurrency(doc.premium) : 'N/A'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Document Type', 'Provider', 'Policy/Number', 'Issue Date', 'Expiry Date', 'Status', 'Premium']],
          body: documentsData,
          theme: 'striped',
          headStyles: { fillColor: primaryColor },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 35 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 20 }
          },
          margin: { left: 14, right: 14 },
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 5) {
              const cellText = data.cell.text[0];
              if (cellText === 'Expired') {
                doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
              } else if (cellText === 'Expiring Soon') {
                doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
              } else {
                doc.setTextColor(successColor[0], successColor[1], successColor[2]);
              }
            }
          }
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ==================== CHALLANS SECTION ====================
      if (vehicleReport?.challans && vehicleReport.challans.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Challans / Traffic Violations', 14, yPos);
        yPos += 6;

        const challansData = vehicleReport.challans.map(challan => {
          return [
            challan.challan_number || 'N/A',
            new Date(challan.date).toLocaleDateString(),
            challan.violation_type || 'N/A',
            formatCurrency(challan.amount),
            challan.status || 'N/A',
            challan.location || 'N/A',
            challan.payment_date ? new Date(challan.payment_date).toLocaleDateString() : '-'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Challan No.', 'Date', 'Violation Type', 'Amount', 'Status', 'Location', 'Payment Date']],
          body: challansData,
          theme: 'striped',
          headStyles: { fillColor: primaryColor },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 30 },
            6: { cellWidth: 25 }
          },
          margin: { left: 14, right: 14 },
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
              const cellText = data.cell.text[0];
              if (cellText === 'Unpaid') {
                doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
              } else if (cellText === 'Paid') {
                doc.setTextColor(successColor[0], successColor[1], successColor[2]);
              }
            }
          }
        });

        // Add challan summary
        yPos = doc.lastAutoTable.finalY + 10;

        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        const totalChallanAmount = vehicleReport.challans.reduce((sum, c) => sum + (c.amount || 0), 0);
        const paidChallans = vehicleReport.challans.filter(c => c.status === 'Paid').length;
        const unpaidChallans = vehicleReport.challans.filter(c => c.status === 'Unpaid').length;
        const unpaidAmount = vehicleReport.challans
          .filter(c => c.status === 'Unpaid')
          .reduce((sum, c) => sum + (c.amount || 0), 0);

        const challanSummary = [
          ['Total Challans', vehicleReport.challans.length.toString()],
          ['Paid Challans', paidChallans.toString()],
          ['Unpaid Challans', unpaidChallans.toString()],
          ['Total Amount', formatCurrency(totalChallanAmount)],
          ['Unpaid Amount', formatCurrency(unpaidAmount)]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Challan Summary', 'Value']],
          body: challanSummary,
          theme: 'striped',
          headStyles: { fillColor: infoColor },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 120 }
          },
          margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ==================== SERVICE RECORDS SECTION ====================
      if (vehicleReport?.services && vehicleReport.services.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Service Records', 14, yPos);
        yPos += 6;

        const servicesData = vehicleReport.services.map(service => {
          return [
            new Date(service.service_date || service.date).toLocaleDateString(),
            service.service_type || 'N/A',
            service.odometer_reading ? `${service.odometer_reading} km` : 'N/A',
            service.vendor || 'N/A',
            formatCurrency(service.total_cost || service.cost || 0),
            service.next_service_due_date ? new Date(service.next_service_due_date).toLocaleDateString() : 'N/A'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Service Type', 'Odometer', 'Vendor', 'Cost', 'Next Due']],
          body: servicesData,
          theme: 'striped',
          headStyles: { fillColor: primaryColor },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 35 },
            4: { cellWidth: 25 },
            5: { cellWidth: 30 }
          },
          margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ==================== FASTAG PASSES SECTION ====================
      if (fastagPasses && fastagPasses.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('FASTag Passes', 14, yPos);
        yPos += 6;

        const fastagData = fastagPasses.map(pass => {
          return [
            pass.pass_name || 'N/A',
            pass.toll_plaza || 'N/A',
            `${pass.balance_trips || 0}/${pass.trips_allowed || 0}`,
            new Date(pass.issue_date).toLocaleDateString(),
            new Date(pass.expiry_date).toLocaleDateString(),
            pass.status || 'N/A'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Pass Name', 'Toll Plaza', 'Trips', 'Issue Date', 'Expiry Date', 'Status']],
          body: fastagData,
          theme: 'striped',
          headStyles: { fillColor: primaryColor },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 20 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 }
          },
          margin: { left: 14, right: 14 },
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 5) {
              const cellText = data.cell.text[0];
              if (cellText === 'Expired') {
                doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
              } else if (cellText === 'Active') {
                doc.setTextColor(successColor[0], successColor[1], successColor[2]);
              }
            }
          }
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ==================== ACCIDENTS SECTION ====================
      if (vehicleReport?.accidents && vehicleReport.accidents.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Accident Records', 14, yPos);
        yPos += 6;

        const accidentsData = vehicleReport.accidents.map(accident => {
          return [
            new Date(accident.accident_date || accident.date).toLocaleDateString(),
            accident.location || 'N/A',
            accident.description || 'N/A',
            accident.claim_status || 'N/A',
            formatCurrency(accident.damage_estimate || accident.repair_cost || 0)
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Location', 'Description', 'Claim Status', 'Damage Cost']],
          body: accidentsData,
          theme: 'striped',
          headStyles: { fillColor: dangerColor },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 50 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 }
          },
          margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

      // ==================== DOCUMENT EXPIRY DATES SECTION (Quick Reference) ====================
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Document Expiry Dates - Quick Reference', 14, yPos);
      yPos += 6;

      const documentExpiryData = [
        ['Insurance',
          vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : 'N/A',
          vehicle.insurance_company || 'N/A',
          getDaysLeftText(vehicle.insurance_expiry)],
        ['PUC',
          vehicle.puc_expiry ? new Date(vehicle.puc_expiry).toLocaleDateString() : 'N/A',
          'RTO',
          getDaysLeftText(vehicle.puc_expiry)],
        ['Fitness',
          vehicle.fit_up_to ? new Date(vehicle.fit_up_to).toLocaleDateString() : 'N/A',
          'RTO',
          getDaysLeftText(vehicle.fit_up_to)],
        ['Tax',
          vehicle.tax_upto ? new Date(vehicle.tax_upto).toLocaleDateString() : 'N/A',
          'Transport Department',
          getDaysLeftText(vehicle.tax_upto)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Document', 'Expiry Date', 'Provider', 'Status']],
        body: documentExpiryData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 35 },
          2: { cellWidth: 60 },
          3: { cellWidth: 45 }
        },
        margin: { left: 14, right: 14 },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const cellText = data.cell.text[0];
            if (cellText.includes('Expired')) {
              doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
            } else if (cellText.includes('days left') && parseInt(cellText) < 30) {
              doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
            }
          }
        }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // ==================== REGISTRATION DETAILS SECTION ====================
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Registration Details', 14, yPos);
      yPos += 6;

      const registrationDetails = [
        ['Date of Registration', vehicle.date_of_registration ? new Date(vehicle.date_of_registration).toLocaleDateString() : 'N/A'],
        ['Registered At', vehicle.registered_at || 'N/A'],
        ['Insurance Company', vehicle.insurance_company || 'N/A'],
        ['Insurance Policy No.', vehicle.insurance_policy_number || 'N/A'],
        ['PUC Number', vehicle.pucc_number || 'N/A']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: registrationDetails,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 120 }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // ==================== FASTAG DETAILS SECTION ====================
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('FASTag Details', 14, yPos);
      yPos += 6;

      const fastagDetails = [
        ['FASTag Company', vehicle.fastag_company || 'N/A'],
        ['FASTag Balance', vehicle.fastag_balance ? formatCurrency(vehicle.fastag_balance) : 'N/A'],
        ['FASTag User ID', vehicle.fastag_user_id || 'N/A'],
        ['FASTag Status', vehicle.fastag_sold ? 'Sold' : (vehicle.fastag_company ? 'Active' : 'Not Added')],
        ['FASTag Sold Date', vehicle.fastag_sold_date ? new Date(vehicle.fastag_sold_date).toLocaleDateString() : 'N/A']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: fastagDetails,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 120 }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // ==================== SUMMARY STATISTICS SECTION ====================
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary Statistics', 14, yPos);
      yPos += 6;

      const summaryData = [
        ['Total Documents', vehicleReport?.summary?.total_documents?.toString() || '0'],
        ['Active Documents', vehicleReport?.summary?.active_documents?.toString() || '0'],
        ['Expired Documents', vehicleReport?.summary?.expired_documents?.toString() || '0'],
        ['Total Challans', vehicleReport?.summary?.total_challans?.toString() || '0'],
        ['Unpaid Challans', vehicleReport?.summary?.unpaid_challans?.toString() || '0'],
        ['Total Challan Amount', vehicleReport?.summary?.total_challan_amount ? formatCurrency(vehicleReport.summary.total_challan_amount) : 'Rs. 0'],
        ['Total Services', vehicleReport?.summary?.total_services?.toString() || '0'],
        ['Total Service Cost', vehicleReport?.summary?.total_service_cost ? formatCurrency(vehicleReport.summary.total_service_cost) : 'Rs. 0'],
        ['Total Accidents', vehicleReport?.summary?.total_accidents?.toString() || '0']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 120 }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // ==================== REMARK SECTION ====================
      if (vehicle.remark) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Remarks', 14, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);

        // Split long remarks into multiple lines
        const splitRemark = doc.splitTextToSize(vehicle.remark, 170);
        doc.text(splitRemark, 14, yPos);
      }

      // ==================== FOOTER ====================
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`${vehicle.registration_number.replace(/[^a-zA-Z0-9]/g, '_')}_full_report_${new Date().toISOString().split('T')[0]}.pdf`);

      toast.success('PDF report generated successfully');

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (!vehicle) return null;

   // Show loading skeleton while data is loading
  if (!vehicle || isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-4xl p-0 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 rounded-xl animate-pulse">
                <div className="w-8 h-8 bg-slate-200 rounded"></div>
              </div>
              <div>
                <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1,2,3,4].map(i => (
                <Card key={i} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="h-16 bg-slate-100 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-10 w-64 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-32 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl p-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Truck size={32} className="text-emerald-700" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-mono">{vehicle.registration_number}</SheetTitle>
              <p className="text-sm text-slate-600">{vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-100">{vehicle.type}</Badge>
            <Badge variant="outline" className="bg-slate-100">{vehicle.fuel_type}</Badge>
            {vehicle.source === 'surepass' && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">Surepass</Badge>
            )}

            {/* Download PDF Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={generatePDF}
                    disabled={generatingPDF || !vehicleReport}
                  >
                    {generatingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600 mr-1"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download size={14} className="mr-1" />
                        PDF Report
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download full vehicle report as PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Fetch Challans Button - Only show for Surepass vehicles */}
            {vehicle.source === 'surepass' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={handleFetchChallans}
                      disabled={fetchingChallans}
                    >
                      {fetchingChallans ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600 mr-1"></div>
                          Fetching...
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} className="mr-1" />
                          Fetch Challans
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fetch and import challans from Surepass</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={onRefresh}
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh document data from Surepass</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">Insurance</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Shield size={24} className="text-emerald-600" />
                </div>
                {vehicle.insurance_expiry && getStatusBadge(getDaysLeft(vehicle.insurance_expiry))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-700 font-medium">PUC</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {vehicle.puc_expiry ? new Date(vehicle.puc_expiry).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <FileText size={24} className="text-amber-600" />
                </div>
                {vehicle.puc_expiry && getStatusBadge(getDaysLeft(vehicle.puc_expiry))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-700 font-medium">Registration</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {vehicle.fit_up_to ? new Date(vehicle.fit_up_to).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Calendar size={24} className="text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-rose-700 font-medium">Tax</p>
                    <p className="text-2xl font-bold text-rose-800">
                      {vehicle.tax_upto ? new Date(vehicle.tax_upto).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <AlertCircle size={24} className="text-rose-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents ({vehicleReport?.documents?.length || 0})</TabsTrigger>
              <TabsTrigger value="challans">Challans ({vehicleReport?.challans?.length || 0})</TabsTrigger>
              <TabsTrigger value="services">Services ({vehicleReport?.services?.length || 0})</TabsTrigger>
              <TabsTrigger value="fastag">FASTag ({fastagPasses?.length || 0})</TabsTrigger>
              <TabsTrigger value="accidents">Accidents ({vehicleReport?.accidents?.length || 0})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {/* Vehicle Details Card */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Vehicle Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Registration Number</p>
                        <p className="font-mono font-medium">{vehicle.registration_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Owner Name</p>
                        <p>{vehicle.owner_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Brand/Model</p>
                        <p>{vehicle.brand} {vehicle.model}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Year</p>
                        <p>{vehicle.year || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Type</p>
                        <p>{vehicle.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Fuel Type</p>
                        <p>{vehicle.fuel_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Chassis Number</p>
                        <p className="font-mono text-xs">{vehicle.chassis_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Engine Number</p>
                        <p className="font-mono text-xs">{vehicle.engine_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Color</p>
                        <p>{vehicle.color || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Seating Capacity</p>
                        <p>{vehicle.seating_capacity || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">Average Mileage</p>
                      <p className="text-xl font-bold">{vehicle.average_kmpl || 'N/A'} <span className="text-sm font-normal text-slate-500">km/l</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tank Capacity</p>
                      <p className="text-xl font-bold">{vehicle.tank_capacity_liters || 'N/A'} <span className="text-sm font-normal text-slate-500">L</span></p>
                    </div>
                  </CardContent>
                </Card>

                {/* Registration Card */}
                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Registration & Tax</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Date of Registration</p>
                        <p>{vehicle.date_of_registration ? new Date(vehicle.date_of_registration).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tax Validity</p>
                        <p>{vehicle.tax_upto ? new Date(vehicle.tax_upto).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Registered At</p>
                        <p>{vehicle.registered_at || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Source</p>
                        <Badge className={vehicle.source === 'surepass' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}>
                          {vehicle.source || 'Manual'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FASTag Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">FASTag Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Company</span>
                      <span className="text-sm font-medium">{vehicle.fastag_company || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Balance</span>
                      <span className="text-sm font-medium">₹{vehicle.fastag_balance?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Status</span>
                      {vehicle.fastag_sold ? (
                        <Badge className="bg-amber-100 text-amber-700">Sold</Badge>
                      ) : vehicle.fastag_company ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Not added</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Site & Remark */}
                {(vehicle.site_name || vehicle.remark) && (
                  <Card className="col-span-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Location & Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vehicle.site_name && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{vehicle.site_name}</span>
                        </div>
                      )}
                      {vehicle.remark && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-xs text-amber-700 font-medium mb-1">Remark</p>
                          <p className="text-sm text-amber-900">{vehicle.remark}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              {vehicleReport?.documents?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No documents found</h3>
                  <p className="text-sm text-slate-500">This vehicle has no documents yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleReport?.documents?.map((doc) => {
                    const daysLeft = getDaysLeft(doc.expiry_date);
                    const statusColor = getStatusColor(daysLeft);

                    return (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText size={20} className="text-blue-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">
                                    {doc.document_type === 'Custom' ? doc.custom_document_name : doc.document_type}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">v{doc.version}</Badge>
                                  {doc.is_current && (
                                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">Current</Badge>
                                  )}
                                  {doc.source === 'surepass' && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">Surepass</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 mb-1">{doc.policy_number}</p>
                                <p className="text-xs text-slate-500">{doc.provider}</p>
                                {doc.phone_number && (
                                  <p className="text-xs text-slate-500 mt-1">📞 {doc.phone_number}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(daysLeft)}
                              {doc.premium && (
                                <p className="text-sm font-semibold mt-2">₹{doc.premium.toLocaleString()}</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Issue: {new Date(doc.issue_date).toLocaleDateString()}</span>
                              <span>Expiry: {new Date(doc.expiry_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Challans Tab */}
            <TabsContent value="challans" className="space-y-4">
              {vehicleReport?.challans?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <AlertTriangle size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No challans found</h3>
                  <p className="text-sm text-slate-500">This vehicle has no traffic violation records.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleReport?.challans?.map((challan) => (
                    <Card key={challan.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${challan.status === 'Paid' ? 'bg-emerald-100' : 'bg-rose-100'
                              }`}>
                              {challan.status === 'Paid' ? (
                                <CheckCircle size={20} className="text-emerald-600" />
                              ) : (
                                <AlertTriangle size={20} className="text-rose-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold font-mono">{challan.challan_number}</h4>
                                <Badge className={challan.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                                  {challan.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">{challan.violation_type}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(challan.date).toLocaleDateString()} • {challan.location}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-rose-600">₹{challan.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-4">
              {vehicleReport?.services?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Wrench size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No service records</h3>
                  <p className="text-sm text-slate-500">This vehicle has no service history.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleReport?.services?.map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Wrench size={20} className="text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{service.service_type}</h4>
                              <p className="text-sm text-slate-600 mb-1">{service.description || 'Service'}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(service.date).toLocaleDateString()} • {service.odometer_reading} km
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">₹{service.total_cost?.toLocaleString() || '0'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* FASTag Tab */}
            <TabsContent value="fastag" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-700">FASTag Passes</h3>
                <Button size="sm" onClick={onAddPass} className="bg-emerald-700 hover:bg-emerald-800">
                  <Plus size={14} className="mr-1" />
                  Add Pass
                </Button>
              </div>

              {fastagPasses?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Zap size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No FASTag passes</h3>
                  <p className="text-sm text-slate-500">Add passes for toll plaza access.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fastagPasses?.map((pass) => {
                    const daysLeft = getDaysLeft(pass.expiry_date);

                    return (
                      <Card key={pass.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <Zap size={20} className="text-emerald-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{pass.pass_name}</h4>
                                  <Badge className={
                                    pass.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                      pass.status === 'Expired' ? 'bg-rose-100 text-rose-700' :
                                        'bg-amber-100 text-amber-700'
                                  }>
                                    {pass.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">{pass.toll_plaza || 'Toll Pass'}</p>
                                <p className="text-xs text-slate-500">
                                  Trips: {pass.balance_trips}/{pass.trips_allowed}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Expires {new Date(pass.expiry_date).toLocaleDateString()}</p>
                              <div className="flex gap-1 mt-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => onEditPass(pass)}
                                >
                                  <Edit size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-rose-600"
                                  onClick={() => onDeletePass(pass.id)}
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Accidents Tab */}
            <TabsContent value="accidents" className="space-y-4">
              {vehicleReport?.accidents?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <AlertCircle size={48} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No accident records</h3>
                  <p className="text-sm text-slate-500">This vehicle has no accident history.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleReport?.accidents?.map((accident) => (
                    <Card key={accident.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-rose-100 rounded-lg">
                              <AlertCircle size={20} className="text-rose-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{new Date(accident.date).toLocaleDateString()}</h4>
                                <Badge className={
                                  accident.claim_status === 'Settled' ? 'bg-emerald-100 text-emerald-700' :
                                    accident.claim_status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                      'bg-amber-100 text-amber-700'
                                }>
                                  {accident.claim_status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">{accident.location}</p>
                              <p className="text-xs text-slate-500">{accident.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-rose-600">₹{(accident.damage_estimate || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ==================== MAIN VEHICLES PAGE ====================

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [surepassDialogOpen, setSurepassDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleReport, setVehicleReport] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [fastagPasses, setFastagPasses] = useState([]);
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [editPassDialogOpen, setEditPassDialogOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [taxType, setTaxType] = useState("date");
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [checkingDocuments, setCheckingDocuments] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const [deletePassDialogOpen, setDeletePassDialogOpen] = useState(false);
  const [passToDelete, setPassToDelete] = useState(null);

  const [fetchChallansDialogOpen, setFetchChallansDialogOpen] = useState(false);
  const [fetchingChallans, setFetchingChallans] = useState(false);

  const [passForm, setPassForm] = useState({
    pass_name: "",
    trips_allowed: "",
    balance_trips: "",
    issue_date: "",
    expiry_date: "",
    toll_plaza: "",
    status: "Active"
  });

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

const fetchFastagPasses = async (vehicleId) => {
  try {
    const res = await api.get(`/vehicles/${vehicleId}/fastag-passes`);
    setFastagPasses(res.data.data);
    return res.data;
  } catch (err) {
    console.error(err);
    toast.error("Failed to load FASTag passes");
    throw err;
  }
};

const fetchVehicleReport = async (vehicleId) => {
  try {
    const response = await api.get(`/vehicles/${vehicleId}/full-report`);
    setVehicleReport(response.data);
    return response.data;
  } catch (error) {
    console.error("Report error:", error);
    toast.error("Failed to load vehicle report");
    throw error;
  }
};

const handleView = async (vehicle) => {
  setVehicleReport(null);
  setFastagPasses([]);
  
  setSelectedVehicle(vehicle);
  
  setViewDialogOpen(true);
  
  try {
    const [reportResponse, passesResponse] = await Promise.all([
      fetchVehicleReport(vehicle.id),
      fetchFastagPasses(vehicle.id)
    ]);
  } catch (error) {
    console.error("Error fetching vehicle data:", error);
    toast.error("Failed to load vehicle details");
  }
};

  const handleEdit = async (vehicle) => {
    try {
      const response = await api.get(`/vehicles/${vehicle.id}`);
      const freshVehicle = response.data;

      let taxTypeValue = "date";
      let issueDate = "";
      let expiryDate = "";

      if (freshVehicle.tax_upto) {
        if (freshVehicle.tax_upto === "LIFETIME") {
          taxTypeValue = "lifetime";
        } else if (freshVehicle.tax_upto === "ONE TIME") {
          taxTypeValue = "onetime";
        } else if (freshVehicle.tax_upto === "EXEMPTED") {
          taxTypeValue = "exempted";
        } else if (freshVehicle.tax_upto.includes(" - ")) {
          const dates = freshVehicle.tax_upto.split(" - ");
          if (dates.length === 2) {
            issueDate = dates[0];
            expiryDate = dates[1];
          }
        }
      }

      setTaxType(taxTypeValue);

      setFormData({
        registration_number: freshVehicle.registration_number,
        type: freshVehicle.type,
        brand: freshVehicle.brand,
        model: freshVehicle.model,
        year: freshVehicle.year?.toString() || '',
        chassis_number: freshVehicle.chassis_number || '',
        engine_number: freshVehicle.engine_number || '',
        color: freshVehicle.color || '',
        fuel_type: freshVehicle.fuel_type,
        average_kmpl: freshVehicle.average_kmpl?.toString() || '',
        tank_capacity_liters: freshVehicle.tank_capacity_liters?.toString() || '',
        seating_capacity: freshVehicle.seating_capacity?.toString() || '',
        owner_name: freshVehicle.owner_name || '',
        file_status: freshVehicle.file_status || false,
        site_name: freshVehicle.site_name || '',
        date_of_registration: freshVehicle.date_of_registration ? freshVehicle.date_of_registration.split('T')[0] : '',
        tax_upto: freshVehicle.tax_upto || '',
        tax_issue_date: issueDate,
        tax_expiry_date: expiryDate,
        remark: freshVehicle.remark || '',
        fastag_company: freshVehicle.fastag_company || '',
        fastag_balance: freshVehicle.fastag_balance?.toString() || '',
        fastag_user_id: freshVehicle.fastag_user_id || '',
        fastag_password: freshVehicle.fastag_password || '',
        fastag_sold: freshVehicle.fastag_sold || false,
        fastag_sold_date: freshVehicle.fastag_sold_date || '',
        insurance_expiry: freshVehicle.insurance_expiry || '',
        insurance_company: freshVehicle.insurance_company || '',
        insurance_policy_number: freshVehicle.insurance_policy_number || '',
        puc_expiry: freshVehicle.puc_expiry || '',
        pucc_number: freshVehicle.pucc_number || '',
        fit_up_to: freshVehicle.fit_up_to || '',
        registered_at: freshVehicle.registered_at || ''
      });

      setSelectedVehicle(freshVehicle);
      setEditDialogOpen(true);
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to load vehicle data");
    }
  };

  const handleEditPass = (pass) => {
    setSelectedPass(pass);
    setPassForm({
      pass_name: pass.pass_name,
      trips_allowed: pass.trips_allowed,
      balance_trips: pass.balance_trips,
      issue_date: pass.issue_date.split("T")[0],
      expiry_date: pass.expiry_date.split("T")[0],
      toll_plaza: pass.toll_plaza || "",
      status: pass.status
    });
    setEditPassDialogOpen(true);
  };

  const updatePass = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vehicle_id: selectedVehicle.id,
        pass_name: passForm.pass_name,
        trips_allowed: parseInt(passForm.trips_allowed),
        balance_trips: parseInt(passForm.balance_trips),
        issue_date: new Date(passForm.issue_date).toISOString(),
        expiry_date: new Date(passForm.expiry_date).toISOString(),
        toll_plaza: passForm.toll_plaza,
        status: passForm.status
      };
      await api.put(`/fastag-passes/${selectedPass.id}`, payload);
      toast.success("Pass updated");
      setEditPassDialogOpen(false);
      fetchFastagPasses(selectedVehicle.id);
    } catch (err) {
      toast.error("Failed to update pass");
    }
  };

  const deletePass = async (id) => {
    if (!window.confirm("Delete this FASTag pass?")) return;
    try {
      await api.delete(`/fastag-passes/${id}`);
      toast.success("Pass deleted");
      fetchFastagPasses(selectedVehicle.id);
    } catch {
      toast.error("Failed to delete pass");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        average_kmpl: formData.average_kmpl ? parseFloat(formData.average_kmpl) : null,
        tank_capacity_liters: formData.tank_capacity_liters ? parseFloat(formData.tank_capacity_liters) : null,
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
        date_of_registration: formData.date_of_registration ? new Date(formData.date_of_registration).toISOString() : null,
        fastag_balance: formData.fastag_balance ? parseFloat(formData.fastag_balance) : null,
        fastag_sold_date: formData.fastag_sold_date ? new Date(formData.fastag_sold_date).toISOString() : null,
        insurance_expiry: formData.insurance_expiry ? new Date(formData.insurance_expiry).toISOString() : null,
        puc_expiry: formData.puc_expiry ? new Date(formData.puc_expiry).toISOString() : null,
        fit_up_to: formData.fit_up_to ? new Date(formData.fit_up_to).toISOString() : null
      };

      await api.post('/vehicles', payload);
      toast.success('Vehicle added successfully');
      setDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail?.[0]?.msg || 'Failed to add vehicle');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        average_kmpl: formData.average_kmpl ? parseFloat(formData.average_kmpl) : null,
        tank_capacity_liters: formData.tank_capacity_liters ? parseFloat(formData.tank_capacity_liters) : null,
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
        date_of_registration: formData.date_of_registration ? new Date(formData.date_of_registration).toISOString() : null,
        fastag_balance: formData.fastag_balance ? parseFloat(formData.fastag_balance) : null,
        fastag_sold_date: formData.fastag_sold_date ? new Date(formData.fastag_sold_date).toISOString() : null,
        insurance_expiry: formData.insurance_expiry ? new Date(formData.insurance_expiry).toISOString() : null,
        puc_expiry: formData.puc_expiry ? new Date(formData.puc_expiry).toISOString() : null,
        fit_up_to: formData.fit_up_to ? new Date(formData.fit_up_to).toISOString() : null
      };

      await api.put(`/vehicles/${selectedVehicle.id}`, payload);
      toast.success('Vehicle updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(error.response?.data?.detail?.[0]?.msg || 'Failed to update vehicle');
    }
  };

  const handleDeleteClick = (vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      await api.delete(`/vehicles/${vehicleToDelete.id}`);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      console.error("API Error:", error);
      toast.error('Failed to delete vehicle');
    } finally {
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
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
    // Keep your existing PDF generation code
  };

  const handleRefreshFromSurepass = async () => {
    if (!selectedVehicle) return;

    if (!window.confirm('Refresh expired documents from Surepass? This will only update expired insurance/PUC documents.')) return;

    try {
      const response = await api.post(`/vehicles/${selectedVehicle.id}/sync-documents`);

      if (response.data.documents_created.length > 0) {
        toast.success(`Updated ${response.data.documents_created.join(' and ')} document(s)`);

        // Refresh the vehicle report to show updated documents
        setViewDialogOpen(false);
        setTimeout(() => {
          handleView(selectedVehicle);
        }, 500);
      } else {
        toast.info('All documents are valid. No update needed.');
      }

    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to sync documents');
    }
  };

const handleFetchChallansClick = () => {
  if (!selectedVehicle) return;
  setFetchChallansDialogOpen(true);
};

const handleConfirmFetchChallans = async () => {
  if (!selectedVehicle) return;
  
  setFetchingChallans(true);
  setFetchChallansDialogOpen(false);
  
  try {
    const response = await api.post('/surepass/fetch-challans', {
      registration_number: selectedVehicle.registration_number
    });

    if (response.data.challans_imported > 0) {
      toast.success(`✅ Imported ${response.data.challans_imported} new challans`);

      // Show summary of what was imported if 5 or fewer challans
      if (response.data.challans_imported <= 5 && response.data.challans.length > 0) {
        const message = response.data.challans.map(c =>
          `• ${c.challan_number}: ₹${c.amount} (${c.status})`
        ).join('\n');

        toast.info(`Imported challans:\n${message}`, {
          duration: 5000,
          style: { whiteSpace: 'pre-line' }
        });
      }

      // Refresh the vehicle report to show updated challans
      setViewDialogOpen(false);
      setTimeout(() => {
        handleView(selectedVehicle);
      }, 500);
    } else if (response.data.challans_found > 0) {
      toast.info(`📋 Found ${response.data.challans_found} challans, but all already exist in the system`);
    } else {
      toast.info('✅ No challans found for this vehicle');
    }

  } catch (err) {
    console.error('Fetch challans error:', err);
    toast.error(err.response?.data?.detail || 'Failed to fetch challans');
  } finally {
    setFetchingChallans(false);
  }
};

  const handleCheckExpiringDocuments = async () => {
    setCheckingDocuments(true);
    try {
      const response = await api.post('/vehicles/batch-check-documents');
      const needsUpdate = response.data.vehicles_needing_update;

      if (needsUpdate.length > 0) {
        toast.warning(`${needsUpdate.length} vehicles have expiring documents`);
        // You could show a dialog with the list
        console.log('Vehicles needing update:', needsUpdate);
      } else {
        toast.success('All vehicle documents are up to date');
      }
    } catch (err) {
      toast.error('Failed to check documents');
    } finally {
      setCheckingDocuments(false);
    }
  };

  const createPass = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vehicle_id: selectedVehicle.id,
        pass_name: passForm.pass_name,
        trips_allowed: parseInt(passForm.trips_allowed),
        balance_trips: passForm.balance_trips ? parseInt(passForm.balance_trips) : parseInt(passForm.trips_allowed),
        status: passForm.status,
        issue_date: new Date(passForm.issue_date).toISOString(),
        expiry_date: new Date(passForm.expiry_date).toISOString(),
        toll_plaza: passForm.toll_plaza
      };
      await api.post("/fastag-passes", payload);
      toast.success("FASTag pass added");
      setPassDialogOpen(false);
      setPassForm({
        pass_name: "",
        trips_allowed: "",
        balance_trips: "",
        issue_date: "",
        expiry_date: "",
        toll_plaza: "",
        status: "Active"
      });
      fetchFastagPasses(selectedVehicle.id);
    } catch (err) {
      toast.error("Failed to create pass");
    }
  };

  const getPassStatus = (pass) => {
    const now = new Date();
    const expiry = new Date(pass.expiry_date);
    if (expiry < now) return "Expired";
    if (pass.balance_trips <= 0) return "Completed";
    return "Active";
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedVehicle(null);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchQuery === '' ||
      vehicle.registration_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || vehicle.type === filterType;

    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = vehicle.file_status === true;
    } else if (filterStatus === 'inactive') {
      matchesStatus = vehicle.file_status === false;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: vehicles.length,
    compliant: vehicles.filter(v => v.file_status).length,
    nonCompliant: vehicles.filter(v => !v.file_status).length,
    pendingDocs: vehicles.filter(v => !v.insurance_expiry && !v.puc_expiry).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="vehicles-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Fleet Management
          </h1>
          <p className="text-slate-600">Manage your vehicle fleet and tracking</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCheckExpiringDocuments}
            disabled={checkingDocuments}
            className="border-amber-600 text-amber-700 hover:bg-amber-50"
          >
            <AlertCircle size={16} className="mr-2" />
            {checkingDocuments ? 'Checking...' : 'Check Expiring Docs'}
          </Button>

          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download size={16} className="mr-2" />
            Template
          </Button>

          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload size={16} className="mr-2" />
            Import
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon size={16} className="mr-2" />
            Export
          </Button>

          {/* Surepass Fetch Button */}
          <Dialog open={surepassDialogOpen} onOpenChange={setSurepassDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw size={18} className="mr-2" />
                Fetch from Surepass
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Fetch Vehicle Details</DialogTitle>
              </DialogHeader>
              <SurepassVehicleFetcher
                onVehicleFetched={() => {
                  fetchVehicles();
                  setSurepassDialogOpen(false);
                }}
                onClose={() => setSurepassDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Manual Add Button */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                <Plus size={18} className="mr-2" />
                Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Vehicle Manually</DialogTitle>
              </DialogHeader>
              <VehicleForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                submitText="Add Vehicle"
                taxType={taxType}
                setTaxType={setTaxType}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Vehicles</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Truck size={24} className="text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Compliant</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.compliant}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle size={24} className="text-emerald-700" />
              </div>
            </div>
            <Progress value={stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Non-Compliant</p>
                <p className="text-3xl font-bold text-amber-600">{stats.nonCompliant}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertTriangle size={24} className="text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Pending Docs</p>
                <p className="text-3xl font-bold text-rose-600">{stats.pendingDocs}</p>
              </div>
              <div className="p-3 bg-rose-100 rounded-xl">
                <FileText size={24} className="text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="border-slate-200 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by registration, brand, model, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vehicleTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">File Complete</SelectItem>
                <SelectItem value="inactive">File Incomplete</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : ''}`}
              >
                <Grid3x3 size={16} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : ''}`}
              >
                <List size={16} />
              </Button>
            </div>

            {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                className="text-slate-600"
              >
                <X size={14} className="mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Grid/List */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-16">
          <Truck size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No vehicles found</h3>
          <p className="text-slate-600 mb-4">
            {vehicles.length === 0
              ? "Add your first vehicle to start fleet management"
              : "No vehicles match your search criteria"
            }
          </p>
          {vehicles.length === 0 && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setSurepassDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw size={16} className="mr-2" />
                Fetch from Surepass
              </Button>
              <Button onClick={() => setDialogOpen(true)} className="bg-emerald-700 hover:bg-emerald-800">
                <Plus size={16} className="mr-2" />
                Manual Entry
              </Button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner/Site</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>PUC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => {
                  const insuranceDays = vehicle.insurance_expiry ?
                    Math.ceil((new Date(vehicle.insurance_expiry) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  const pucDays = vehicle.puc_expiry ?
                    Math.ceil((new Date(vehicle.puc_expiry) - new Date()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-mono font-medium">{vehicle.registration_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                          <p className="text-xs text-slate-500">{vehicle.year || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{vehicle.owner_name || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{vehicle.site_name || 'No site'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vehicle.insurance_expiry ? (
                          <Badge className={insuranceDays <= 0 ? 'bg-rose-100 text-rose-700' :
                            insuranceDays <= 7 ? 'bg-orange-100 text-orange-700' :
                              insuranceDays <= 30 ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'}>
                            {insuranceDays > 0 ? `${insuranceDays}d` : 'Expired'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {vehicle.puc_expiry ? (
                          <Badge className={pucDays <= 0 ? 'bg-rose-100 text-rose-700' :
                            pucDays <= 7 ? 'bg-orange-100 text-orange-700' :
                              pucDays <= 30 ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'}>
                            {pucDays > 0 ? `${pucDays}d` : 'Expired'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {vehicle.file_status ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Complete</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">Incomplete</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleView(vehicle)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(vehicle)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-600"
                            onClick={() => handleDeleteClick(vehicle)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
            taxType={taxType}
            setTaxType={setTaxType}
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

      {/* View Dialog - Vehicle Detail Sheet */}
      <VehicleDetailSheet
        vehicle={selectedVehicle}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        vehicleReport={vehicleReport}
        fastagPasses={fastagPasses}
        onAddPass={() => setPassDialogOpen(true)}
        onEditPass={handleEditPass}
        onDeletePass={deletePass}
        onRefresh={handleRefreshFromSurepass}
        onFetchChallans={handleFetchChallansClick}
      />

      {/* FASTag Pass Dialog */}
      <Dialog open={passDialogOpen} onOpenChange={setPassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add FASTag Pass</DialogTitle>
          </DialogHeader>
          <form onSubmit={createPass} className="space-y-4">
            <div>
              <Label>Pass Name</Label>
              <Input
                required
                value={passForm.pass_name}
                onChange={(e) => setPassForm({ ...passForm, pass_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Toll Plaza</Label>
              <Input
                value={passForm.toll_plaza}
                onChange={(e) => setPassForm({ ...passForm, toll_plaza: e.target.value })}
              />
            </div>
            <div>
              <Label>Trips Allowed</Label>
              <Input
                type="number"
                required
                value={passForm.trips_allowed}
                onChange={(e) => setPassForm({ ...passForm, trips_allowed: e.target.value })}
              />
            </div>
            <div>
              <Label>Balance Trips</Label>
              <Input
                type="number"
                value={passForm.balance_trips}
                onChange={(e) => setPassForm({ ...passForm, balance_trips: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  required
                  value={passForm.issue_date}
                  onChange={(e) => setPassForm({ ...passForm, issue_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  required
                  value={passForm.expiry_date}
                  onChange={(e) => setPassForm({ ...passForm, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={passForm.status}
                onValueChange={(v) => setPassForm({ ...passForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="After RC Update">After RC Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800">
              Create Pass
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit FASTag Pass Dialog */}
      <Dialog open={editPassDialogOpen} onOpenChange={setEditPassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FASTag Pass</DialogTitle>
          </DialogHeader>
          <form onSubmit={updatePass} className="space-y-4">
            <div>
              <Label>Pass Name</Label>
              <Input
                value={passForm.pass_name}
                onChange={(e) => setPassForm({ ...passForm, pass_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Toll Plaza</Label>
              <Input
                value={passForm.toll_plaza}
                onChange={(e) => setPassForm({ ...passForm, toll_plaza: e.target.value })}
              />
            </div>
            <div>
              <Label>Trips Allowed</Label>
              <Input
                type="number"
                value={passForm.trips_allowed}
                onChange={(e) => setPassForm({ ...passForm, trips_allowed: e.target.value })}
              />
            </div>
            <div>
              <Label>Balance Trips</Label>
              <Input
                type="number"
                value={passForm.balance_trips}
                onChange={(e) => setPassForm({ ...passForm, balance_trips: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={passForm.issue_date}
                  onChange={(e) => setPassForm({ ...passForm, issue_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={passForm.expiry_date}
                  onChange={(e) => setPassForm({ ...passForm, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-700">
              Update Pass
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle size={20} />
              Delete Vehicle
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this vehicle?</p>
              {vehicleToDelete && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-mono font-medium">{vehicleToDelete.registration_number}</p>
                  <p className="text-sm text-slate-600">{vehicleToDelete.brand} {vehicleToDelete.model}</p>
                  {vehicleToDelete.owner_name && (
                    <p className="text-xs text-slate-500 mt-1">Owner: {vehicleToDelete.owner_name}</p>
                  )}
                </div>
              )}
              <p className="text-sm text-rose-600 font-medium mt-2">
                This action cannot be undone. All associated data (documents, challans, services, etc.) will be permanently deleted.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVehicleToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
            >
              Delete Vehicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
         <AlertDialog open={fetchChallansDialogOpen} onOpenChange={setFetchChallansDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle size={20} />
              Fetch Challans from Surepass
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Are you sure you want to fetch challans for this vehicle?</p>
              
              {selectedVehicle && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-mono font-medium">{selectedVehicle.registration_number}</p>
                  <p className="text-sm text-slate-600">{selectedVehicle.brand} {selectedVehicle.model}</p>
                </div>
              )}
              
              <div className="mt-2 text-sm">
                <p className="font-medium text-slate-700">This will:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                  <li>Fetch all challans for this vehicle from Surepass</li>
                  <li>Import any new challans not already in the system</li>
                  <li>Existing challans will be preserved</li>
                </ul>
              </div>
              
              <p className="text-sm text-amber-600 font-medium mt-2">
                This action may take a few moments to complete.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFetchChallansDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFetchChallans}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
              disabled={fetchingChallans}
            >
              {fetchingChallans ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Fetching...
                </>
              ) : (
                'Fetch Challans'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
