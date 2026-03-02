import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'sonner';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  info: { icon: Info, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' }
};

export const AlertsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    return n.severity === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="alerts-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Alerts & Notifications
        </h1>
        <p className="text-slate-600">Compliance alerts and system notifications</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" data-testid="filter-all">All</TabsTrigger>
          <TabsTrigger value="unread" data-testid="filter-unread">Unread</TabsTrigger>
          <TabsTrigger value="critical" data-testid="filter-critical">Critical</TabsTrigger>
          <TabsTrigger value="warning" data-testid="filter-warning">Warning</TabsTrigger>
          <TabsTrigger value="info" data-testid="filter-info">Info</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const config = severityConfig[notification.severity] || severityConfig.info;
          const Icon = config.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              data-testid={`notification-${notification.id}`}
            >
              <Card className={`border ${config.border} ${config.bg} ${notification.is_read ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-md ${config.bg}`}>
                      <Icon size={20} className={config.color} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                            <Badge variant={notification.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {notification.severity}
                            </Badge>
                            {!notification.is_read && (
                              <Badge variant="default" className="bg-blue-800">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                            data-testid={`mark-read-${notification.id}`}
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-16">
          <AlertCircle size={64} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No alerts</h3>
          <p className="text-slate-600">You're all caught up!</p>
        </div>
      )}
    </div>
  );
};
