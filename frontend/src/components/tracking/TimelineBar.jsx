import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw, Play, Pause } from "lucide-react";
import { TimelineNode } from "./TimelineNode";

export const TimelineBar = ({ timeline, loading, activeNode, onNodeClick, onRefresh }) => {
  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const scrollAmount = dir === "right" ? 280 : -280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setAutoScroll(false);
    }
  };

  const scrollToNode = (index) => {
    if (scrollRef.current && timeline[index]) {
      const nodeElement = document.getElementById(`timeline-node-${index}`);
      if (nodeElement) {
        nodeElement.scrollIntoView({ 
          behavior: "smooth", 
          block: "nearest", 
          inline: "center"
        });
      }
    }
  };

  useEffect(() => {
    if (autoScroll && activeNode !== null) {
      scrollToNode(activeNode);
    }
  }, [activeNode, autoScroll]);

  // Calculate stats
  const totalDistance = timeline.reduce((sum, point) => sum + (point.distance_km || 0), 0).toFixed(1);
  const movingPoints = timeline.filter(p => p.type === "MOVING" && p.speed);
  const avgSpeed = movingPoints.length > 0 
    ? (movingPoints.reduce((sum, p) => sum + (p.speed || 0), 0) / movingPoints.length * 3.6).toFixed(1)
    : "0";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Journey Timeline
            </h3>
            {timeline.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {timeline.length} events · {avgSpeed} km/h avg · {totalDistance} km
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded transition-colors ${
                autoScroll 
                  ? "bg-blue-500 text-white hover:bg-blue-600" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {autoScroll ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={14} className={`text-gray-600 dark:text-gray-400 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-sm text-gray-400">Loading...</div>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No tracking data available
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="overflow-x-auto overflow-y-visible"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="relative min-w-max pb-2">
              {/* Timeline line */}
              <div className="absolute top-5 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700" />
              
              {/* Nodes */}
              <div className="relative flex items-start gap-8">
                {timeline.map((point, index) => (
                  <TimelineNode
                    key={index}
                    id={`timeline-node-${index}`}
                    point={point}
                    index={index}
                    isActive={activeNode === index}
                    onClick={() => {
                      onNodeClick(index);
                      scrollToNode(index);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Node Details */}
      {activeNode !== null && timeline[activeNode] && (
        <NodeDetails point={timeline[activeNode]} onClose={() => onNodeClick(null)} />
      )}
    </div>
  );
};

// Simple node details panel
const NodeDetails = ({ point, onClose }) => {
  const time = new Date(point.time);
  const speedKmh = point.speed ? (point.speed * 3.6).toFixed(1) : null;
  
  const typeColors = {
    START: "text-green-600 dark:text-green-400",
    MOVING: "text-blue-600 dark:text-blue-400",
    STOP: "text-red-600 dark:text-red-400",
    END: "text-purple-600 dark:text-purple-400"
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-start justify-between">
        <div>
          <h4 className={`text-sm font-semibold ${typeColors[point.type] || "text-gray-600 dark:text-gray-400"}`}>
            {point.type} Event
          </h4>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {time.toLocaleString()}
          </div>
          {point.location && (
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 flex items-start gap-2">
              <span className="text-gray-400">📍</span>
              <span>{point.location}</span>
            </div>
          )}
          {speedKmh && (
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Speed: {speedKmh} km/h
            </div>
          )}
          {point.duration_min > 0 && (
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Duration: {point.duration_min < 60 ? `${Math.round(point.duration_min)} min` : `${Math.floor(point.duration_min / 60)}h ${Math.round(point.duration_min % 60)}m`}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
// import React, { useRef, useEffect, useState } from "react";
// import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
// import { 
//   ChevronLeft, ChevronRight, RefreshCw, Flag, 
//   Navigation, Calendar, Clock, TrendingUp, 
//   MapPin, Maximize2, Minimize2, Play, Pause
// } from "lucide-react";
// import { TimelineNode } from "./TimelineNode";

// export const TimelineBar = ({ timeline, loading, activeNode, onNodeClick, onRefresh }) => {
//   const scrollRef = useRef(null);
//   const [autoScroll, setAutoScroll] = useState(true);
//   const [showMinimap, setShowMinimap] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);

//   const scroll = (dir) => {
//     if (scrollRef.current) {
//       const scrollAmount = dir === "right" ? 300 : -300;
//       scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
//       setAutoScroll(false);
//     }
//   };

//   const scrollToNode = (index) => {
//     if (scrollRef.current && timeline[index]) {
//       const nodeElement = document.getElementById(`timeline-node-${index}`);
//       if (nodeElement) {
//         nodeElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
//         setAutoScroll(false);
//       }
//     }
//   };

//   // Auto-scroll to active node
//   useEffect(() => {
//     if (autoScroll && activeNode !== null && scrollRef.current) {
//       scrollToNode(activeNode);
//     }
//   }, [activeNode, autoScroll]);

//   // Handle scroll end to re-enable auto-scroll
//   const handleScrollEnd = () => {
//     const timeout = setTimeout(() => setAutoScroll(true), 1000);
//     return () => clearTimeout(timeout);
//   };

//   const totalDuration = getTotalDuration(timeline);
//   const averageSpeed = calculateAverageSpeed(timeline);
//   const totalDistance = calculateTotalDistance(timeline);

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.4 }}
//    className="rounded-2xl border border-tracking-border bg-gradient-to-br from-tracking-card to-tracking-card/95 shadow-2xl">
//       {/* Header */}
//       <div className="relative p-6 pb-4 border-b border-tracking-border/50">
//         <div className="flex items-start justify-between mb-4">
//           <div>
//             <motion.h2 
//               className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
//               initial={{ x: -20 }}
//               animate={{ x: 0 }}
//             >
//               Journey Timeline
//             </motion.h2>
//             <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
//               <Clock size={10} />
//               {timeline.length > 0 
//                 ? `${timeline.length} events · ${totalDuration}` 
//                 : "No timeline data available"}
//             </p>
//           </div>
          
//           {/* Stats Badges */}
//           {timeline.length > 0 && (
//             <div className="hidden sm:flex items-center gap-2">
//               <motion.div 
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-tracking-moving/10 border border-tracking-moving/20"
//               >
//                 <TrendingUp size={12} className="text-tracking-moving" />
//                 <span className="text-xs font-semibold text-tracking-moving">{averageSpeed}</span>
//                 <span className="text-[10px] text-muted-foreground">avg km/h</span>
//               </motion.div>
//               {totalDistance > 0 && (
//                 <motion.div 
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   transition={{ delay: 0.1 }}
//                   className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
//                 >
//                   <Navigation size={12} className="text-primary" />
//                   <span className="text-xs font-semibold text-primary">{totalDistance}</span>
//                   <span className="text-[10px] text-muted-foreground">km</span>
//                 </motion.div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Control Bar */}
//         <div className="flex items-center justify-between gap-3">
//           <div className="flex items-center gap-1">
//             <ControlButton 
//               icon={<ChevronLeft size={14} />} 
//               onClick={() => scroll("left")}
//               tooltip="Scroll left"
//             />
//             <ControlButton 
//               icon={<ChevronRight size={14} />} 
//               onClick={() => scroll("right")}
//               tooltip="Scroll right"
//             />
//             <ControlButton 
//               icon={autoScroll ? <Play size={12} /> : <Pause size={12} />}
//               onClick={() => setAutoScroll(!autoScroll)}
//               tooltip={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
//               active={autoScroll}
//             />
//           </div>
          
//           <div className="flex items-center gap-1">
//             {timeline.length > 3 && (
//               <ControlButton 
//                 icon={showMinimap ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
//                 onClick={() => setShowMinimap(!showMinimap)}
//                 tooltip={showMinimap ? "Hide minimap" : "Show minimap"}
//               />
//             )}
//             <ControlButton 
//               icon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
//               onClick={onRefresh}
//               tooltip="Refresh timeline"
//               loading={loading}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Minimap Preview */}
//       {showMinimap && timeline.length > 0 && (
//         <motion.div
//           initial={{ height: 0, opacity: 0 }}
//           animate={{ height: "auto", opacity: 1 }}
//           exit={{ height: 0, opacity: 0 }}
//           className="px-6 pt-2 pb-3 border-b border-tracking-border/30"
//         >
//           <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
//             {timeline.map((point, idx) => (
//               <motion.button
//                 key={idx}
//                 whileHover={{ scale: 1.1 }}
//                 onClick={() => scrollToNode(idx)}
//                 className={`flex-shrink-0 w-6 h-1 rounded-full transition-all ${
//                   idx === activeNode 
//                     ? `bg-${getTypeColor(point.type)} h-1.5` 
//                     : "bg-muted/30 hover:bg-muted/50"
//                 }`}
//                 style={{ backgroundColor: getTypeColorHex(point.type) }}
//               />
//             ))}
//           </div>
//         </motion.div>
//       )}

//       {/* Timeline Content */}
//       <div className="relative">
//         {loading ? (
//           <TimelineSkeleton />
//         ) : timeline.length === 0 ? (
//           <EmptyTimeline />
//         ) : (
//           <div 
//             ref={scrollRef}
//             onScroll={handleScrollEnd}
//              className="overflow-x-auto overflow-y-hidden pb-6 pt-8 scrollbar-custom"
//   style={{ maxWidth: "100%" }}
//           >
//             <div className="flex items-center gap-0 min-w-max px-8">
//               {/* Start Marker */}
//               <div className="flex-shrink-0 mr-2">
//                 <div className="text-center">
//                   <div className="text-[10px] text-muted-foreground mb-1">START</div>
//                   <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg" />
//                 </div>
//               </div>

//               {timeline.map((point, index) => (
//                 <React.Fragment key={index}>
//                   <TimelineNode
//                     id={`timeline-node-${index}`}
//                     point={point}
//                     index={index}
//                     isActive={activeNode === index}
//                     onClick={() => {
//                       onNodeClick(index);
//                       scrollToNode(index);
//                     }}
//                   />
//                   {index < timeline.length - 1 && (
//                     <ConnectorLine 
//                       fromType={point.type} 
//                       toType={timeline[index + 1].type} 
//                       duration={point.duration_min}
//                       distance={point.distance_km}
//                       isActive={activeNode === index || activeNode === index + 1}
//                     />
//                   )}
//                 </React.Fragment>
//               ))}

//               {/* End Marker */}
//               {timeline.length > 0 && (
//                 <div className="flex-shrink-0 ml-2">
//                   <div className="text-center">
//                     <div className="text-[10px] text-muted-foreground mb-1">END</div>
//                     <div className="w-2 h-2 rounded-full bg-rose-400 shadow-lg" />
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       <style jsx>{`
//         .scrollbar-custom::-webkit-scrollbar {
//           height: 4px;
//         }
//         .scrollbar-custom::-webkit-scrollbar-track {
//           background: rgba(255, 255, 255, 0.05);
//           border-radius: 10px;
//         }
//         .scrollbar-custom::-webkit-scrollbar-thumb {
//           background: rgba(255, 255, 255, 0.2);
//           border-radius: 10px;
//         }
//         .scrollbar-custom::-webkit-scrollbar-thumb:hover {
//           background: rgba(255, 255, 255, 0.3);
//         }
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//       `}</style>
//     </motion.div>
//   );
// };

// const ControlButton = ({ icon, onClick, tooltip, active, loading }) => (
//   <motion.button
//     whileHover={{ scale: 1.05 }}
//     whileTap={{ scale: 0.95 }}
//     onClick={onClick}
//     className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
//       active 
//         ? "bg-tracking-moving/20 text-tracking-moving border border-tracking-moving/30" 
//         : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
//     }`}
//     title={tooltip}
//     disabled={loading}
//   >
//     {icon}
//   </motion.button>
// );

// const ConnectorLine = ({ fromType, toType, duration, distance, isActive }) => {
//   const getLineColor = () => {
//     if (fromType === "MOVING") return "from-tracking-moving via-tracking-moving/50 to-tracking-moving/20";
//     if (fromType === "STOP") return "from-tracking-stop via-tracking-stop/50 to-tracking-stop/20";
//     return "from-border via-border/50 to-border/20";
//   };

//   return (
//     <div className="relative flex flex-col items-center justify-center group" style={{ minWidth: 60 }}>
//       <motion.div
//         initial={{ scaleX: 0 }}
//         animate={{ scaleX: 1 }}
//         transition={{ duration: 0.5, delay: 0.1 }}
//         className={`relative h-0.5 w-full bg-gradient-to-r ${getLineColor()}`}
//       >
//         {isActive && (
//           <motion.div
//             className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
//             animate={{ x: ["-100%", "100%"] }}
//             transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
//           />
//         )}
//       </motion.div>
      
//       {(duration > 0 || distance > 0) && (
//         <motion.div
//           initial={{ opacity: 0, y: -5 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="absolute -top-6 flex items-center gap-1.5 bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10"
//         >
//           {duration > 0 && (
//             <span className="text-[9px] font-mono text-muted-foreground">
//               {formatShort(duration)}
//             </span>
//           )}
//           {distance > 0 && (
//             <>
//               <span className="text-[8px] text-muted-foreground/50">•</span>
//               <span className="text-[9px] font-mono text-muted-foreground">
//                 {distance.toFixed(1)}km
//               </span>
//             </>
//           )}
//         </motion.div>
//       )}
//     </div>
//   );
// };

// const TimelineSkeleton = () => (
//   <div className="py-12 px-8">
//     <div className="flex items-center gap-6 justify-center">
//       {[...Array(5)].map((_, i) => (
//         <React.Fragment key={i}>
//           <div className="flex flex-col items-center gap-2">
//             <div className="h-14 w-14 rounded-full bg-gradient-to-br from-muted/40 to-muted/20 animate-pulse" />
//             <div className="h-2 w-16 rounded bg-muted/30 animate-pulse" />
//             <div className="h-1.5 w-10 rounded bg-muted/20 animate-pulse" />
//           </div>
//           {i < 4 && <div className="h-0.5 w-20 bg-muted/20 animate-pulse" />}
//         </React.Fragment>
//       ))}
//     </div>
//   </div>
// );

// const EmptyTimeline = () => (
//   <motion.div 
//     initial={{ scale: 0.95 }}
//     animate={{ scale: 1 }}
//     className="flex flex-col items-center justify-center py-16 text-center"
//   >
//     <div className="relative mb-4">
//       <div className="absolute inset-0 rounded-full bg-muted/20 blur-xl" />
//       <Flag size={48} className="relative text-muted-foreground/30" />
//     </div>
//     <p className="text-sm font-semibold text-foreground/60">No tracking events yet</p>
//     <p className="text-xs text-muted-foreground mt-1 max-w-xs">
//       Generate GPS data or start a new journey to see your timeline
//     </p>
//   </motion.div>
// );

// // Helper functions
// function getTotalDuration(timeline) {
//   if (timeline.length < 2) return "";
//   const start = new Date(timeline[0].time);
//   const end = new Date(timeline[timeline.length - 1].time);
//   const diffMin = (end.getTime() - start.getTime()) / 60000;
//   if (diffMin < 60) return `${Math.round(diffMin)} min`;
//   return `${Math.floor(diffMin / 60)}h ${Math.round(diffMin % 60)}m`;
// }

// function calculateAverageSpeed(timeline) {
//   const movingPoints = timeline.filter(p => p.type === "MOVING" && p.speed);
//   if (movingPoints.length === 0) return "0";
//   const avg = movingPoints.reduce((sum, p) => sum + (p.speed || 0), 0) / movingPoints.length;
//   return avg.toFixed(1);
// }

// function calculateTotalDistance(timeline) {
//   let total = 0;
//   for (let i = 1; i < timeline.length; i++) {
//     if (timeline[i].distance_km) {
//       total += timeline[i].distance_km;
//     } else if (timeline[i-1].lat && timeline[i].lat) {
//       // Rough calculation if distance not provided
//       const distance = Math.sqrt(
//         Math.pow(timeline[i].lat - timeline[i-1].lat, 2) + 
//         Math.pow(timeline[i].lng - timeline[i-1].lng, 2)
//       ) * 111;
//       total += distance;
//     }
//   }
//   return total > 0 ? total.toFixed(1) : null;
// }

// function getTypeColor(type) {
//   const colors = {
//     START: "emerald-400",
//     MOVING: "tracking-moving",
//     STOP: "tracking-stop",
//     END: "rose-400"
//   };
//   return colors[type] || "gray-400";
// }

// function getTypeColorHex(type) {
//   const colors = {
//     START: "#10b981",
//     MOVING: "#3b82f6",
//     STOP: "#ef4444",
//     END: "#f43f5e"
//   };
//   return colors[type] || "#6b7280";
// }

// function formatShort(minutes) {
//   if (!minutes || minutes < 0) return "0s";
//   if (minutes < 1) return `${Math.round(minutes * 60)}s`;
//   if (minutes < 60) return `${Math.round(minutes)}m`;
//   return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
// }