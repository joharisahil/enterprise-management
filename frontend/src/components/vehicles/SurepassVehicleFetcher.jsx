// components/vehicles/SurepassVehicleFetcher.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '../../utils/api';
import { 
  Info, 
  CheckCircle, 
  Shield, 
  FileText, 
  AlertCircle, 
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';

const StatusBadge = ({ daysLeft }) => {
  const getStatusConfig = () => {
    if (daysLeft === null || daysLeft === undefined) {
      return { color: 'bg-slate-100 text-slate-700', label: 'N/A', icon: Info };
    }
    if (daysLeft <= 0) {
      return { color: 'bg-rose-100 text-rose-700', label: 'Expired', icon: AlertTriangle };
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
      <span>
        {config.label}
        {daysLeft > 0 ? ` (${daysLeft}d)` : ''}
      </span>
    </Badge>
  );
};

export const SurepassVehicleFetcher = ({ onVehicleFetched, onClose }) => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [existingVehicle, setExistingVehicle] = useState(null);
  const [documentStatus, setDocumentStatus] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('input');

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

  const handleFetch = async () => {
    if (!registrationNumber.trim()) {
      toast.error('Please enter registration number');
      return;
    }

    setFetching(true);
    setError(null);

    try {
      const response = await api.post('/surepass/fetch-vehicle', {
        registration_number: registrationNumber.toUpperCase(),
      });

      if (response.data.exists) {
        setExistingVehicle(response.data.vehicle);
        setDocumentStatus(response.data.document_status);

        if (!response.data.needs_update) {
          toast.info('Vehicle already exists with valid documents');
          setStep('exists');
        } else {
          setFetchedData(response.data.vehicle_data);
          setStep('preview');
        }
      } else {
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

  const handleSave = async (additionalData = {}) => {
    setLoading(true);
    try {
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
        insurance_expiry: fetchedData.insurance_expiry,
        insurance_company: fetchedData.insurance_company,
        insurance_policy_number: fetchedData.insurance_policy_number,
        puc_expiry: fetchedData.puc_expiry,
        pucc_number: fetchedData.pucc_number,
        fit_up_to: fetchedData.fit_up_to,
        tax_upto: fetchedData.tax_upto,
        registered_at: fetchedData.registered_at,
        ...additionalData,
        source: 'surepass',
      };

      Object.keys(vehicleToSave).forEach(
        (key) => vehicleToSave[key] === undefined && delete vehicleToSave[key]
      );

      await api.post('/vehicles/from-surepass', vehicleToSave);

      toast.success(
        existingVehicle
          ? 'Vehicle updated successfully'
          : 'Vehicle added successfully'
      );
      onVehicleFetched();
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.detail || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
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
                  {documentStatus?.insurance?.days_left
                    ? `${documentStatus.insurance.days_left} days left`
                    : existingVehicle.insurance_expiry
                      ? new Date(existingVehicle.insurance_expiry).toLocaleDateString()
                      : 'N/A'}
                </span>
                <StatusBadge daysLeft={documentStatus?.insurance?.days_left} />
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-xs text-slate-500">PUC</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium">
                  {documentStatus?.puc?.days_left
                    ? `${documentStatus.puc.days_left} days left`
                    : existingVehicle.puc_expiry
                      ? new Date(existingVehicle.puc_expiry).toLocaleDateString()
                      : 'N/A'}
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

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">Registration Number</p>
            <p className="font-mono font-semibold text-lg">
              {fetchedData.registration_number}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-500">Owner Name</p>
            <p className="font-semibold">{fetchedData.owner_name || 'N/A'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg col-span-2">
            <p className="text-xs text-slate-500">Vehicle</p>
            <p className="font-semibold">
              {fetchedData.brand} {fetchedData.model}{' '}
              {fetchedData.year ? `(${fetchedData.year})` : ''}
            </p>
          </div>
        </div>

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
              <p className="text-xs font-mono">
                {fetchedData.insurance_policy_number || 'Policy N/A'}
              </p>
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
              <p className="text-xs font-mono mt-2">
                {fetchedData.pucc_number || 'Number N/A'}
              </p>
              {fetchedData.puc_expiry && (
                <p className="text-xs text-slate-500 mt-1">
                  Expires: {new Date(fetchedData.puc_expiry).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

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

        <div className="flex gap-2 pt-4 sticky bottom-0 bg-white border-t">
          <Button variant="outline" onClick={() => setStep('input')} className="flex-1" disabled={loading}>
            Back
          </Button>
          <Button
            onClick={() => handleSave(fetchedData)}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800"
            disabled={loading}
          >
            {loading ? 'Saving...' : existingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
          </Button>
        </div>
      </div>
    );
  }

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
        {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">OR</span>
        </div>
      </div>

      <Button variant="outline" onClick={onClose} className="w-full">
        Cancel
      </Button>
    </div>
  );
};