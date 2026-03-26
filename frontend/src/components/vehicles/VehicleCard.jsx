// components/vehicles/VehicleCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SoldAgreementDialog } from './SoldAgreementDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Truck,
  Edit,
  Trash2,
  Fuel,
  Gauge,
  Eye,
  User,
  MapPin,
  XCircle,
  MoreVertical,
  Shield,
  FileText,
  AlertTriangle,
  Calendar,
  Receipt,
} from 'lucide-react';
import { useState } from 'react';

const getDaysLeft = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

const getStatusBadge = (daysLeft) => {
  if (daysLeft === null) return <Badge variant="outline" className="text-xs">Not added</Badge>;
  if (daysLeft <= 0) return <Badge className="bg-rose-500 text-white text-xs">Expired</Badge>;
  if (daysLeft <= 7) return <Badge className="bg-orange-500 text-white text-xs">Critical ({daysLeft}d)</Badge>;
  if (daysLeft <= 15) return <Badge className="bg-amber-500 text-white text-xs">Warning ({daysLeft}d)</Badge>;
  if (daysLeft <= 30) return <Badge className="bg-yellow-500 text-white text-xs">Soon ({daysLeft}d)</Badge>;
  return <Badge className="bg-emerald-500 text-white text-xs">Valid ({daysLeft}d)</Badge>;
};

export const VehicleCard = ({
  vehicle,
  onView,
  onEdit,
  onDelete,
  onSoldToggle,
  updatingStatus,
}) => {
  const insuranceDays = getDaysLeft(vehicle.insurance_expiry);
  const pucDays = getDaysLeft(vehicle.puc_expiry);
  const fitnessDays = getDaysLeft(vehicle.fit_up_to);
  
  // Handle tax specially - it could be "LIFETIME" string or date
  let taxDays = null;
  let isLifetimeTax = false;
  if (vehicle.tax_upto) {
    if (vehicle.tax_upto === 'LIFETIME') {
      isLifetimeTax = true;
    } else {
      taxDays = getDaysLeft(vehicle.tax_upto);
    }
  }

  const [showSoldDialog, setShowSoldDialog] = useState(false);
  const [soldVehicle, setSoldVehicle] = useState(null);
  const [showUnsoldDialog, setShowUnsoldDialog] = useState(false);

  const handleSoldClick = () => {
    setSoldVehicle(vehicle);
    setShowSoldDialog(true);
  };

  const handleSoldSuccess = () => {
    if (onSoldToggle) {
      onSoldToggle(vehicle.id, vehicle.sold);
    }
  };

  const handleMarkAsUnsold = () => {
    setShowUnsoldDialog(true);
  };

  const confirmUnsold = async () => {
    if (onSoldToggle) {
      await onSoldToggle(vehicle.id, vehicle.sold);
    }
    setShowUnsoldDialog(false);
  };

  if (!vehicle) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={`group relative border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 overflow-hidden ${
            vehicle.sold ? 'opacity-75 bg-slate-50' : ''
          }`}
        >
          <div
            className={`absolute top-0 left-0 w-1 h-full ${
              vehicle.file_status ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />

          {vehicle.sold && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-slate-600 text-white px-3 py-1 text-sm font-semibold shadow-lg">
                SOLD
              </Badge>
            </div>
          )}

          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-md">
                  <Truck size={24} className="text-emerald-700" />
                </div>
                <div>
                  <CardTitle className="text-lg font-mono">
                    {vehicle.registration_number}
                  </CardTitle>
                  <p className="text-sm text-slate-600">
                    {vehicle.brand} {vehicle.model}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(vehicle)}>
                    <Eye size={14} className="mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                    <Edit size={14} className="mr-2" /> Edit
                  </DropdownMenuItem>
                  
                  {vehicle.sold && (
                    <DropdownMenuItem 
                      onClick={handleMarkAsUnsold}
                      className="text-amber-600"
                    >
                      <AlertTriangle size={14} className="mr-2" /> Mark as Unsold
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(vehicle)}
                    className="text-rose-600"
                  >
                    <Trash2 size={14} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{vehicle.type}</Badge>
              <Badge variant="outline">{vehicle.fuel_type}</Badge>
              {vehicle.year && <Badge variant="outline">{vehicle.year}</Badge>}
            </div>

            {vehicle.owner_name && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User size={14} />
                <span>{vehicle.owner_name}</span>
              </div>
            )}

            {vehicle.site_name && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={14} />
                <span>{vehicle.site_name}</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {/* Insurance */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Shield size={12} /> Insurance
                </span>
                {getStatusBadge(insuranceDays)}
              </div>
              
              {/* PUC */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <FileText size={12} /> PUC
                </span>
                {getStatusBadge(pucDays)}
              </div>
              
              {/* Registration/Fitness */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar size={12} /> Registration/Fitness
                </span>
                {getStatusBadge(fitnessDays)}
              </div>
              
              {/* Tax */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Receipt size={12} /> Tax
                </span>
                {isLifetimeTax ? (
                  <Badge className="bg-emerald-500 text-white text-xs">Lifetime</Badge>
                ) : (
                  getStatusBadge(taxDays)
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Avg</p>
                  <p className="text-sm font-semibold">
                    {vehicle.average_kmpl ? `${vehicle.average_kmpl} km/l` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Fuel size={16} className="text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Tank</p>
                  <p className="text-sm font-semibold">
                    {vehicle.tank_capacity_liters ? `${vehicle.tank_capacity_liters}L` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onView(vehicle)}
              >
                <Eye size={14} className="mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(vehicle)}
              >
                <Edit size={14} className="mr-1" />
                Edit
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Sale Status</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {!vehicle.sold ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 border-amber-600 text-amber-700 hover:bg-amber-50"
                        onClick={handleSoldClick}
                      >
                        <AlertTriangle size={12} className="mr-1" />
                        Mark as Sold
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          onClick={handleSoldClick}
                        >
                          <FileText size={12} className="mr-1" />
                          Sold Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 border-rose-600 text-rose-700 hover:bg-rose-50"
                          onClick={handleMarkAsUnsold}
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                          ) : (
                            <>
                              <XCircle size={12} className="mr-1" />
                              Mark Active
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {vehicle.sold
                        ? 'View sold details or mark as active'
                        : 'Mark vehicle as sold and add agreement details'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sold Agreement Dialog */}
      <SoldAgreementDialog
        vehicle={soldVehicle}
        open={showSoldDialog}
        onOpenChange={setShowSoldDialog}
        onSuccess={handleSoldSuccess}
      />

      {/* Unsold Confirmation Dialog */}
      <AlertDialog open={showUnsoldDialog} onOpenChange={setShowUnsoldDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={20} />
              Mark Vehicle as Unsold
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Are you sure you want to mark this vehicle as unsold?</p>
              {vehicle && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-mono font-medium">
                    {vehicle.registration_number}
                  </p>
                  <p className="text-sm text-slate-600">
                    {vehicle.brand} {vehicle.model}
                  </p>
                </div>
              )}
              <div className="mt-2 text-sm">
                <p className="font-medium text-slate-700">This will:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                  <li>Remove the "Sold" status from this vehicle</li>
                  <li>Keep all agreement details for reference</li>
                  <li>Make the vehicle available in active fleet</li>
                </ul>
              </div>
              <p className="text-sm text-amber-600 font-medium mt-2">
                You can always mark it as sold again later.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnsold}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
            >
              Yes, Mark as Unsold
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};