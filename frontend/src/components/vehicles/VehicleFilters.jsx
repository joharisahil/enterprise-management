// components/vehicles/VehicleFilters.jsx
import React from 'react';
import { Search, X, Grid3x3, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VEHICLE_TYPES } from '../../hooks/useVehicleForm';

export const VehicleFilters = ({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  viewMode,
  onViewModeChange,
  onClearFilters,
}) => {
  const hasActiveFilters = searchQuery || filterType !== 'all' || filterStatus !== 'all';

  return (
    <Card className="border-slate-200 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Search by registration, brand, model, owner..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value.toLowerCase())}
              className="pl-10"
            />
          </div>

          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {VEHICLE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
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
              onClick={() => onViewModeChange('grid')}
              className={`h-8 w-8 p-0 ${
                viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : ''
              }`}
            >
              <Grid3x3 size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={`h-8 w-8 p-0 ${
                viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : ''
              }`}
            >
              <List size={16} />
            </Button>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-slate-600"
            >
              <X size={14} className="mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};