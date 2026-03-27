// import React, { useEffect, useState } from 'react';
// import { motion } from 'framer-motion';
// import api from '../utils/api';
// import { toast, Toaster } from 'sonner';
// import { VehicleLiveCard } from '../components/tracking/VehicleLiveCard';
// import { TimelineBar } from '../components/tracking/TimelineBar';
// import { TimelineDetailPanel } from '../components/tracking/TimelineDetailPanel';
// import { HistoryPanel } from '../components/tracking/HistoryPanel';
// import { LoadingSkeleton } from '../components/tracking/LoadingSkeleton';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
// import { Label } from '../components/ui/label';
// import { Card } from '../components/ui/card';
// import { RefreshCw, Radio } from 'lucide-react';

// const VehicleTrackingPage = () => {
//   const [selectedIMEI, setSelectedIMEI] = useState('');
//   const [gpsDevices, setGpsDevices] = useState([]);
//   const [vehicles, setVehicles] = useState([]);
//   const [liveData, setLiveData] = useState(null);
//   const [timeline, setTimeline] = useState([]);
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeNode, setActiveNode] = useState(null);
//   const [lastUpdated, setLastUpdated] = useState('');
//   const [autoRefresh, setAutoRefresh] = useState(true);

//   useEffect(() => {
//     fetchDevices();
//   }, []);

//   useEffect(() => {
//     if (selectedIMEI && autoRefresh) {
//       const liveInterval = setInterval(() => {
//         fetchLiveData();
//       }, 10000);

//       const timelineInterval = setInterval(() => {
//         fetchTimeline();
//       }, 30000);

//       return () => {
//         clearInterval(liveInterval);
//         clearInterval(timelineInterval);
//       };
//     }
//   }, [selectedIMEI, autoRefresh]);

//   useEffect(() => {
//     if (selectedIMEI) {
//       fetchAllData();
//     }
//   }, [selectedIMEI]);

//   const fetchDevices = async () => {
//     try {
//       const [devicesRes, vehiclesRes] = await Promise.all([
//         api.get('/gps-devices'),
//         api.get('/vehicles'),
//       ]);

//       setGpsDevices(devicesRes.data.data || []);
//       setVehicles(vehiclesRes.data.data || []);

//       if (devicesRes.data.data && devicesRes.data.data.length > 0) {
//         setSelectedIMEI(devicesRes.data.data[0].imei);
//       }
//     } catch (error) {
//       toast.error('Failed to load GPS devices');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAllData = async () => {
//     setLoading(true);
//     await Promise.all([
//       fetchLiveData(),
//       fetchTimeline(),
//       fetchHistory(),
//     ]);
//     setLoading(false);
//   };

//   const fetchLiveData = async () => {
//     if (!selectedIMEI) return;

//     try {
//       const response = await api.get(`/vehicle-tracking/live?imei=${selectedIMEI}`);
//       setLiveData(response.data);
//       setLastUpdated(new Date().toLocaleTimeString());
//     } catch (error) {
//       console.error('Failed to fetch live data:', error);
//     }
//   };

//   const fetchTimeline = async () => {
//     if (!selectedIMEI) return;

//     try {
//       const response = await api.get(`/vehicle-tracking/timeline?imei=${selectedIMEI}`);
//       setTimeline(response.data.timeline || []);
//     } catch (error) {
//       console.error('Failed to fetch timeline:', error);
//     }
//   };

//   const fetchHistory = async () => {
//     if (!selectedIMEI) return;

//     try {
//       const response = await api.get(`/vehicle-tracking/history?imei=${selectedIMEI}`);
//       setHistory(response.data.history || []);
//     } catch (error) {
//       console.error('Failed to fetch history:', error);
//     }
//   };

//   const handleNodeClick = (node) => {
//     setActiveNode(node);
//   };

//   const getVehicleNumber = () => {
//     const device = gpsDevices.find(d => d.imei === selectedIMEI);
//     if (!device) return 'Unknown Vehicle';

//     const vehicle = vehicles.find(v => v.id === device.vehicle_id);
//     return vehicle?.registration_number || 'Unknown Vehicle';
//   };

//   const toggleAutoRefresh = () => {
//     setAutoRefresh(!autoRefresh);
//     toast.success(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled');
//   };

//   if (loading && !selectedIMEI) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
//         <LoadingSkeleton />
//       </div>
//     );
//   }

//   if (gpsDevices.length === 0) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
//         <Toaster position="top-right" />
//         <div className="max-w-2xl mx-auto">
//           <Card className="p-12 text-center border-slate-200 shadow-lg">
//             <Radio className="w-20 h-20 mx-auto text-slate-300 mb-4" />
//             <h2 className="text-3xl font-bold text-slate-900 mb-4">No GPS Devices</h2>
//             <p className="text-slate-600 mb-6">
//               You need to add GPS devices before you can track vehicles.
//             </p>
//             <p className="text-sm text-slate-500">
//               Go to the GPS & Telematics page to add your first device.
//             </p>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
//       <Toaster position="top-right" />

//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="max-w-7xl mx-auto space-y-6"
//       >
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
//               Live Vehicle Tracking
//             </h1>
//             <p className="text-slate-600">Real-time journey monitoring and analytics</p>
//           </div>

//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={toggleAutoRefresh}
//             className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
//               autoRefresh
//                 ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
//                 : 'bg-slate-100 text-slate-600 border-2 border-slate-300'
//             }`}
//           >
//             <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
//             <span className="font-semibold">
//               {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
//             </span>
//           </motion.button>
//         </div>

//         <Card className="p-6 border-slate-200 shadow-lg">
//           <div className="max-w-md">
//             <Label className="text-sm font-semibold text-slate-700 mb-2 block">
//               Select Vehicle to Track
//             </Label>
//             <Select value={selectedIMEI} onValueChange={setSelectedIMEI}>
//               <SelectTrigger className="h-12">
//                 <SelectValue placeholder="Select a vehicle" />
//               </SelectTrigger>
//               <SelectContent>
//                 {gpsDevices.map((device) => {
//                   const vehicle = vehicles.find(v => v.id === device.vehicle_id);
//                   return (
//                     <SelectItem key={device.id} value={device.imei}>
//                       {vehicle?.registration_number || 'Unknown'} - {device.imei}
//                     </SelectItem>
//                   );
//                 })}
//               </SelectContent>
//             </Select>
//           </div>
//         </Card>

//         {loading ? (
//           <LoadingSkeleton />
//         ) : (
//           <>
//             <VehicleLiveCard
//               liveData={liveData}
//               vehicleNumber={getVehicleNumber()}
//               lastUpdated={lastUpdated}
//             />

//             <TimelineBar
//               timeline={timeline}
//               onNodeClick={handleNodeClick}
//               activeNode={activeNode}
//             />

//             {activeNode && (
//               <TimelineDetailPanel
//                 node={activeNode}
//                 onClose={() => setActiveNode(null)}
//               />
//             )}

//             <HistoryPanel history={history} />
//           </>
//         )}
//       </motion.div>
//     </div>
//   );
// };

// export default VehicleTrackingPage;
