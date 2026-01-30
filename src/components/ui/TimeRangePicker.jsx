import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

/**
 * Grafana-style time range picker component
 * Supports quick ranges (Last 5 minutes, Last 24 hours, etc.) and custom date ranges
 */
const TimeRangePicker = ({ value, onChange, defaultRange = 'now-24h' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const dropdownRef = useRef(null);

  // Quick range options following Grafana patterns
  const quickRanges = [
    { from: 'now-5m', to: 'now', label: 'Last 5 minutes' },
    { from: 'now-15m', to: 'now', label: 'Last 15 minutes' },
    { from: 'now-30m', to: 'now', label: 'Last 30 minutes' },
    { from: 'now-1h', to: 'now', label: 'Last 1 hour' },
    { from: 'now-6h', to: 'now', label: 'Last 6 hours' },
    { from: 'now-24h', to: 'now', label: 'Last 24 hours' },
    { from: 'now-7d', to: 'now', label: 'Last 7 days' },
    { from: 'now-30d', to: 'now', label: 'Last 30 days' },
    { from: 'now-1d/d', to: 'now-1d/d', label: 'Yesterday' },
    { from: 'now/d', to: 'now', label: 'Today so far' },
    { from: null, to: null, label: 'All time' },
  ];

  // Find default range
  const getDefaultRange = () => {
    return quickRanges.find(r => r.from === defaultRange) || quickRanges[5]; // Last 24 hours
  };

  // Parse relative time expression to Date
  const parseRelativeTime = (expr) => {
    if (!expr || expr === 'now') {
      return new Date();
    }

    const now = new Date();

    // Handle "now-Xm", "now-Xh", "now-Xd" patterns
    const match = expr.match(/^now-(\d+)([mhd])$/);
    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2];
      const result = new Date(now);

      switch (unit) {
        case 'm':
          result.setMinutes(result.getMinutes() - amount);
          break;
        case 'h':
          result.setHours(result.getHours() - amount);
          break;
        case 'd':
          result.setDate(result.getDate() - amount);
          break;
        default:
          break;
      }
      return result;
    }

    // Handle "now/d" (start of today) and "now-1d/d" (start of yesterday)
    if (expr === 'now/d') {
      const result = new Date(now);
      result.setHours(0, 0, 0, 0);
      return result;
    }

    if (expr === 'now-1d/d') {
      const result = new Date(now);
      result.setDate(result.getDate() - 1);
      result.setHours(0, 0, 0, 0);
      return result;
    }

    return now;
  };

  // Format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date for datetime-local input
  const formatDateForInput = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Initialize custom date inputs when a range is selected
  useEffect(() => {
    if (value?.from && value?.to) {
      const fromDate = parseRelativeTime(value.from);
      const toDate = parseRelativeTime(value.to);
      setCustomFrom(formatDateForInput(fromDate));
      setCustomTo(formatDateForInput(toDate));
    }
  }, [value?.from, value?.to]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle quick range selection
  const handleQuickRangeSelect = (range) => {
    onChange({
      from: range.from,
      to: range.to,
      label: range.label,
    });
    setIsOpen(false);
  };

  // Handle custom range apply
  const handleApplyCustomRange = () => {
    if (customFrom && customTo) {
      const fromDate = new Date(customFrom);
      const toDate = new Date(customTo);

      onChange({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        label: `${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`,
        isCustom: true,
      });
      setIsOpen(false);
    }
  };

  // Shift time range forward/backward
  const handleShiftTime = (direction) => {
    if (!value?.from || !value?.to) return;

    const fromDate = parseRelativeTime(value.from);
    const toDate = parseRelativeTime(value.to);
    const duration = toDate.getTime() - fromDate.getTime();

    const shift = direction === 'forward' ? duration : -duration;
    const newFrom = new Date(fromDate.getTime() + shift);
    const newTo = new Date(toDate.getTime() + shift);

    // Don't shift into the future
    if (newTo > new Date()) {
      return;
    }

    onChange({
      from: newFrom.toISOString(),
      to: newTo.toISOString(),
      label: `${formatDateForDisplay(newFrom)} to ${formatDateForDisplay(newTo)}`,
      isCustom: true,
    });
  };

  // Get current display label
  const getDisplayLabel = () => {
    if (!value) {
      return getDefaultRange().label;
    }
    return value.label || 'Select time range';
  };

  // Check if a quick range is currently selected
  const isQuickRangeSelected = (range) => {
    if (!value) return range.from === defaultRange;
    return value.from === range.from && value.to === range.to;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Time Range Button */}
      <div className="flex items-center gap-1">
        {/* Shift backward button */}
        <button
          onClick={() => handleShiftTime('backward')}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
          title="Shift time range backward"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Main button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm text-gray-700 transition-colors min-w-48"
        >
          <Clock size={16} className="text-gray-500" />
          <span className="flex-1 text-left truncate">{getDisplayLabel()}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Shift forward button */}
        <button
          onClick={() => handleShiftTime('forward')}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
          title="Shift time range forward"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[500px]">
          <div className="flex">
            {/* Left Panel: Custom Date Range */}
            <div className="flex-1 p-4 border-r border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Absolute time range</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="datetime-local"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="datetime-local"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                  />
                </div>

                <button
                  onClick={handleApplyCustomRange}
                  disabled={!customFrom || !customTo}
                  className="w-full px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-md text-sm font-medium hover:bg-(--color-primary-700) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply time range
                </button>
              </div>
            </div>

            {/* Right Panel: Quick Ranges */}
            <div className="flex-1 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick ranges</h3>

              <div className="space-y-1 max-h-64 overflow-y-auto">
                {quickRanges.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickRangeSelect(range)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isQuickRangeSelected(range)
                        ? 'bg-(--color-primary-100) text-(--color-primary-700) font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeRangePicker;
