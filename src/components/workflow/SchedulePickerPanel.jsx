import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const defaultSchedule = {
  frequency: 'daily',
  interval: 1,
  daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
  dayOfMonth: 1,
  lastDay: false,
  time: '09:00',
  timezone: 'UTC',
  starts: '',
  endsType: 'never', // 'never' | 'on_date' | 'after_count'
  endsDate: '',
  endsCount: 10,
};

// Convert friendly schedule to cron expression
const scheduleToCron = (schedule) => {
  const [hours, minutes] = (schedule.time || '09:00').split(':').map(Number);
  const interval = schedule.interval || 1;

  switch (schedule.frequency) {
    case 'daily':
      if (interval === 1) return `${minutes} ${hours} * * *`;
      return `${minutes} ${hours} */${interval} * *`;

    case 'weekly': {
      const days = (schedule.daysOfWeek || [1]).sort().join(',');
      if (interval === 1) return `${minutes} ${hours} * * ${days}`;
      // Cron doesn't natively support "every N weeks" — approximate with weekly
      return `${minutes} ${hours} * * ${days}`;
    }

    case 'monthly': {
      const day = schedule.lastDay ? 'L' : (schedule.dayOfMonth || 1);
      // Standard cron uses day-of-month field; 'L' isn't standard but Argo supports it
      if (interval === 1) return `${minutes} ${hours} ${day} * *`;
      return `${minutes} ${hours} ${day} */${interval} *`;
    }

    case 'yearly':
      return `${minutes} ${hours} ${schedule.dayOfMonth || 1} 1 *`;

    default:
      return `${minutes} ${hours} * * *`;
  }
};

// Try to parse cron back into friendly schedule
const cronToSchedule = (cron) => {
  if (!cron) return null;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [min, hour, dom, month, dow] = parts;
  const schedule = { ...defaultSchedule };

  schedule.time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;

  if (dow !== '*' && dom === '*') {
    // Weekly
    schedule.frequency = 'weekly';
    schedule.daysOfWeek = dow.split(',').map(Number).filter((n) => !isNaN(n));
  } else if (dom !== '*' && month === '*') {
    // Monthly or daily with interval
    if (dom.startsWith('*/')) {
      schedule.frequency = 'daily';
      schedule.interval = parseInt(dom.slice(2)) || 1;
    } else {
      schedule.frequency = 'monthly';
      if (dom === 'L') {
        schedule.lastDay = true;
      } else {
        schedule.dayOfMonth = parseInt(dom) || 1;
      }
      if (month.startsWith('*/')) {
        schedule.interval = parseInt(month.slice(2)) || 1;
      }
    }
  } else if (month !== '*') {
    schedule.frequency = 'yearly';
    schedule.dayOfMonth = parseInt(dom) || 1;
  } else {
    schedule.frequency = 'daily';
    schedule.interval = 1;
  }

  return schedule;
};

const inputClass =
  'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

