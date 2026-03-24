// hooks/useFastagPasses.js
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import api from '../utils/api';

export const useFastagPasses = (vehicleId, onRefresh) => {
  const [passes, setPasses] = useState([]);
  const [passForm, setPassForm] = useState({
    pass_name: '',
    trips_allowed: '',
    balance_trips: '',
    issue_date: '',
    expiry_date: '',
    toll_plaza: '',
    status: 'Active',
  });
  const [selectedPass, setSelectedPass] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPasses = useCallback(async () => {
    if (!vehicleId) return;
    
    try {
      const response = await api.get(`/vehicles/${vehicleId}/fastag-passes`);
      setPasses(response.data.data);
    } catch (error) {
      console.error('Error fetching FASTag passes:', error);
      toast.error('Failed to load FASTag passes');
    }
  }, [vehicleId]);

  const createPass = useCallback(async (e) => {
    e.preventDefault();
    if (!vehicleId) return;
    
    setLoading(true);
    
    try {
      const payload = {
        vehicle_id: vehicleId,
        pass_name: passForm.pass_name,
        trips_allowed: parseInt(passForm.trips_allowed),
        balance_trips: passForm.balance_trips ? parseInt(passForm.balance_trips) : parseInt(passForm.trips_allowed),
        status: passForm.status,
        issue_date: new Date(passForm.issue_date).toISOString(),
        expiry_date: new Date(passForm.expiry_date).toISOString(),
        toll_plaza: passForm.toll_plaza,
      };
      
      await api.post('/fastag-passes', payload);
      toast.success('FASTag pass added');
      
      setPassForm({
        pass_name: '',
        trips_allowed: '',
        balance_trips: '',
        issue_date: '',
        expiry_date: '',
        toll_plaza: '',
        status: 'Active',
      });
      
      await fetchPasses();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error creating FASTag pass:', error);
      toast.error('Failed to create pass');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, passForm, fetchPasses, onRefresh]);

  const updatePass = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedPass) return;
    
    setLoading(true);
    
    try {
      const payload = {
        vehicle_id: vehicleId,
        pass_name: passForm.pass_name,
        trips_allowed: parseInt(passForm.trips_allowed),
        balance_trips: parseInt(passForm.balance_trips),
        issue_date: new Date(passForm.issue_date).toISOString(),
        expiry_date: new Date(passForm.expiry_date).toISOString(),
        toll_plaza: passForm.toll_plaza,
        status: passForm.status,
      };
      
      await api.put(`/fastag-passes/${selectedPass.id}`, payload);
      toast.success('Pass updated');
      
      await fetchPasses();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating FASTag pass:', error);
      toast.error('Failed to update pass');
    } finally {
      setLoading(false);
    }
  }, [selectedPass, vehicleId, passForm, fetchPasses, onRefresh]);

  const deletePass = useCallback(async (passId) => {
    try {
      await api.delete(`/fastag-passes/${passId}`);
      toast.success('Pass deleted');
      await fetchPasses();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting FASTag pass:', error);
      toast.error('Failed to delete pass');
    }
  }, [fetchPasses, onRefresh]);

  const loadPassForEdit = useCallback((pass) => {
    setSelectedPass(pass);
    setPassForm({
      pass_name: pass.pass_name,
      trips_allowed: pass.trips_allowed.toString(),
      balance_trips: pass.balance_trips.toString(),
      issue_date: pass.issue_date.split('T')[0],
      expiry_date: pass.expiry_date.split('T')[0],
      toll_plaza: pass.toll_plaza || '',
      status: pass.status,
    });
  }, []);

  const resetForm = useCallback(() => {
    setPassForm({
      pass_name: '',
      trips_allowed: '',
      balance_trips: '',
      issue_date: '',
      expiry_date: '',
      toll_plaza: '',
      status: 'Active',
    });
    setSelectedPass(null);
  }, []);

  return {
    passes,
    passForm,
    setPassForm,
    selectedPass,
    loading,
    fetchPasses,
    createPass,
    updatePass,
    deletePass,
    loadPassForEdit,
    resetForm,
  };
};