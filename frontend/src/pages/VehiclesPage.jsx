// pages/VehiclesPage.jsx (Main Page)
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../utils/api';
import { useVehicles } from '../hooks/useVehicles';
import { useVehicleForm, VEHICLE_TYPES } from '../hooks/useVehicleForm';
import { useFastagPasses } from '../hooks/useFastagPasses';
import { VehicleCard } from '../components/vehicles/VehicleCard';
import { VehicleFilters } from '../components/vehicles/VehicleFilters';
import { VehicleStats } from '../components/vehicles/VehicleStats';
import { VehicleListTable } from '../components/vehicles/VehicleListTable';
import { VehicleEmptyState } from '../components/vehicles/VehicleEmptyState';
import { VehicleActionButtons } from '../components/vehicles/VehicleActionButtons';
import { VehicleDetailSheet } from '../components/vehicles/VehicleDetailSheet';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, AlertTriangle } from 'lucide-react';

export const VehiclesPage = () => {
  console.log('🚗 [VehiclesPage] Component mounted/rendered');
  
  // State
  const [viewMode, setViewMode] = useState(() => {
    console.log('📱 [VehiclesPage] Setting initial viewMode to grid');
    return 'grid';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    console.log('🔍 [VehiclesPage] Setting initial searchQuery to empty');
    return '';
  });
  const [filterType, setFilterType] = useState(() => {
    console.log('🏷️ [VehiclesPage] Setting initial filterType to all');
    return 'all';
  });
  const [filterStatus, setFilterStatus] = useState(() => {
    console.log('📊 [VehiclesPage] Setting initial filterStatus to all');
    return 'all';
  });
  const [checkingDocuments, setCheckingDocuments] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [updatingSoldStatus, setUpdatingSoldStatus] = useState({});
  const [showSurepassDialog, setShowSurepassDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [fetchChallansDialogOpen, setFetchChallansDialogOpen] = useState(false);
  const [fetchingChallans, setFetchingChallans] = useState(false);
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [editPassDialogOpen, setEditPassDialogOpen] = useState(false);

  console.log('📊 [VehiclesPage] Current state:', {
    viewMode,
    searchQuery,
    filterType,
    filterStatus,
    checkingDocuments,
    importDialogOpen,
    deleteDialogOpen,
    showSurepassDialog,
    showManualDialog,
    editDialogOpen,
    viewDialogOpen,
    passDialogOpen
  });

  // Hooks
  console.log('🪝 [VehiclesPage] Initializing useVehicles hook');
  const {
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
  } = useVehicles();

  console.log('🪝 [VehiclesPage] useVehicles returned:', {
    vehiclesCount: vehicles?.length,
    loading,
    selectedVehicleId: selectedVehicle?.id,
    hasVehicleReport: !!vehicleReport,
    fastagPassesCount: fastagPasses?.length
  });

  console.log('🪝 [VehiclesPage] Initializing useVehicleForm hook');
  const {
    formData,
    setFormData,
    taxType,
    setTaxType,
    createVehicle,
    updateVehicle,
    loadVehicleForEdit,
    resetForm,
  } = useVehicleForm(() => {
    console.log('🔄 [VehiclesPage] Vehicle form success callback triggered');
    fetchVehicles();
  });

  console.log('🪝 [VehiclesPage] useVehicleForm returned:', {
    hasFormData: !!formData,
    taxType,
    vehicleCreated: !!createVehicle,
    vehicleUpdated: !!updateVehicle
  });

  console.log('🪝 [VehiclesPage] Initializing useFastagPasses hook');
  const {
    passes: fastagPassesList,
    passForm,
    setPassForm,
    selectedPass,
    createPass,
    updatePass,
    deletePass,
    loadPassForEdit,
    resetPassForm,
  } = useFastagPasses(selectedVehicle?.id, () => {
    console.log('🔄 [VehiclesPage] Fastag passes refresh callback triggered for vehicle:', selectedVehicle?.id);
    if (selectedVehicle) {
      fetchFastagPasses(selectedVehicle.id);
    }
  });

  console.log('🪝 [VehiclesPage] useFastagPasses returned:', {
    passesCount: fastagPassesList?.length,
    hasPassForm: !!passForm,
    hasSelectedPass: !!selectedPass
  });

  // Derived state
  console.log('📈 [VehiclesPage] Calculating stats');
  const stats = getStats();
  console.log('📈 [VehiclesPage] Stats:', stats);
  
  console.log('🔍 [VehiclesPage] Filtering vehicles with:', { searchQuery, filterType, filterStatus });
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      searchQuery === '' ||
      vehicle.registration_number?.toLowerCase().includes(searchQuery) ||
      vehicle.brand?.toLowerCase().includes(searchQuery) ||
      vehicle.model?.toLowerCase().includes(searchQuery) ||
      vehicle.owner_name?.toLowerCase().includes(searchQuery);

    const matchesType = filterType === 'all' || vehicle.type === filterType;
    
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = vehicle.file_status === true;
    } else if (filterStatus === 'inactive') {
      matchesStatus = vehicle.file_status === false;
    }

    return matchesSearch && matchesType && matchesStatus;
  });
  console.log('🔍 [VehiclesPage] Filtered vehicles count:', filteredVehicles.length);

  // Handlers with console logs
  const handleCheckExpiringDocuments = async () => {
    console.log('📄 [VehiclesPage] handleCheckExpiringDocuments called');
    setCheckingDocuments(true);
    try {
      console.log('📄 [VehiclesPage] Calling API: POST /vehicles/batch-check-documents');
      const response = await api.post('/vehicles/batch-check-documents');
      const needsUpdate = response.data.vehicles_needing_update;
      console.log('📄 [VehiclesPage] API response:', { needsUpdateCount: needsUpdate.length });

      if (needsUpdate.length > 0) {
        console.log(`⚠️ [VehiclesPage] ${needsUpdate.length} vehicles have expiring documents`);
        toast.warning(`${needsUpdate.length} vehicles have expiring documents`);
      } else {
        console.log('✅ [VehiclesPage] All vehicle documents are up to date');
        toast.success('All vehicle documents are up to date');
      }
    } catch (err) {
      console.error('❌ [VehiclesPage] Error checking documents:', err);
      toast.error('Failed to check documents');
    } finally {
      setCheckingDocuments(false);
      console.log('📄 [VehiclesPage] Document check completed');
    }
  };

  const handleDownloadTemplate = async () => {
    console.log('📥 [VehiclesPage] handleDownloadTemplate called');
    try {
      console.log('📥 [VehiclesPage] Calling API: GET /vehicles/template/csv');
      const response = await api.get('/vehicles/template/csv');
      const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      console.log('✅ [VehiclesPage] Template downloaded successfully:', response.data.filename);
      toast.success('Template downloaded');
    } catch (error) {
      console.error('❌ [VehiclesPage] Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleExport = async () => {
    console.log('📤 [VehiclesPage] handleExport called');
    try {
      console.log('📤 [VehiclesPage] Calling API: GET /vehicles/export/csv');
      const response = await api.get('/vehicles/export/csv');
      const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      console.log('✅ [VehiclesPage] Vehicles exported successfully:', response.data.filename);
      toast.success('Vehicles exported successfully');
    } catch (error) {
      console.error('❌ [VehiclesPage] Error exporting vehicles:', error);
      toast.error('Failed to export vehicles');
    }
  };

  const handleImport = async () => {
    console.log('📥 [VehiclesPage] handleImport called');
    if (!importData.trim()) {
      console.warn('⚠️ [VehiclesPage] Import data is empty');
      toast.error('Please paste CSV data');
      return;
    }

    setImporting(true);
    try {
      console.log('📥 [VehiclesPage] Calling API: POST /vehicles/import/csv');
      console.log('📥 [VehiclesPage] Import data length:', importData.length);
      const response = await api.post('/vehicles/import/csv', {
        csv_data: importData,
      });
      console.log('✅ [VehiclesPage] Import response:', {
        imported: response.data.imported,
        errors: response.data.errors.length
      });
      toast.success(`Imported ${response.data.imported} vehicles`);
      if (response.data.errors.length > 0) {
        console.warn('⚠️ [VehiclesPage] Import had errors:', response.data.errors);
        toast.warning(`${response.data.errors.length} rows had errors`);
      }
      setImportDialogOpen(false);
      setImportData('');
      fetchVehicles();
    } catch (error) {
      console.error('❌ [VehiclesPage] Error importing vehicles:', error);
      toast.error(error.response?.data?.detail || 'Failed to import vehicles');
    } finally {
      setImporting(false);
      console.log('📥 [VehiclesPage] Import completed');
    }
  };

  const handleView = async (vehicle) => {
    console.log('👁️ [VehiclesPage] handleView called for vehicle:', {
      id: vehicle.id,
      registration: vehicle.registration_number
    });
    setVehicleReport(null);
    setFastagPasses([]);
    setSelectedVehicle(vehicle);
    setViewDialogOpen(true);
    console.log('👁️ [VehiclesPage] View dialog opened for vehicle:', vehicle.id);

    try {
      console.log('👁️ [VehiclesPage] Fetching vehicle report and FASTag passes...');
      await Promise.all([
        fetchVehicleReport(vehicle.id),
        fetchFastagPasses(vehicle.id),
      ]);
      console.log('✅ [VehiclesPage] Successfully fetched vehicle data');
    } catch (error) {
      console.error('❌ [VehiclesPage] Error fetching vehicle data:', error);
      toast.error('Failed to load vehicle details');
    }
  };

  const handleEdit = async (vehicle) => {
    console.log('✏️ [VehiclesPage] handleEdit called for vehicle:', {
      id: vehicle.id,
      registration: vehicle.registration_number
    });
    try {
      console.log('✏️ [VehiclesPage] Loading vehicle for edit...');
      const freshVehicle = await loadVehicleForEdit(vehicle);
      setSelectedVehicle(freshVehicle);
      setEditDialogOpen(true);
      console.log('✅ [VehiclesPage] Edit dialog opened for vehicle:', freshVehicle.id);
    } catch (error) {
      console.error('❌ [VehiclesPage] Error loading vehicle for edit:', error);
    }
  };

  const handleDeleteClick = (vehicle) => {
    console.log('🗑️ [VehiclesPage] handleDeleteClick called for vehicle:', {
      id: vehicle.id,
      registration: vehicle.registration_number
    });
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
    console.log('🗑️ [VehiclesPage] Delete dialog opened');
  };

  const handleConfirmDelete = async () => {
    console.log('✅ [VehiclesPage] handleConfirmDelete called');
    if (!vehicleToDelete) {
      console.warn('⚠️ [VehiclesPage] No vehicle to delete');
      return;
    }
    console.log('🗑️ [VehiclesPage] Deleting vehicle:', vehicleToDelete.id);
    await deleteVehicle(vehicleToDelete.id);
    setDeleteDialogOpen(false);
    setVehicleToDelete(null);
    console.log('✅ [VehiclesPage] Vehicle deleted successfully');
  };

  const handleSoldStatusToggle = async (vehicleId, currentStatus) => {
    console.log('🔄 [VehiclesPage] handleSoldStatusToggle called:', {
      vehicleId,
      currentStatus,
      newStatus: !currentStatus
    });
    setUpdatingSoldStatus((prev) => ({ ...prev, [vehicleId]: true }));
    await updateSoldStatus(vehicleId, currentStatus);
    setUpdatingSoldStatus((prev) => ({ ...prev, [vehicleId]: false }));
    console.log('✅ [VehiclesPage] Vehicle status toggled');
  };

  const handleRefreshFromSurepass = async () => {
    console.log('🔄 [VehiclesPage] handleRefreshFromSurepass called');
    if (!selectedVehicle) {
      console.warn('⚠️ [VehiclesPage] No selected vehicle to refresh');
      return;
    }

    if (!window.confirm(
      'Refresh expired documents from Surepass? This will only update expired insurance/PUC documents.'
    )) {
      console.log('❌ [VehiclesPage] User cancelled refresh');
      return;
    }

    try {
      console.log('🔄 [VehiclesPage] Calling API: POST /vehicles/${selectedVehicle.id}/sync-documents');
      const response = await api.post(`/vehicles/${selectedVehicle.id}/sync-documents`);

      if (response.data.documents_created.length > 0) {
        console.log('✅ [VehiclesPage] Documents updated:', response.data.documents_created);
        toast.success(`Updated ${response.data.documents_created.join(' and ')} document(s)`);
        setViewDialogOpen(false);
        setTimeout(() => {
          handleView(selectedVehicle);
        }, 500);
      } else {
        console.log('ℹ️ [VehiclesPage] No documents needed update');
        toast.info('All documents are valid. No update needed.');
      }
    } catch (err) {
      console.error('❌ [VehiclesPage] Error syncing documents:', err);
      toast.error(err.response?.data?.detail || 'Failed to sync documents');
    }
  };

  const handleFetchChallansClick = () => {
    console.log('🚨 [VehiclesPage] handleFetchChallansClick called');
    if (!selectedVehicle) {
      console.warn('⚠️ [VehiclesPage] No selected vehicle to fetch challans');
      return;
    }
    setFetchChallansDialogOpen(true);
    console.log('🚨 [VehiclesPage] Fetch challans dialog opened');
  };

  const handleConfirmFetchChallans = async () => {
    console.log('✅ [VehiclesPage] handleConfirmFetchChallans called');
    if (!selectedVehicle) return;

    setFetchingChallans(true);

    try {
      console.log('🚨 [VehiclesPage] Calling API: POST /surepass/fetch-challans for vehicle:', selectedVehicle.registration_number);
      const response = await api.post('/surepass/fetch-challans', {
        registration_number: selectedVehicle.registration_number,
      });

      console.log('🚨 [VehiclesPage] Fetch challans response:', {
        challans_imported: response.data.challans_imported,
        challans_found: response.data.challans_found
      });

      if (response.data.challans_imported > 0) {
        toast.success(`✅ Imported ${response.data.challans_imported} new challans`);

        if (response.data.challans_imported <= 5 && response.data.challans.length > 0) {
          const message = response.data.challans
            .map((c) => `• ${c.challan_number}: ₹${c.amount} (${c.status})`)
            .join('\n');
          toast.info(`Imported challans:\n${message}`, {
            duration: 5000,
            style: { whiteSpace: 'pre-line' },
          });
        }

        setViewDialogOpen(false);
        setTimeout(() => {
          handleView(selectedVehicle);
        }, 500);
      } else if (response.data.challans_found > 0) {
        toast.info(`📋 Found ${response.data.challans_found} challans, but all already exist`);
      } else {
        toast.info('✅ No challans found for this vehicle');
      }

      setFetchChallansDialogOpen(false);
    } catch (err) {
      console.error('❌ [VehiclesPage] Error fetching challans:', err);
      toast.error(err.response?.data?.detail || 'Failed to fetch challans');
    } finally {
      setFetchingChallans(false);
      console.log('🚨 [VehiclesPage] Fetch challans completed');
    }
  };

  const handleClearFilters = () => {
    console.log('🧹 [VehiclesPage] handleClearFilters called');
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
    console.log('🧹 [VehiclesPage] Filters cleared');
  };

  // Loading state
  if (loading) {
    console.log('⏳ [VehiclesPage] Loading state active, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  console.log('✅ [VehiclesPage] Rendering main component with', {
    vehiclesCount: vehicles.length,
    filteredCount: filteredVehicles.length,
    viewMode,
    showManualDialog,
    showSurepassDialog,
    editDialogOpen,
    viewDialogOpen
  });


  // Add this new handler in your VehiclesPage component
const handleExportExcel = async () => {
  console.log('📊 [VehiclesPage] handleExportExcel called');
  try {
    console.log('📊 [VehiclesPage] Calling API: GET /vehicles/export/excel');
    const response = await api.get('/vehicles/export/excel', {
      responseType: 'blob'
    });
    
    // Create blob and download
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ [VehiclesPage] Vehicles exported successfully to Excel');
    toast.success('Vehicles exported successfully');
  } catch (error) {
    console.error('❌ [VehiclesPage] Error exporting vehicles:', error);
    toast.error('Failed to export vehicles');
  }
};

  return (
    <div className="p-8" data-testid="vehicles-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-4xl font-bold text-slate-900 tracking-tight mb-2"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Fleet Management
          </h1>
          <p className="text-slate-600">
            Manage your vehicle fleet and tracking
          </p>
        </div>

        <VehicleActionButtons
          onCheckExpiringDocs={handleCheckExpiringDocuments}
          checkingDocuments={checkingDocuments}
          onDownloadTemplate={handleDownloadTemplate}
          onImport={() => {
            console.log('📥 [VehiclesPage] Import button clicked');
            setImportDialogOpen(true);
          }}
          onExport={handleExport}
          onSurepassFetch={() => {
            console.log('🔄 [VehiclesPage] Surepass fetch callback');
            setShowSurepassDialog(false);
            fetchVehicles();
          }}
          onManualAdd={() => {
            console.log('➕ [VehiclesPage] Manual add button clicked');
            setShowManualDialog(true);
          }}
          showSurepassDialog={showSurepassDialog}
          setShowSurepassDialog={setShowSurepassDialog}
          showManualDialog={showManualDialog}
          setShowManualDialog={setShowManualDialog}
          formData={formData}
          setFormData={setFormData}
          taxType={taxType}
          setTaxType={setTaxType}
          onSubmit={createVehicle}
          submitText="Add Vehicle"
        />
      </div>

      {/* Stats Cards */}
      <VehicleStats stats={stats} />

      {/* Search and Filter Bar */}
      <VehicleFilters
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          console.log('🔍 [VehiclesPage] Search query changed:', value);
          setSearchQuery(value);
        }}
        filterType={filterType}
        onFilterTypeChange={(value) => {
          console.log('🏷️ [VehiclesPage] Filter type changed:', value);
          setFilterType(value);
        }}
        filterStatus={filterStatus}
        onFilterStatusChange={(value) => {
          console.log('📊 [VehiclesPage] Filter status changed:', value);
          setFilterStatus(value);
        }}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          console.log('📱 [VehiclesPage] View mode changed:', mode);
          setViewMode(mode);
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Vehicle Grid/List */}
      {filteredVehicles.length === 0 ? (
        <VehicleEmptyState
          onSurepassFetch={() => {
            console.log('🚗 [VehiclesPage] Empty state: Surepass fetch clicked');
            setShowSurepassDialog(true);
          }}
          onManualAdd={() => {
            console.log('🚗 [VehiclesPage] Empty state: Manual add clicked');
            setShowManualDialog(true);
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onSoldToggle={handleSoldStatusToggle}
              updatingStatus={updatingSoldStatus[vehicle.id]}
            />
          ))}
        </div>
      ) : (
        <VehicleListTable
          vehicles={filteredVehicles}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onSoldToggle={handleSoldStatusToggle}
          updatingStatus={updatingSoldStatus}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        console.log('✏️ [VehiclesPage] Edit dialog open state changed:', open);
        setEditDialogOpen(open);
        if (!open) {
          console.log('✏️ [VehiclesPage] Resetting form');
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <VehicleForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={(e) => {
              console.log('✏️ [VehiclesPage] Update vehicle form submitted');
              e.preventDefault();
              updateVehicle(selectedVehicle.id);
            }}
            submitText="Update Vehicle"
            taxType={taxType}
            setTaxType={setTaxType}
          />
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        console.log('📥 [VehiclesPage] Import dialog open state changed:', open);
        setImportDialogOpen(open);
      }}>
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
              onChange={(e) => {
                console.log('📥 [VehiclesPage] Import data changed, length:', e.target.value.length);
                setImportData(e.target.value);
              }}
              placeholder="registration_number,type,brand,model,year,..."
              rows={10}
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
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
        onOpenChange={(open) => {
          console.log('👁️ [VehiclesPage] View dialog open state changed:', open);
          setViewDialogOpen(open);
        }}
        vehicleReport={vehicleReport}
        fastagPasses={fastagPasses}
        onAddPass={() => {
          console.log('➕ [VehiclesPage] Add FASTag pass clicked');
          setPassDialogOpen(true);
        }}
        onEditPass={(pass) => {
          console.log('✏️ [VehiclesPage] Edit FASTag pass clicked for:', pass.id);
          loadPassForEdit(pass);
          setEditPassDialogOpen(true);
        }}
        onDeletePass={(passId) => {
          console.log('🗑️ [VehiclesPage] Delete FASTag pass clicked for:', passId);
          deletePass(passId);
        }}
        onRefresh={handleRefreshFromSurepass}
        onFetchChallans={handleFetchChallansClick}
        fetchingChallans={fetchingChallans}
      />

      {/* FASTag Pass Dialog */}
      <Dialog open={passDialogOpen} onOpenChange={(open) => {
        console.log('➕ [VehiclesPage] Add FASTag dialog open state changed:', open);
        setPassDialogOpen(open);
      }}>
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
            <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800">
              Create Pass
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit FASTag Pass Dialog */}
      <Dialog open={editPassDialogOpen} onOpenChange={(open) => {
        console.log('✏️ [VehiclesPage] Edit FASTag dialog open state changed:', open);
        setEditPassDialogOpen(open);
      }}>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        console.log('🗑️ [VehiclesPage] Delete dialog open state changed:', open);
        setDeleteDialogOpen(open);
      }}>
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
                  <p className="font-mono font-medium">
                    {vehicleToDelete.registration_number}
                  </p>
                  <p className="text-sm text-slate-600">
                    {vehicleToDelete.brand} {vehicleToDelete.model}
                  </p>
                  {vehicleToDelete.owner_name && (
                    <p className="text-xs text-slate-500 mt-1">
                      Owner: {vehicleToDelete.owner_name}
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-rose-600 font-medium mt-2">
                This action cannot be undone. All associated data will be permanently deleted.
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

      {/* Fetch Challans Dialog */}
      <AlertDialog
        open={fetchChallansDialogOpen}
        onOpenChange={(open) => {
          if (!fetchingChallans) {
            console.log('🚨 [VehiclesPage] Fetch challans dialog open state changed:', open);
            setFetchChallansDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle size={20} />
              Fetch Challans from Surepass
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {fetchingChallans ? (
                <div className="py-8 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                  <p className="text-lg font-medium text-slate-700">
                    Fetching Challans...
                  </p>
                  <p className="text-sm text-slate-500">
                    Please wait while we retrieve challan data from Surepass
                  </p>
                </div>
              ) : (
                <>
                  <p>Are you sure you want to fetch challans for this vehicle?</p>
                  {selectedVehicle && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-mono font-medium">
                        {selectedVehicle.registration_number}
                      </p>
                      <p className="text-sm text-slate-600">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </p>
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
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setFetchChallansDialogOpen(false)}
              disabled={fetchingChallans}
            >
              Cancel
            </AlertDialogCancel>
            {!fetchingChallans && (
              <AlertDialogAction
                onClick={handleConfirmFetchChallans}
                className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
              >
                Fetch Challans
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
