import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Clock, MapPin, Timer, Gauge, 
  Navigation, Calendar, TrendingUp, TrendingDown,
  Battery, Activity, Copy, CheckCircle2
} from "lucide-react";

const TYPE_STYLES = {
  START: { 
    bg: "bg-gradient-to-br from-tracking-start/20 via-tracking-start/10 to-transparent", 
    text: "text-tracking-start", 
    border: "border-tracking-start/30",
    label: "Journey Started",
    icon: "🚀",
    accent: "from-tracking-start to-tracking-start/50"
  },
  MOVING: { 
    bg: "bg-gradient-to-br from-tracking-moving/20 via-tracking-moving/10 to-transparent", 
    text: "text-tracking-moving", 
    border: "border-tracking-moving/30",
    label: "Vehicle in Motion",
    icon: "⚡",
    accent: "from-tracking-moving to-tracking-moving/50"
  },
  STOP: { 
    bg: "bg-gradient-to-br from-tracking-stop/20 via-tracking-stop/10 to-transparent", 
    text: "text-tracking-stop", 
    border: "border-tracking-stop/30",
    label: "Vehicle Stopped",
    icon: "⏸️",
    accent: "from-tracking-stop to-tracking-stop/50"
  },
  END: { 
    bg: "bg-gradient-to-br from-tracking-end/20 via-tracking-end/10 to-transparent", 
    text: "text-tracking-end", 
    border: "border-tracking-end/30",
    label: "Journey Completed",
    icon: "🏁",
    accent: "from-tracking-end to-tracking-end/50"
  },
};

export const NodeDetailPanel = ({ point, onClose }) => {
  const [copied, setCopied] = useState(false);
  const style = point ? TYPE_STYLES[point.type] : null;

  const handleCopyCoordinates = () => {
    if (point?.lat && point?.lng) {
      const coords = `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
      navigator.clipboard.writeText(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!point || !style) return null;

  // Calculate additional metrics
  const speedKmh = point.speed ? (point.speed * 3.6).toFixed(1) : null;
  const isMoving = point.type === "MOVING";
  const isStopped = point.type === "STOP";
  
  // Time-based greetings
  const hour = new Date(point.time).getHours();
  const greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.23, 0.86, 0.39, 0.96] }}
        className={`rounded-2xl border ${style.border} ${style.bg} backdrop-blur-sm shadow-2xl overflow-hidden relative`}
      >
        {/* Animated Gradient Border */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.accent}`} />
        
        {/* Header */}
        <div className="relative p-5 pb-3">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-black/40 transition-all hover:scale-110"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className={`text-2xl ${style.text}`}>{style.icon}</div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>
                {style.label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Good {greeting}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-5 pb-5 space-y-4">
          {/* Time Section */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem 
              icon={<Clock size={14} />} 
              label="Timestamp" 
              value={new Date(point.time).toLocaleString([], { 
                weekday: 'short',
                month: "short", 
                day: "numeric", 
                hour: "2-digit", 
                minute: "2-digit",
                second: "2-digit"
              })} 
            />
            
            {point.duration_min !== undefined && point.duration_min > 0 && (
              <DetailItem 
                icon={<Timer size={14} />} 
                label="Duration" 
                value={formatDuration(point.duration_min)} 
                highlight 
                animation="pulse"
              />
            )}
          </div>

          {/* Coordinates with Copy Feature */}
          {point.lat && point.lng && (
            <div className="relative group">
              <DetailItem 
                icon={<MapPin size={14} />} 
                label="Coordinates" 
                value={`${point.lat.toFixed(6)}°, ${point.lng.toFixed(6)}°`} 
                mono 
                clickable
                onClick={handleCopyCoordinates}
              />
              <button
                onClick={handleCopyCoordinates}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? (
                  <CheckCircle2 size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} className="text-muted-foreground hover:text-foreground" />
                )}
              </button>
            </div>
          )}

          {/* Speed and Movement Stats */}
          <div className="grid grid-cols-2 gap-3">
            {speedKmh && (
              <DetailItem 
                icon={<Gauge size={14} />} 
                label="Speed" 
                value={`${speedKmh} km/h`}
                status={speedKmh > 60 ? "danger" : speedKmh > 30 ? "warning" : "normal"}
              />
            )}
            
            {point.distance_km !== undefined && point.distance_km > 0 && (
              <DetailItem 
                icon={<Navigation size={14} />} 
                label="Distance" 
                value={`${point.distance_km.toFixed(2)} km`}
              />
            )}
          </div>

          {/* Additional Stats for Moving State */}
          {isMoving && point.duration_min > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-to-r from-tracking-moving/20 to-transparent p-3 border border-tracking-moving/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-tracking-moving" />
                  <span className="text-xs font-medium text-muted-foreground">Moving Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={12} className="text-tracking-moving" />
                  <span className="text-xs font-semibold text-tracking-moving">
                    Active for {formatDuration(point.duration_min)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stop Duration Highlight */}
          {isStopped && point.duration_min > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-to-r from-tracking-stop/20 to-transparent p-3 border border-tracking-stop/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery size={14} className="text-tracking-stop" />
                  <span className="text-xs font-medium text-muted-foreground">Stop Duration</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown size={12} className="text-tracking-stop" />
                  <span className="text-xs font-semibold text-tracking-stop">
                    {formatDuration(point.duration_min)} idle
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Journey Progress (if applicable) */}
          {point.journey_progress !== undefined && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Journey Progress</span>
                <span className="font-semibold text-foreground">{Math.round(point.journey_progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${point.journey_progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${style.accent}`}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const DetailItem = ({ icon, label, value, highlight, mono, clickable, onClick, status, animation }) => {
  const statusColors = {
    danger: "text-red-400",
    warning: "text-orange-400",
    normal: "text-emerald-400"
  };

  return (
    <motion.div
      whileHover={clickable ? { scale: 1.02 } : {}}
      whileTap={clickable ? { scale: 0.98 } : {}}
      className={`rounded-xl bg-black/20 backdrop-blur-sm px-3 py-2.5 border border-white/5 hover:border-white/10 transition-all ${
        clickable ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`text-sm font-semibold flex items-center gap-1 ${
        mono ? "font-mono text-xs" : ""
      } ${highlight ? "text-tracking-moving" : status ? statusColors[status] : "text-foreground"}`}>
        {value}
        {animation === "pulse" && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tracking-moving opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-tracking-moving" />
          </span>
        )}
      </p>
    </motion.div>
  );
};

function formatDuration(minutes) {
  if (minutes === undefined || minutes === null) return "—";
  
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  if (minutes < 60) {
    const mins = Math.round(minutes);
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
}