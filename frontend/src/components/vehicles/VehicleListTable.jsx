// components/vehicles/VehicleListTable.jsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

const getDaysLeft = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

export const VehicleListTable = ({
  vehicles,
  onView,
  onEdit,
  onDelete,
  onSoldToggle,
  updatingStatus,
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registration</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Owner/Site</TableHead>
              <TableHead>Insurance</TableHead>
              <TableHead>PUC</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => {
              const insuranceDays = getDaysLeft(vehicle.insurance_expiry);
              const pucDays = getDaysLeft(vehicle.puc_expiry);

              const getBadgeClass = (days) => {
                if (days === null) return '';
                if (days <= 0) return 'bg-rose-100 text-rose-700';
                if (days <= 7) return 'bg-orange-100 text-orange-700';
                if (days <= 30) return 'bg-amber-100 text-amber-700';
                return 'bg-emerald-100 text-emerald-700';
              };

              return (
                <TableRow
                  key={vehicle.id}
                  className={vehicle.sold ? 'bg-slate-50' : ''}
                >
                  <TableCell className="font-mono font-medium">
                    {vehicle.registration_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-slate-500">
                        {vehicle.year || 'N/A'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {vehicle.owner_name || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {vehicle.site_name || 'No site'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {vehicle.insurance_expiry ? (
                      <Badge className={getBadgeClass(insuranceDays)}>
                        {insuranceDays > 0 ? `${insuranceDays}d` : 'Expired'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {vehicle.puc_expiry ? (
                      <Badge className={getBadgeClass(pucDays)}>
                        {pucDays > 0 ? `${pucDays}d` : 'Expired'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {vehicle.file_status ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          Complete
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          Incomplete
                        </Badge>
                      )}
                      {vehicle.sold && (
                        <Badge className="bg-slate-600 text-white">
                          Sold
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onView(vehicle)}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(vehicle)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-rose-600"
                        onClick={() => onDelete(vehicle)}
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant={vehicle.sold ? 'destructive' : 'outline'}
                        className={`h-8 px-2 ${vehicle.sold ? 'bg-rose-600 hover:bg-rose-700' : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'}`}
                        onClick={() => onSoldToggle(vehicle.id, vehicle.sold)}
                        disabled={updatingStatus[vehicle.id]}
                      >
                        {updatingStatus[vehicle.id] ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        ) : vehicle.sold ? (
                          <XCircle size={12} />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};