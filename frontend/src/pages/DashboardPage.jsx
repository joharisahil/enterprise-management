import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import {
  Building2,
  Truck,
  Receipt,
  AlertTriangle,
  FileText,
  Zap,
  Sun,
  Fuel as FuelIcon,
  Leaf,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const KPICard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{title}</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={14} className={trend === 'up' ? 'text-emerald-600' : 'text-rose-600'} />
                <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-md bg-${color}-100`}>
            <Icon size={24} className={`text-${color}-700`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [energyTrends, setEnergyTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, trendsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/analytics/energy-trends?months=6')
      ]);
      
      setStats(statsRes.data);
      setEnergyTrends(trendsRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Enterprise Dashboard
        </h1>
        <p className="text-slate-600">Comprehensive overview of your operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Properties"
          value={stats?.properties?.total || 0}
          icon={Building2}
          color="blue"
        />
        <KPICard
          title="Total Vehicles"
          value={stats?.vehicles?.total || 0}
          icon={Truck}
          color="emerald"
        />
        <KPICard
          title="Unpaid Bills"
          value={stats?.bills?.unpaid_count || 0}
          icon={Receipt}
          color="amber"
        />
        <KPICard
          title="Expired Taxes"
          value={stats?.taxes?.expired_count || 0}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Expiring Documents"
          value={stats?.documents?.expiring_count || 0}
          icon={FileText}
          color="orange"
        />
        <KPICard
          title="Unpaid Challans"
          value={`₹${stats?.challans?.unpaid_amount?.toLocaleString() || 0}`}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="Critical Alerts"
          value={stats?.notifications?.critical_count || 0}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Energy Consumption Chart */}
        <Card className="col-span-full md:col-span-8 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap size={20} className="text-blue-700" />
              Energy Consumption Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={energyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="units_consumed" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sustainability Metrics */}
        <Card className="col-span-full md:col-span-4 border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf size={20} className="text-emerald-700" />
              Sustainability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">CO₂ Saved</p>
              <p className="text-3xl font-bold text-emerald-700">
                {stats?.sustainability?.co2_saved_kg?.toLocaleString() || 0} kg
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Renewable Energy</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-emerald-700">
                  {stats?.sustainability?.renewable_percentage?.toFixed(1) || 0}%
                </p>
                <Sun size={24} className="text-amber-500" />
              </div>
            </div>
            <div className="pt-4 border-t border-emerald-200">
              <p className="text-xs text-slate-600">
                Solar: {stats?.energy?.solar_generation_kwh?.toLocaleString() || 0} kWh
              </p>
              <p className="text-xs text-slate-600">
                Grid: {stats?.energy?.total_consumption_kwh?.toLocaleString() || 0} kWh
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Metrics */}
        <Card className="col-span-full md:col-span-6 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FuelIcon size={20} className="text-orange-700" />
              Fleet Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Distance</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.fleet?.total_distance_km?.toLocaleString() || 0} km
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Fuel Cost</p>
                <p className="text-2xl font-bold text-slate-900">
                  ₹{stats?.fleet?.total_fuel_cost?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Cost Per KM</p>
              <p className="text-3xl font-bold text-orange-700">
                ₹{stats?.fleet?.cost_per_km?.toFixed(2) || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card className="col-span-full md:col-span-6 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-700" />
              Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-md">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Expired Taxes</p>
                  <p className="text-xs text-slate-600">Requires immediate action</p>
                </div>
              </div>
              <Badge variant="destructive">{stats?.taxes?.expired_count || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Expiring Documents</p>
                  <p className="text-xs text-slate-600">Renewal due within 30 days</p>
                </div>
              </div>
              <Badge variant="warning" className="bg-amber-100 text-amber-700">
                {stats?.documents?.expiring_count || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-sky-50 border border-sky-200 rounded-md">
              <div className="flex items-center gap-3">
                <Receipt size={20} className="text-sky-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Unpaid Bills</p>
                  <p className="text-xs text-slate-600">Pending utility payments</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                {stats?.bills?.unpaid_count || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
