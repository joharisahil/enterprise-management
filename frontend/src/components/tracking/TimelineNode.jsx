import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Gauge } from "lucide-react";

export const TimelineNode = ({ point, index, isActive, onClick, id }) => {
  const [isHovered, setIsHovered] = useState(false);
  const time = new Date(point.time);
  const speedKmh = point.speed ? (point.speed * 3.6).toFixed(1) : null;

  // Simple color scheme
  const getNodeColor = () => {
    switch(point.type) {
      case "START": return "bg-green-500";
      case "MOVING": return "bg-blue-500";
      case "STOP": return "bg-red-500";
      case "END": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getLabelColor = () => {
    switch(point.type) {
      case "START": return "text-green-600 dark:text-green-400";
      case "MOVING": return "text-blue-600 dark:text-blue-400";
      case "STOP": return "text-red-600 dark:text-red-400";
      case "END": return "text-purple-600 dark:text-purple-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="relative flex flex-col items-center" style={{ minWidth: 80 }}>
      {/* Node Circle */}
      <button
        id={id}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white dark:bg-gray-900 transition-all duration-200 ${
          isActive 
            ? `${getNodeColor()} border-${point.type === "START" ? "green" : point.type === "MOVING" ? "blue" : point.type === "STOP" ? "red" : "purple"}-500 scale-110 shadow-md` 
            : "border-gray-300 dark:border-gray-600 hover:scale-105"
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${getNodeColor()}`} />
      </button>

      {/* Time */}
      <div className="mt-2">
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Type */}
      <div className="mt-0.5">
        <span className={`text-[9px] font-medium ${getLabelColor()}`}>
          {point.type}
        </span>
      </div>

      {/* Hover Tooltip - Simple and readable */}
      <AnimatePresence>
        {isHovered && !isActive && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 z-20 bg-gray-900 dark:bg-gray-800 text-white rounded-md shadow-lg px-3 py-2 text-xs whitespace-nowrap pointer-events-none"
          >
            <div className="space-y-1">
              <div className="font-medium">{point.type}</div>
              <div className="text-gray-300">{time.toLocaleTimeString()}</div>
              {point.location && (
                <div className="text-gray-300 max-w-xs truncate">
                  📍 {point.location}
                </div>
              )}
              {speedKmh && (
                <div className="text-gray-300">
                  ⚡ {speedKmh} km/h
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
// import React, { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Flag, Square, ArrowRight, CheckCircle, 
//   MapPin, Clock, Gauge, Navigation, 
//   TrendingUp, TrendingDown, Zap, Info
// } from "lucide-react";

// const NODE_CONFIG = {
//   START: {
//     color: "hsl(var(--tracking-start))",
//     bg: "bg-tracking-start/15",
//     border: "border-tracking-start",
//     text: "text-tracking-start",
//     glow: "shadow-[0_0_20px_hsl(var(--tracking-start)/0.4)]",
//     icon: Flag,
//     label: "START",
//     gradient: "from-tracking-start/20 to-tracking-start/5",
//     ring: "ring-tracking-start/30",
//   },
//   MOVING: {
//     color: "hsl(var(--tracking-moving))",
//     bg: "bg-tracking-moving/15",
//     border: "border-tracking-moving",
//     text: "text-tracking-moving",
//     glow: "shadow-[0_0_20px_hsl(var(--tracking-moving)/0.4)]",
//     icon: ArrowRight,
//     label: "MOVING",
//     gradient: "from-tracking-moving/20 to-tracking-moving/5",
//     ring: "ring-tracking-moving/30",
//   },
//   STOP: {
//     color: "hsl(var(--tracking-stop))",
//     bg: "bg-tracking-stop/15",
//     border: "border-tracking-stop",
//     text: "text-tracking-stop",
//     glow: "shadow-[0_0_20px_hsl(var(--tracking-stop)/0.4)]",
//     icon: Square,
//     label: "STOP",
//     gradient: "from-tracking-stop/20 to-tracking-stop/5",
//     ring: "ring-tracking-stop/30",
//   },
//   END: {
//     color: "hsl(var(--tracking-end))",
//     bg: "bg-tracking-end/15",
//     border: "border-tracking-end",
//     text: "text-tracking-end",
//     glow: "shadow-[0_0_20px_hsl(var(--tracking-end)/0.4)]",
//     icon: CheckCircle,
//     label: "END",
//     gradient: "from-tracking-end/20 to-tracking-end/5",
//     ring: "ring-tracking-end/30",
//   },
// };

// export const TimelineNode = ({ point, index, isActive, onClick, id }) => {
//   const [isHovered, setIsHovered] = useState(false);
//   const [showTooltip, setShowTooltip] = useState(false);
//   const nodeRef = useRef(null);
//   const config = NODE_CONFIG[point.type];
//   const Icon = config.icon;

//   // Calculate additional metrics
//   const speedKmh = point.speed ? (point.speed * 3.6).toFixed(1) : null;
//   const isMoving = point.type === "MOVING";
//   const isStop = point.type === "STOP";
//   const hasDuration = point.duration_min !== undefined && point.duration_min > 0;

//   // Time formatting
//   const time = new Date(point.time);
//   const now = new Date();
//   const diffMinutes = (now - time) / 60000;
//   const relativeTime = diffMinutes < 1 ? "just now" :
//                        diffMinutes < 60 ? `${Math.floor(diffMinutes)} min ago` :
//                        diffMinutes < 1440 ? `${Math.floor(diffMinutes / 60)}h ago` :
//                        `${Math.floor(diffMinutes / 1440)}d ago`;

//   // Auto-show tooltip on active or hover
//   useEffect(() => {
//     if (isActive) {
//       setShowTooltip(true);
//     }
//   }, [isActive]);

//   return (
//     <motion.div
//       ref={nodeRef}
//       id={id}
//       initial={{ opacity: 0, scale: 0.4, y: 20 }}
//       animate={{ opacity: 1, scale: 1, y: 0 }}
//       transition={{ 
//         delay: index * 0.03, 
//         duration: 0.4, 
//         ease: [0.34, 1.2, 0.64, 1],
//         type: "spring",
//         stiffness: 200,
//         damping: 15
//       }}
//       className="group relative flex flex-col items-center"
//       style={{ minWidth: 80, zIndex: isActive ? 50 : 10 }}
//       onMouseEnter={() => {
//         setIsHovered(true);
//         setShowTooltip(true);
//       }}
//       onMouseLeave={() => {
//         setIsHovered(false);
//         if (!isActive) setShowTooltip(false);
//       }}
//     >
//       {/* Enhanced Tooltip Popup - Always show for active node */}
//       <AnimatePresence>
//         {showTooltip && (
//           <motion.div
//             initial={{ opacity: 0, y: 10, scale: 0.95 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 10, scale: 0.95 }}
//             transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
//             className="absolute -top-44 left-1/2 z-50 w-64 -translate-x-1/2 pointer-events-none"
//           >
//             <div className="rounded-xl border border-tracking-border bg-gradient-to-br from-tracking-card to-tracking-card/95 shadow-2xl backdrop-blur-sm overflow-hidden">
//               {/* Header with gradient */}
//               <div className={`bg-gradient-to-r ${config.gradient} px-4 py-2.5 border-b border-white/10`}>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Icon size={14} className={config.text} />
//                     <p className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>
//                       {config.label}
//                     </p>
//                   </div>
//                   <span className="text-[9px] text-muted-foreground font-mono">
//                     #{index + 1}
//                   </span>
//                 </div>
//               </div>
              
//               {/* Content */}
//               <div className="p-3 space-y-2">
//                 {/* Time with relative info */}
//                 <div className="flex items-center justify-between text-xs">
//                   <div className="flex items-center gap-1.5">
//                     <Clock size={10} className="text-muted-foreground" />
//                     <span className="text-foreground font-medium">
//                       {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
//                     </span>
//                   </div>
//                   <span className="text-[9px] text-muted-foreground/70">
//                     {relativeTime}
//                   </span>
//                 </div>

//                 {/* Date */}
//                 <div className="text-[10px] text-muted-foreground flex items-center gap-1">
//                   <span>{time.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
//                 </div>

//                 {/* Duration if available */}
//                 {hasDuration && (
//                   <div className={`flex items-center gap-1.5 text-xs p-1.5 rounded-lg ${config.bg}`}>
//                     <Zap size={10} className={config.text} />
//                     <span className="text-foreground/80 font-medium">
//                       Duration: {formatDuration(point.duration_min)}
//                     </span>
//                   </div>
//                 )}

//                 {/* Speed indicator for moving points */}
//                 {isMoving && speedKmh && (
//                   <div className="flex items-center justify-between text-xs">
//                     <div className="flex items-center gap-1.5">
//                       <Gauge size={10} className="text-muted-foreground" />
//                       <span className="text-muted-foreground">Speed</span>
//                     </div>
//                     <span className={`font-mono font-semibold ${
//                       speedKmh > 60 ? "text-red-400" :
//                       speedKmh > 30 ? "text-orange-400" :
//                       "text-emerald-400"
//                     }`}>
//                       {speedKmh} km/h
//                     </span>
//                   </div>
//                 )}

//                 {/* Coordinates */}
//                 {point.lat && point.lng && (
//                   <div className="flex items-start gap-1.5 text-[10px] font-mono bg-black/20 rounded-lg p-1.5">
//                     <MapPin size={8} className="text-muted-foreground mt-0.5 flex-shrink-0" />
//                     <span className="text-muted-foreground break-all">
//                       {point.lat.toFixed(5)}°, {point.lng.toFixed(5)}°
//                     </span>
//                   </div>
//                 )}

//                 {/* Additional info for stop points */}
//                 {isStop && point.duration_min > 5 && (
//                   <div className="flex items-center gap-1.5 text-[10px] text-yellow-400/80">
//                     <Info size={8} />
//                     <span>Extended stop detected</span>
//                   </div>
//                 )}
//               </div>

//               {/* Arrow indicator */}
//               <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-tracking-border bg-tracking-card" />
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Main Node Button */}
//       <motion.button
//         onClick={onClick}
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.95 }}
//         className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
//           config.bg
//         } ${config.border} ${
//           isActive 
//             ? `scale-125 ${config.glow} ring-2 ${config.ring} ring-offset-2 ring-offset-tracking-card` 
//             : "hover:scale-110 hover:shadow-lg"
//         }`}
//       >
//         {/* Ripple Effect on Active */}
//         {isActive && (
//           <motion.span
//             className={`absolute inset-0 rounded-full ${config.bg}`}
//             animate={{ 
//               scale: [1, 1.5, 1.8, 1],
//               opacity: [0.6, 0.3, 0.1, 0.6]
//             }}
//             transition={{ 
//               duration: 2, 
//               repeat: Infinity,
//               repeatType: "loop",
//               ease: "easeInOut"
//             }}
//           />
//         )}

//         {/* Pulse effect on hover */}
//         {isHovered && !isActive && (
//           <motion.span
//             className={`absolute inset-0 rounded-full ${config.bg}`}
//             initial={{ scale: 1, opacity: 0.5 }}
//             animate={{ scale: 1.3, opacity: 0 }}
//             transition={{ duration: 0.8, repeat: Infinity }}
//           />
//         )}

//         {/* Icon with animation */}
//         <motion.div
//           animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
//           transition={{ duration: 0.5 }}
//         >
//           <Icon size={16} className={`${config.text} transition-all`} />
//         </motion.div>

//         {/* Status badge for moving/stop */}
//         {isMoving && point.speed > 0 && (
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-tracking-moving border-2 border-tracking-card flex items-center justify-center"
//           >
//             <span className="text-[8px] font-bold text-white">⚡</span>
//           </motion.div>
//         )}
//       </motion.button>

//       {/* Labels */}
//       <div className="mt-3 text-center">
//         <p className={`text-[11px] font-bold uppercase tracking-wider ${config.text}`}>
//           {config.label}
//         </p>
//         <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono">
//           {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//         </p>
//         {hasDuration && (
//           <p className="text-[8px] text-muted-foreground/40 mt-0.5">
//             {formatShort(point.duration_min)}
//           </p>
//         )}
//       </div>

//       {/* Connection indicator line */}
//       <AnimatePresence>
//         {isActive && (
//           <motion.div
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: 20, opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             className="absolute -bottom-8 w-px bg-gradient-to-b from-tracking-moving to-transparent"
//           />
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// function formatDuration(minutes) {
//   if (!minutes || minutes < 0) return "0s";
//   if (minutes < 1) {
//     const seconds = Math.round(minutes * 60);
//     return `${seconds} second${seconds !== 1 ? 's' : ''}`;
//   }
//   if (minutes < 60) {
//     const mins = Math.round(minutes);
//     return `${mins} minute${mins !== 1 ? 's' : ''}`;
//   }
//   const hours = Math.floor(minutes / 60);
//   const mins = Math.round(minutes % 60);
//   if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
//   return `${hours}h ${mins}m`;
// }

// function formatShort(minutes) {
//   if (!minutes || minutes < 0) return "0s";
//   if (minutes < 1) return `${Math.round(minutes * 60)}s`;
//   if (minutes < 60) return `${Math.round(minutes)}m`;
//   return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
// }