const SchedulePickerPanel = ({ config, onConfigChange }) => {
  const [schedule, setSchedule] = useState(() => {
    // Restore from saved schedule config, or parse from cron, or use defaults
    if (config?.schedule) return { ...defaultSchedule, ...config.schedule };
    if (config?.cron) {
      const parsed = cronToSchedule(config.cron);
      if (parsed) return parsed;
    }
    return { ...defaultSchedule };
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rawCron, setRawCron] = useState(config?.cron || '');

  const updateScheduleAndCron = useCallback(
    (newSchedule) => {
      setSchedule(newSchedule);
      const cron = scheduleToCron(newSchedule);
      setRawCron(cron);
      onConfigChange('cron', cron);
      onConfigChange('schedule', newSchedule);
      // Persist timezone at the top level for Argo Calendar EventSource
      onConfigChange('timezone', newSchedule.timezone || 'UTC');
    },
    [onConfigChange]
  );

  const updateField = (field, value) => {
    const newSchedule = { ...schedule, [field]: value };
    updateScheduleAndCron(newSchedule);
  };

  const handleRawCronChange = (cron) => {
    setRawCron(cron);
    onConfigChange('cron', cron);
    const parsed = cronToSchedule(cron);
    if (parsed) {
      setSchedule(parsed);
      onConfigChange('schedule', parsed);
      onConfigChange('timezone', parsed.timezone || schedule.timezone || 'UTC');
    }
  };

  // Generate human-readable summary
  const getSummary = () => {
    const freq = schedule.frequency;
    const interval = schedule.interval || 1;
    const time = schedule.time || '09:00';

    if (freq === 'daily') {
      return interval === 1
        ? `Every day at ${time} ${schedule.timezone}`
        : `Every ${interval} days at ${time} ${schedule.timezone}`;
    }
    if (freq === 'weekly') {
      const dayNames = (schedule.daysOfWeek || [])
        .sort()
        .map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label)
        .filter(Boolean)
        .join(', ');
      return interval === 1
        ? `Weekly on ${dayNames} at ${time}`
        : `Every ${interval} weeks on ${dayNames} at ${time}`;
    }
    if (freq === 'monthly') {
      const day = schedule.lastDay ? 'last day' : `day ${schedule.dayOfMonth || 1}`;
      return interval === 1
        ? `Monthly on ${day} at ${time}`
        : `Every ${interval} months on ${day} at ${time}`;
    }
    if (freq === 'yearly') {
      return `Yearly on day ${schedule.dayOfMonth || 1} of January at ${time}`;
    }
    return '';
  };

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-amber-700" />
          <span className="text-xs text-amber-800 font-medium">{getSummary()}</span>
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className={labelClass}>Frequency</label>
        <select
          value={schedule.frequency}
          onChange={(e) => updateField('frequency', e.target.value)}
          className={inputClass}
        >
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Repeat Every */}
      <div>
        <label className={labelClass}>Repeat every</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={schedule.interval || 1}
            onChange={(e) => updateField('interval', Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={99}
            className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-600">
            {schedule.frequency === 'daily' && (schedule.interval === 1 ? 'day' : 'days')}
            {schedule.frequency === 'weekly' && (schedule.interval === 1 ? 'week' : 'weeks')}
            {schedule.frequency === 'monthly' && (schedule.interval === 1 ? 'month' : 'months')}
            {schedule.frequency === 'yearly' && (schedule.interval === 1 ? 'year' : 'years')}
          </span>
        </div>
      </div>

      {/* Days of Week (weekly) */}
      {schedule.frequency === 'weekly' && (
        <div>
          <label className={labelClass}>On days</label>
          <div className="flex gap-1">
            {DAYS_OF_WEEK.map((day) => {
              const isActive = (schedule.daysOfWeek || []).includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => {
                    const current = schedule.daysOfWeek || [];
                    const next = isActive
                      ? current.filter((d) => d !== day.value)
                      : [...current, day.value];
                    if (next.length > 0) updateField('daysOfWeek', next);
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={day.label}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day of Month (monthly) */}
      {schedule.frequency === 'monthly' && (
        <div>
          <label className={labelClass}>On day</label>
          <div className="flex items-center gap-2">
            {!schedule.lastDay && (
              <input
                type="number"
                value={schedule.dayOfMonth || 1}
                onChange={(e) =>
                  updateField('dayOfMonth', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))
                }
                min={1}
                max={31}
                className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            )}
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="schedule-last-day"
                checked={schedule.lastDay || false}
                onChange={(e) => updateField('lastDay', e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="schedule-last-day" className="text-xs text-gray-600">
                Last day of month
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Time */}
      <div>
        <label className={labelClass}>At time</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Clock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="time"
              value={schedule.time || '09:00'}
              onChange={(e) => updateField('time', e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={schedule.timezone || 'UTC'}
            onChange={(e) => updateField('timezone', e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Starts */}
      <div>
        <label className={labelClass}>Starts</label>
        <input
          type="date"
          value={schedule.starts || ''}
          onChange={(e) => updateField('starts', e.target.value)}
          className={inputClass}
        />
        <p className="text-[10px] text-gray-400 mt-0.5">Leave empty to start immediately</p>
      </div>

      {/* Ends */}
      <div>
        <label className={labelClass}>Ends</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="schedule-ends"
              checked={schedule.endsType === 'never'}
              onChange={() => updateField('endsType', 'never')}
              className="text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-gray-600">Never</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="schedule-ends"
              checked={schedule.endsType === 'on_date'}
              onChange={() => updateField('endsType', 'on_date')}
              className="text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-gray-600">On date</span>
            {schedule.endsType === 'on_date' && (
              <input
                type="date"
                value={schedule.endsDate || ''}
                onChange={(e) => updateField('endsDate', e.target.value)}
                className="ml-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            )}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="schedule-ends"
              checked={schedule.endsType === 'after_count'}
              onChange={() => updateField('endsType', 'after_count')}
              className="text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-gray-600">After</span>
            {schedule.endsType === 'after_count' && (
              <>
                <input
                  type="number"
                  value={schedule.endsCount || 10}
                  onChange={(e) =>
                    updateField('endsCount', Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min={1}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-xs text-gray-600">occurrences</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Advanced / Raw Cron */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <ChevronDown
            size={12}
            className={`transition-transform ${showAdvanced ? 'rotate-0' : '-rotate-90'}`}
          />
          {showAdvanced ? 'Hide' : 'Edit as'} cron expression
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <input
              type="text"
              value={rawCron}
              onChange={(e) => handleRawCronChange(e.target.value)}
              placeholder="0 9 * * 1-5"
              className={`${inputClass} font-mono`}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">min hour day month weekday</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePickerPanel;
