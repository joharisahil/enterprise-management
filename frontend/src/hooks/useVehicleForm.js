// hooks/useVehicleForm.js
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../utils/api';

export const VEHICLE_TYPES = ['Car', 'Truck', 'Van', 'Bike', 'Bus', 'JCB', 'Tractor', 'Crane'];
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];

export const initialFormData = {
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
  registered_at: '',
};

export const useVehicleForm = (onSuccess) => {
  const [formData, setFormData] = useState(initialFormData);
  const [taxType, setTaxType] = useState('date');
  const [loading, setLoading] = useState(false);

  // Handle tax type changes
  useEffect(() => {
    if (taxType === 'lifetime') {
      setFormData(prev => ({
        ...prev,
        tax_upto: 'LIFETIME',
        tax_issue_date: '',
        tax_expiry_date: '',
      }));
    } else if (taxType === 'onetime') {
      setFormData(prev => ({
        ...prev,
        tax_upto: 'ONE TIME',
        tax_issue_date: '',
        tax_expiry_date: '',
      }));
    } else if (taxType === 'exempted') {
      setFormData(prev => ({
        ...prev,
        tax_upto: 'EXEMPTED',
        tax_issue_date: '',
        tax_expiry_date: '',
      }));
    }
  }, [taxType]);

  useEffect(() => {
    if (taxType === 'date' && formData.tax_issue_date && formData.tax_expiry_date) {
      setFormData(prev => ({
        ...prev,
        tax_upto: `${prev.tax_issue_date} - ${prev.tax_expiry_date}`,
      }));
    }
  }, [formData.tax_issue_date, formData.tax_expiry_date, taxType]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setTaxType('date');
  }, []);

  const preparePayload = useCallback((data) => {
    return {
      ...data,
      year: data.year ? parseInt(data.year) : null,
      average_kmpl: data.average_kmpl ? parseFloat(data.average_kmpl) : null,
      tank_capacity_liters: data.tank_capacity_liters ? parseFloat(data.tank_capacity_liters) : null,
      seating_capacity: data.seating_capacity ? parseInt(data.seating_capacity) : null,
      date_of_registration: data.date_of_registration ? new Date(data.date_of_registration).toISOString() : null,
      fastag_balance: data.fastag_balance ? parseFloat(data.fastag_balance) : null,
      fastag_sold_date: data.fastag_sold_date ? new Date(data.fastag_sold_date).toISOString() : null,
      insurance_expiry: data.insurance_expiry ? new Date(data.insurance_expiry).toISOString() : null,
      puc_expiry: data.puc_expiry ? new Date(data.puc_expiry).toISOString() : null,
      fit_up_to: data.fit_up_to ? new Date(data.fit_up_to).toISOString() : null,
    };
  }, []);

  const createVehicle = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = preparePayload(formData);
      await api.post('/vehicles', payload);
      toast.success('Vehicle added successfully');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('API Error:', error);
      toast.error(error.response?.data?.detail?.[0]?.msg || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  }, [formData, preparePayload, resetForm, onSuccess]);

  const updateVehicle = useCallback(async (vehicleId) => {
    setLoading(true);
    
    try {
      const payload = preparePayload(formData);
      await api.put(`/vehicles/${vehicleId}`, payload);
      toast.success('Vehicle updated successfully');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('API Error:', error);
      toast.error(error.response?.data?.detail?.[0]?.msg || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  }, [formData, preparePayload, resetForm, onSuccess]);

  const loadVehicleForEdit = useCallback(async (vehicle) => {
    try {
      const response = await api.get(`/vehicles/${vehicle.id}`);
      const freshVehicle = response.data;

      let taxTypeValue = 'date';
      let issueDate = '';
      let expiryDate = '';

      if (freshVehicle.tax_upto) {
        if (freshVehicle.tax_upto === 'LIFETIME') taxTypeValue = 'lifetime';
        else if (freshVehicle.tax_upto === 'ONE TIME') taxTypeValue = 'onetime';
        else if (freshVehicle.tax_upto === 'EXEMPTED') taxTypeValue = 'exempted';
        else if (freshVehicle.tax_upto.includes(' - ')) {
          const dates = freshVehicle.tax_upto.split(' - ');
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
        date_of_registration: freshVehicle.date_of_registration?.split('T')[0] || '',
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
        registered_at: freshVehicle.registered_at || '',
      });

      return freshVehicle;
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Failed to load vehicle data');
      throw error;
    }
  }, []);

  return {
    formData,
    setFormData,
    taxType,
    setTaxType,
    loading,
    createVehicle,
    updateVehicle,
    loadVehicleForEdit,
    resetForm,
  };
};