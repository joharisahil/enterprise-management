import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  History, 
  Gauge, 
  MapPin,
  Clock,
  Navigation,
  TrendingUp,
  TrendingDown,
  Zap,
  Filter,
  X,
  ArrowDown,
  ArrowUp
} from "lucide-react";

export const HistoryPanel = ({ history, loading, onLoadHistory }) => {
  const [expanded, setExpanded] = useState(false);
  const [hoveredRecord, setHoveredRecord] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter states
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [speedFilter, setSpeedFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const toggle = () => {
    setExpanded((prev) => !prev);
    if (!expanded && history.length === 0) {
      onLoadHistory();
    }
  };

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Time filter
    const now = new Date();
    if (timeFilter === "last10min") {
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      filtered = filtered.filter(record => new Date(record.timestamp) >= tenMinutesAgo);
    } else if (timeFilter === "last1hour") {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      filtered = filtered.filter(record => new Date(record.timestamp) >= oneHourAgo);
    } else if (timeFilter === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(record => new Date(record.timestamp) >= todayStart);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Speed filter
    if (speedFilter === "moving") {
      filtered = filtered.filter(record => record.speed > 0);
    } else if (speedFilter === "fast") {
      filtered = filtered.filter(record => record.speed > 40);
    }

    // Sort
    if (sortOrder === "newest") {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    return filtered;
  }, [history, timeFilter, statusFilter, speedFilter, sortOrder]);

  // Calculate statistics based on filtered data
  const stats = {
    totalDistance: filteredHistory.reduce((acc, record, i) => {
      if (i === 0) return acc;
      const prev = filteredHistory[i - 1];
      const distance = Math.sqrt(
        Math.pow(record.lat - prev.lat, 2) + 
        Math.pow(record.lng - prev.lng, 2)
      ) * 111;
      return acc + distance;
    }, 0).toFixed(1),
    maxSpeed: Math.max(...filteredHistory.map(r => r.speed), 0),
    avgSpeed: (filteredHistory.reduce((acc, r) => acc + r.speed, 0) / (filteredHistory.length || 1)).toFixed(1),
    totalRecords: filteredHistory.length
  };

  // Clear all filters
  const clearFilters = () => {
    setTimeFilter("all");
    setStatusFilter("all");
    setSpeedFilter("all");
    setSortOrder("newest");
  };

  // Count active filters
  const activeFilterCount = [timeFilter !== "all", statusFilter !== "all", speedFilter !== "all"].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Header Button */}
      <button
        onClick={toggle}
        className="group relative w-full transition-all duration-300"
      >
        <div className="relative flex w-full items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <History size={16} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Journey History
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock size={10} />
                {filteredHistory.length > 0 
                  ? `${stats.totalRecords} records • ${stats.totalDistance} km` 
                  : "Ready to track your journey"}
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Stats Preview (when collapsed) */}
          {!expanded && filteredHistory.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                <Zap size={10} className="text-blue-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.maxSpeed}</span>
                <span className="text-gray-400">km/h</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                <TrendingUp size={10} className="text-green-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.avgSpeed}</span>
                <span className="text-gray-400">avg</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 dark:border-gray-700">
              
              {/* Filter Header */}
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Filter size={12} />
                    <span>Filters & Sort</span>
                    {activeFilterCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px]">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <X size={10} />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Two Column Filters */}
              {showFilters && (
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-5">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Time Filter */}
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                          Time Range
                        </label>
                        <div className="space-y-1.5">
                          {[
                            { value: "all", label: "All time" },
                            { value: "last10min", label: "Last 10 minutes" },
                            { value: "last1hour", label: "Last 1 hour" },
                            { value: "today", label: "Today" }
                          ].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setTimeFilter(option.value)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                timeFilter === option.value
                                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                          Sort By
                        </label>
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setSortOrder("newest")}
                            className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${
                              sortOrder === "newest"
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            <span>Newest first</span>
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={() => setSortOrder("oldest")}
                            className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${
                              sortOrder === "oldest"
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            <span>Oldest first</span>
                            <ArrowUp size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Status Filter */}
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                          Status
                        </label>
                        <div className="space-y-1.5">
                          {[
                            { value: "all", label: "All statuses", color: "" },
                            { value: "RUNNING", label: "Running", color: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
                            { value: "STOP", label: "Stop", color: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
                            { value: "IDLE", label: "Idle", color: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500" }
                          ].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setStatusFilter(option.value)}
                              className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${
                                statusFilter === option.value
                                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                            >
                              {option.dot && (
                                <div className={`w-1.5 h-1.5 rounded-full ${option.dot}`} />
                              )}
                              <span className={statusFilter === option.value ? "text-blue-600 dark:text-blue-400" : option.color}>
                                {option.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Speed Filter */}
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                          Speed
                        </label>
                        <div className="space-y-1.5">
                          {[
                            { value: "all", label: "All speeds" },
                            { value: "moving", label: "Moving (> 0 km/h)" },
                            { value: "fast", label: "Fast (> 40 km/h)" }
                          ].map(option => (
                            <button
                              key={option.value}
                              onClick={() => setSpeedFilter(option.value)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                speedFilter === option.value
                                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              {filteredHistory.length > 0 && !loading && (
                <div className="grid grid-cols-3 gap-3 p-5 bg-gray-50 dark:bg-gray-800/30">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Distance</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalDistance}<span className="text-xs ml-0.5">km</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Top Speed</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{stats.maxSpeed}<span className="text-xs ml-0.5">km/h</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Speed</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">{stats.avgSpeed}<span className="text-xs ml-0.5">km/h</span></p>
                  </div>
                </div>
              )}

              {/* Content */}
              {loading ? (
                <div className="flex flex-col gap-2 p-5">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="h-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredHistory.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center py-12 px-5"
                >
                  <History size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No records match filters</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Clear all filters
                    </button>
                  )}
                </motion.div>
              ) : (
                <div 
                  className="max-h-96 overflow-y-auto" 
                  style={{ scrollbarWidth: "thin" }}
                >
                  <div className="p-5 space-y-2">
                    {filteredHistory.map((record, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        whileHover={{ x: 4 }}
                        onMouseEnter={() => setHoveredRecord(i)}
                        onMouseLeave={() => setHoveredRecord(null)}
                        className="group cursor-pointer"
                      >
                        <div className={`rounded-lg border transition-all ${
                          hoveredRecord === i
                            ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        }`}>
                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                    record.status === "RUNNING" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                    record.status === "STOP" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                                    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                  }`}>
                                    {record.status}
                                  </span>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {new Date(record.timestamp).toLocaleString([], { 
                                      month: "short", 
                                      day: "numeric", 
                                      hour: "2-digit", 
                                      minute: "2-digit",
                                      second: "2-digit"
                                    })}
                                  </span>
                                </div>
                                
                                {record.location && (
                                  <div className="flex items-start gap-1.5 mb-1">
                                    <MapPin size={10} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400 break-words">
                                      {record.location}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
                                  <span>{record.lat?.toFixed(4)}°, {record.lng?.toFixed(4)}°</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                                    {record.speed}
                                  </div>
                                  <div className="text-[9px] text-gray-400">km/h</div>
                                </div>
                                {i > 0 && filteredHistory[i-1] && record.speed !== filteredHistory[i-1].speed && (
                                  <div>
                                    {record.speed > filteredHistory[i-1].speed ? (
                                      <TrendingUp size={12} className="text-green-500" />
                                    ) : (
                                      <TrendingDown size={12} className="text-red-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};