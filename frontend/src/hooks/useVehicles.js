// hooks/useVehicles.js
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../utils/api';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleReport, setVehicleReport] = useState(null);
  const [fastagPasses, setFastagPasses] = useState([]);

  const fetchVehicles = useCallback(async () => {
    console.log('🔄 [useVehicles] fetchVehicles called');
    try {
      setLoading(true);
      console.log('🔄 [useVehicles] Calling API: GET /vehicles');
      const response = await api.get('/vehicles');
      console.log('✅ [useVehicles] API Response:', response.data);
      
      const vehiclesData = response.data.data || response.data || [];
      setVehicles(vehiclesData);
      console.log('✅ [useVehicles] Vehicles set:', vehiclesData.length);
      
    } catch (error) {
      console.error('❌ [useVehicles] API Error:', error);
      console.error('❌ [useVehicles] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      toast.error('Failed to load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
      console.log('🔄 [useVehicles] Loading set to false');
    }
  }, []);

  useEffect(() => {
    console.log('🚀 [useVehicles] useEffect triggered - fetching vehicles on mount');
    fetchVehicles();
  }, [fetchVehicles]);

  const fetchVehicleReport = useCallback(async (vehicleId) => {
    console.log('📄 [useVehicles] fetchVehicleReport called for vehicle:', vehicleId);
    try {
      const response = await api.get(`/vehicles/${vehicleId}/full-report`);
      console.log('✅ [useVehicles] Report fetched');
      setVehicleReport(response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [useVehicles] Report error:', error);
      toast.error('Failed to load vehicle report');
      throw error;
    }
  }, []);

  const fetchFastagPasses = useCallback(async (vehicleId) => {
    console.log('🏷️ [useVehicles] fetchFastagPasses called for vehicle:', vehicleId);
    try {
      const response = await api.get(`/vehicles/${vehicleId}/fastag-passes`);
      console.log('✅ [useVehicles] FASTag passes fetched:', response.data.data?.length || 0);
      setFastagPasses(response.data.data || []);
      return response.data;
    } catch (error) {
      console.error('❌ [useVehicles] FASTag passes error:', error);
      toast.error('Failed to load FASTag passes');
      throw error;
    }
  }, []);

const updateSoldStatus = useCallback(async (vehicleId, currentStatus) => {
  console.log('🔄 [useVehicles] updateSoldStatus called:', { vehicleId, currentStatus });
  try {
    const response = await api.patch(`/vehicles/${vehicleId}/sold-status`, {
      sold: !currentStatus,
    });
    
    toast.success(`Vehicle ${!currentStatus ? 'marked as sold' : 'marked as active'}`);
    
    // Update the vehicles state
    setVehicles(prevVehicles =>
      prevVehicles.map(vehicle =>
        vehicle.id === vehicleId 
          ? { ...vehicle, sold: !currentStatus }
          : vehicle
      )
    );
    
    // If this was the selected vehicle, update it too
    if (selectedVehicle?.id === vehicleId) {
      setSelectedVehicle(prev => ({ ...prev, sold: !currentStatus }));
    }
    
    console.log('✅ [useVehicles] Sold status updated');
    return response.data;
  } catch (error) {
    console.error('❌ [useVehicles] Error updating sold status:', error);
    toast.error(error.response?.data?.detail || 'Failed to update sold status');
    throw error;
  }
}, [selectedVehicle]);

  const deleteVehicle = useCallback(async (vehicleId) => {
    console.log('🗑️ [useVehicles] deleteVehicle called for:', vehicleId);
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      toast.success('Vehicle deleted successfully');
      await fetchVehicles();
      console.log('✅ [useVehicles] Vehicle deleted and list refreshed');
    } catch (error) {
      console.error('❌ [useVehicles] Delete error:', error);
      toast.error('Failed to delete vehicle');
      throw error;
    }
  }, [fetchVehicles]);

  const getStats = useCallback(() => {
    const stats = {
      total: vehicles.length,
      compliant: vehicles.filter(v => v.file_status).length,
      nonCompliant: vehicles.filter(v => !v.file_status).length,
      pendingDocs: vehicles.filter(v => !v.insurance_expiry && !v.puc_expiry).length,
    };
    console.log('📊 [useVehicles] getStats returning:', stats);
    return stats;
  }, [vehicles]);

  return {
    vehicles,
    loading,
    selectedVehicle,
    setSelectedVehicle,
    vehicleReport,
    setVehicleReport,
    fastagPasses,
    setFastagPasses,
    fetchVehicles,
    fetchVehicleReport,
    fetchFastagPasses,
    updateSoldStatus,
    deleteVehicle,
    getStats,
  };
};