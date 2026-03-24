// components/vehicles/VehicleForm.jsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { VEHICLE_TYPES, FUEL_TYPES } from '../../hooks/useVehicleForm';

const FastagPasswordInput = ({ formData, setFormData }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        value={formData.fastag_password}
        onChange={(e) => setFormData({ ...formData, fastag_password: e.target.value })}
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

export const VehicleForm = ({
  formData,
  setFormData,
  onSubmit,
  submitText,
  taxType,
  setTaxType,
}) => {
  useEffect(() => {
    if (taxType === 'lifetime') {
      setFormData({
        ...formData,
        tax_upto: 'LIFETIME',
        tax_issue_date: '',
        tax_expiry_date: '',
      });
    } else if (taxType === 'onetime') {
      setFormData({
        ...formData,
        tax_upto: 'ONE TIME',
        tax_issue_date: '',
        tax_expiry_date: '',
      });
    } else if (taxType === 'exempted') {
      setFormData({
        ...formData,
        tax_upto: 'EXEMPTED',
        tax_issue_date: '',
        tax_expiry_date: '',
      });
    }
  }, [taxType, setFormData]);

  useEffect(() => {
    if (taxType === 'date' && formData.tax_issue_date && formData.tax_expiry_date) {
      setFormData({
        ...formData,
        tax_upto: `${formData.tax_issue_date} - ${formData.tax_expiry_date}`,
      });
    }
  }, [formData.tax_issue_date, formData.tax_expiry_date, taxType, setFormData]);

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
              {VEHICLE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
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
              {FUEL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
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
          <Label>Seating Capacity</Label>
          <Input
            type="number"
            value={formData.seating_capacity}
            onChange={(e) => setFormData({ ...formData, seating_capacity: e.target.value })}
            placeholder="5"
            min="1"
          />
        </div>

        <div>
          <Label>Tax Type</Label>
          <Select value={taxType} onValueChange={setTaxType}>
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

      {taxType === 'date' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tax Issue Date</Label>
            <Input
              type="date"
              value={formData.tax_issue_date || ''}
              onChange={(e) => setFormData({ ...formData, tax_issue_date: e.target.value })}
            />
          </div>

          <div>
            <Label>Tax Expiry Date</Label>
            <Input
              type="date"
              value={formData.tax_expiry_date || ''}
              onChange={(e) => setFormData({ ...formData, tax_expiry_date: e.target.value })}
            />
          </div>
        </div>
      )}

      {(taxType === 'lifetime' || taxType === 'onetime' || taxType === 'exempted') && (
        <div>
          <Label>Tax Status</Label>
          <Input
            value={
              taxType === 'lifetime'
                ? 'LIFETIME TAX'
                : taxType === 'onetime'
                  ? 'ONE TIME TAX'
                  : 'TAX EXEMPTED'
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
              onChange={(e) => setFormData({ ...formData, fastag_company: e.target.value })}
              placeholder="Paytm / ICICI / HDFC"
            />
          </div>

          <div>
            <Label>FASTag Balance</Label>
            <Input
              type="number"
              value={formData.fastag_balance}
              onChange={(e) => setFormData({ ...formData, fastag_balance: e.target.value })}
              placeholder="500"
            />
          </div>

          <div>
            <Label>FASTag User ID</Label>
            <Input
              value={formData.fastag_user_id}
              onChange={(e) => setFormData({ ...formData, fastag_user_id: e.target.value })}
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
            onCheckedChange={(checked) => setFormData({ ...formData, fastag_sold: checked })}
          />
          <Label>FASTag Sold</Label>
        </div>

        {formData.fastag_sold && (
          <div className="mt-3">
            <Label>Sold Date</Label>
            <Input
              type="date"
              value={formData.fastag_sold_date || ''}
              onChange={(e) => setFormData({ ...formData, fastag_sold_date: e.target.value })}
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

      <Button
        type="submit"
        className="w-full bg-emerald-700 hover:bg-emerald-800"
        data-testid="submit-vehicle-button"
      >
        {submitText}
      </Button>
    </form>
  );
};