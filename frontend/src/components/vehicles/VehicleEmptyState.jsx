// components/vehicles/VehicleEmptyState.jsx
import React from 'react';
import { Truck, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const VehicleEmptyState = ({ onSurepassFetch, onManualAdd }) => {
  return (
    <div className="text-center py-16">
      <Truck size={64} className="mx-auto text-slate-300 mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        No vehicles found
      </h3>
      <p className="text-slate-600 mb-4">
        Add your first vehicle to start fleet management
      </p>
      <div className="flex gap-2 justify-center">
        <Button
          onClick={onSurepassFetch}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw size={16} className="mr-2" />
          Fetch from Surepass
        </Button>
        <Button
          onClick={onManualAdd}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          <Plus size={16} className="mr-2" />
          Manual Entry
        </Button>
      </div>
    </div>
  );
};