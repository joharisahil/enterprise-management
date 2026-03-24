// components/vehicles/VehicleStats.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Truck, CheckCircle, AlertTriangle, FileText } from "lucide-react";

export const VehicleStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Total Vehicles
              </p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Truck size={24} className="text-emerald-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Compliant
              </p>
              <p className="text-3xl font-bold text-emerald-600">
                {stats.compliant}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle size={24} className="text-emerald-700" />
            </div>
          </div>
          <Progress
            value={stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0}
            className="mt-3 h-1.5"
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Non-Compliant
              </p>
              <p className="text-3xl font-bold text-amber-600">
                {stats.nonCompliant}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle size={24} className="text-amber-700" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Pending Docs
              </p>
              <p className="text-3xl font-bold text-rose-600">
                {stats.pendingDocs}
              </p>
            </div>
            <div className="p-3 bg-rose-100 rounded-xl">
              <FileText size={24} className="text-rose-700" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
