// hooks/useSurepassVehicle.js
import { useState } from 'react';
import { toast } from 'sonner';
import api from '../utils/api';

export const useSurepassVehicle = (onSuccess, onClose) => {
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

      const response = await api.post('/vehicles/from-surepass', vehicleToSave);

      toast.success(
        existingVehicle
          ? 'Vehicle updated successfully'
          : 'Vehicle added successfully'
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.detail || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setRegistrationNumber('');
    setFetchedData(null);
    setExistingVehicle(null);
    setDocumentStatus(null);
    setError(null);
    setStep('input');
  };

  return {
    registrationNumber,
    setRegistrationNumber,
    loading,
    fetching,
    fetchedData,
    setFetchedData,
    existingVehicle,
    documentStatus,
    error,
    step,
    handleFetch,
    handleSave,
    reset,
    getDaysLeft,
  };
};