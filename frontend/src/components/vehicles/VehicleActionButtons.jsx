// components/vehicles/VehicleActionButtons.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Upload, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { SurepassVehicleFetcher } from './SurepassVehicleFetcher';
import { VehicleForm } from './VehicleForm';

export const VehicleActionButtons = ({
  onCheckExpiringDocs,
  checkingDocuments,
  onDownloadTemplate,
  onImport,
  onExport,
  onSurepassFetch,
  onManualAdd,
  showSurepassDialog,
  setShowSurepassDialog,
  showManualDialog,
  setShowManualDialog,
  formData,
  setFormData,
  taxType,
  setTaxType,
  onSubmit,
  submitText,
}) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={onCheckExpiringDocs}
        disabled={checkingDocuments}
        className="border-amber-600 text-amber-700 hover:bg-amber-50"
      >
        <AlertCircle size={16} className="mr-2" />
        {checkingDocuments ? 'Checking...' : 'Check Expiring Docs'}
      </Button>

      <Button variant="outline" onClick={onDownloadTemplate}>
        <Download size={16} className="mr-2" />
        Template
      </Button>

      <Button variant="outline" onClick={onImport}>
        <Upload size={16} className="mr-2" />
        Import
      </Button>

      <Button variant="outline" onClick={onExport}>
        <Download size={16} className="mr-2" />
        Export
      </Button>

      <Dialog open={showSurepassDialog} onOpenChange={setShowSurepassDialog}>
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
            onVehicleFetched={onSurepassFetch}
            onClose={() => setShowSurepassDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
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
            onSubmit={onSubmit}
            submitText={submitText}
            taxType={taxType}
            setTaxType={setTaxType}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};