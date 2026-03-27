import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Navigation, Clock, RefreshCw, 
  Gauge, MapPin, Compass, Wifi, WifiOff
} from "lucide-react";

export const VehicleLiveCard = ({ liveData, loading, vehicleNumber, onRefresh, lastRefreshed }) => {
  const [signalStrength, setSignalStrength] = useState(0);
  const isMoving = liveData ? liveData.speed > 0 : false;
  
  // Speed is already in km/h from API (70 means 70 km/h)
  const speedKmh = liveData?.speed || 0;

  useEffect(() => {
    if (lastRefreshed) {
      const freshness = Math.min(100, Math.max(0, 100 - (Date.now() - lastRefreshed.getTime()) / 1000));
      setSignalStrength(Math.floor(freshness));
    }
  }, [lastRefreshed]);

  const getDirection = () => {
    if (!liveData?.heading) return null;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(liveData.heading / 45) % 8;
    return directions[index];
  };

  const direction = getDirection();

  // Speed color based on value
  const getSpeedColor = () => {
    if (speedKmh > 80) return "text-red-600 dark:text-red-400";
    if (speedKmh > 50) return "text-orange-600 dark:text-orange-400";
    if (speedKmh > 20) return "text-green-600 dark:text-green-400";
    if (speedKmh > 0) return "text-blue-600 dark:text-blue-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${isMoving ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <Navigation size={14} className={isMoving ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Vehicle</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                {liveData?.vehicle_no || vehicleNumber || liveData?.imei || "—"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Signal Strength */}
            {signalStrength > 0 && (
              <div className="flex items-center gap-1">
                {signalStrength > 70 ? (
                  <Wifi size={10} className="text-green-500" />
                ) : signalStrength > 30 ? (
                  <Wifi size={10} className="text-yellow-500" />
                ) : (
                  <WifiOff size={10} className="text-red-500" />
                )}
                <span className="text-[9px] text-gray-500">{signalStrength}%</span>
              </div>
            )}

            {/* Status Badge */}
            {liveData && (
              <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                isMoving 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {liveData.status || (isMoving ? 'RUNNING' : 'STOPPED')}
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={12} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        ) : liveData ? (
          <div className="space-y-3">
            {/* Speed and Direction Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Speed Card */}
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <Gauge size={10} className="text-gray-400" />
                  <span className="text-[9px] text-gray-500 uppercase">Speed</span>
                </div>
                <p className={`text-xl font-bold ${getSpeedColor()}`}>
                  {speedKmh}
                  <span className="text-xs font-normal text-gray-500 ml-0.5">km/h</span>
                </p>
              </div>

              {/* Direction Card */}
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <Compass size={10} className="text-gray-400" />
                  <span className="text-[9px] text-gray-500 uppercase">Heading</span>
                </div>
                {direction ? (
                  <>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {direction}
                    </p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {liveData.heading?.toFixed(0)}°
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">—</p>
                )}
              </div>
            </div>

            {/* Location Card */}
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded">
              <div className="flex items-center gap-1 mb-1.5">
                <MapPin size={10} className="text-gray-400" />
                <span className="text-[9px] text-gray-500 uppercase">Location</span>
              </div>
              {liveData.location && (
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 line-clamp-2">
                  {liveData.location}
                </p>
              )}
              <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                {liveData.lat?.toFixed(5)}°, {liveData.lng?.toFixed(5)}°
              </p>
              <p className="text-[9px] text-gray-400 mt-1">
                ±{liveData.accuracy || 5}m accuracy
              </p>
            </div>

            {/* Time Card */}
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded">
              <div className="flex items-center gap-1 mb-1">
                <Clock size={10} className="text-gray-400" />
                <span className="text-[9px] text-gray-500 uppercase">Last Update</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white">
                {liveData.timestamp ? new Date(liveData.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                }) : "—"}
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                {lastRefreshed ? formatRelative(lastRefreshed) : "Not updated"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Navigation size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No live data available</p>
            <p className="text-[10px] text-gray-400 mt-1">Click refresh to fetch data</p>
          </div>
        )}
      </div>
    </div>
  );
};

function formatRelative(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}