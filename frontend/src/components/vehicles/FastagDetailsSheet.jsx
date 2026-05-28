import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Wallet,
  User,
  RefreshCw,
  MapPin,
  Clock,
  Route,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

export const FastagDetailsSheet = ({ vehicle, open, onOpenChange }) => {
  const [fastagData, setFastagData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [fetchingTransactions, setFetchingTransactions] = useState(false);

  const fetchFastagBalance = async () => {
    if (!vehicle?.id) return;
    
    setFetchingBalance(true);
    try {
      const response = await api.post(`/vehicles/${vehicle.id}/fastag-balance`);
      console.log('Full API Response:', response.data);
      console.log('Fastag Data:', response.data.fastag_data);
      console.log('Balance:', response.data.fastag_data?.available_balance);
      
      setFastagData(response.data.fastag_data);
      
      if (response.data.fastag_data?.transactions?.length > 0) {
        setTransactions(response.data.fastag_data.transactions);
      }
      
      toast.success('FASTag balance fetched successfully');
    } catch (error) {
      console.error('Error fetching FASTag balance:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch FASTag balance');
    } finally {
      setFetchingBalance(false);
    }
  };

  const fetchFastagTransactions = async () => {
    if (!vehicle?.id) return;
    
    setFetchingTransactions(true);
    try {
      const response = await api.post(`/vehicles/${vehicle.id}/fastag-transactions`);
      setTransactions(response.data.transactions || []);
      toast.success(`Fetched ${response.data.transaction_count} transactions`);
    } catch (error) {
      console.error('Error fetching FASTag transactions:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch transactions');
    } finally {
      setFetchingTransactions(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // CRITICAL FIX: Properly format currency
  const formatCurrency = (amount) => {
    // Handle null/undefined
    if (!amount && amount !== 0) return '₹0.00';
    
    let numAmount;
    
    if (typeof amount === 'string') {
      // Remove commas and any non-numeric characters except decimal and minus
      let cleaned = amount.replace(/,/g, '');
      cleaned = cleaned.replace(/[^0-9.-]/g, '');
      numAmount = parseFloat(cleaned);
    } else if (typeof amount === 'number') {
      numAmount = amount;
    } else {
      return '₹0.00';
    }
    
    if (isNaN(numAmount)) return '₹0.00';
    
    // Format with 2 decimal places
    const formatted = numAmount.toFixed(2);
    
    // Add Indian number formatting (commas)
    const parts = formatted.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Add commas for Indian numbering system
    let lastThree = integerPart.slice(-3);
    let otherNumbers = integerPart.slice(0, -3);
    
    let formattedInteger;
    if (otherNumbers !== '') {
      formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    } else {
      formattedInteger = lastThree;
    }
    
    return `₹${formattedInteger}.${decimalPart}`;
  };

  const getBalanceColor = (balance) => {
    let numBalance = 0;
    
    if (typeof balance === 'string') {
      const cleaned = balance.replace(/,/g, '').replace(/[^0-9.-]/g, '');
      numBalance = parseFloat(cleaned) || 0;
    } else if (typeof balance === 'number') {
      numBalance = balance;
    }
    
    if (numBalance <= 100) return 'text-rose-600';
    if (numBalance <= 500) return 'text-orange-600';
    return 'text-emerald-600';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Zap size={32} className="text-purple-700" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-mono">
                  FASTag Details
                </SheetTitle>
                <p className="text-sm text-slate-600">
                  {vehicle?.registration_number} - {vehicle?.brand} {vehicle?.model}
                </p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-700">Surepass Integration</Badge>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {/* Quick Actions */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={fetchFastagBalance}
              disabled={fetchingBalance}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw size={16} className={`mr-2 ${fetchingBalance ? 'animate-spin' : ''}`} />
              {fetchingBalance ? 'Fetching...' : 'Fetch Balance'}
            </Button>
            <Button
              onClick={fetchFastagTransactions}
              disabled={fetchingTransactions}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw size={16} className={`mr-2 ${fetchingTransactions ? 'animate-spin' : ''}`} />
              {fetchingTransactions ? 'Fetching...' : 'Fetch Transactions'}
            </Button>
          </div>

          {/* Balance Card */}
          {fastagData && (
            <Card className="mb-6 bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet size={20} className="text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Current Balance</h3>
                  </div>
                  <Badge className={fastagData.tag_status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                    {fastagData.tag_status || 'Unknown'}
                  </Badge>
                </div>
                
                <div className="text-center mb-4">
                  <p className={`text-4xl font-bold ${getBalanceColor(fastagData.available_balance)}`}>
                    {formatCurrency(fastagData.available_balance)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Available Balance
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-purple-200">
                  <div>
                    <p className="text-xs text-purple-600">Recharge Limit</p>
                    <p className="font-semibold">{formatCurrency(fastagData.available_recharge_limit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">Tag ID</p>
                    <p className="font-mono text-xs">{fastagData.tag_id?.slice(-12) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">Bank</p>
                    <p className="font-medium">{fastagData.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">Vehicle Class</p>
                    <p className="font-medium">{fastagData.vehicle_class_desc || fastagData.vehicle_class || 'N/A'}</p>
                  </div>
                </div>

                {fastagData.customer_name && (
                  <div className="mt-4 pt-4 border-t border-purple-200 flex items-center gap-2">
                    <User size={14} className="text-purple-500" />
                    <p className="text-sm text-purple-700">Registered Owner: {fastagData.customer_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transactions Section */}
          {(fastagData?.transactions?.length > 0 || transactions.length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Route size={18} className="text-purple-600" />
                <h3 className="font-semibold">Recent Transactions</h3>
              </div>
              
              <div className="space-y-3">
                {(fastagData?.transactions || transactions).map((txn, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin size={14} className="text-slate-400" />
                            <p className="font-medium text-sm">{txn.toll_plaza_name || 'Unknown Plaza'}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatDate(txn.transaction_date_time)}
                            </span>
                            {txn.lane_direction && (
                              <span className="flex items-center gap-1">
                                <ArrowRight size={12} />
                                {txn.lane_direction === 'S' ? 'Southbound' : 
                                 txn.lane_direction === 'N' ? 'Northbound' : 
                                 txn.lane_direction === 'E' ? 'Eastbound' :
                                 txn.lane_direction === 'W' ? 'Westbound' : txn.lane_direction}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {txn.vehicle_type || 'Vehicle'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-rose-600">
                            {formatCurrency(txn.amount ? `-${txn.amount}` : '-0')}
                          </p>
                          <p className="text-xs text-slate-400">Toll Fee</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!fastagData && !transactions.length && !fetchingBalance && !fetchingTransactions && (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <Zap size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Click "Fetch Balance" to get FASTag details</p>
              <p className="text-xs text-slate-400 mt-1">This will fetch balance and recent transactions</p>
            </div>
          )}

          {/* Loading States */}
          {(fetchingBalance || fetchingTransactions) && !fastagData && !transactions.length && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-slate-500">
                {fetchingBalance ? 'Fetching FASTag balance...' : 'Fetching transaction history...'}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};