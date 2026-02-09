import React from 'react';
import {
  Image, Search, Code, Wrench, Zap, Globe, Database, Bot,
  Server, FileText, BarChart3, Shield
} from 'lucide-react';

const iconMap = {
  Image, Search, Code, Wrench, Zap, Globe, Database, Bot,
  Server, FileText, BarChart3, Shield,
};

const typeColors = {
  mcp: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: 'Tool' },
  function: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', label: 'Function' },
  builtin: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', label: 'Built-in' },
};

const SkillCard = ({ skill, onSelect, selected = false, autoDetected = false, compact = false }) => {
  const IconComponent = iconMap[skill.icon] || Wrench;
  const typeStyle = typeColors[skill.type] || typeColors.builtin;

  const tags = Array.isArray(skill.tags)
    ? skill.tags
    : (typeof skill.tags === 'string' ? JSON.parse(skill.tags) : []);

  if (compact) {
    return (
      <div
        onClick={onSelect}
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
          selected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        <div className={`p-2 rounded-lg ${typeStyle.bg}`}>
          <IconComponent size={16} className={typeStyle.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {skill.display_name}
            </span>
            {autoDetected && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                Auto
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{skill.description}</p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
          {typeStyle.label}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        selected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${typeStyle.bg}`}>
          <IconComponent size={20} className={typeStyle.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {skill.display_name}
            </h3>
            {autoDetected && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 whitespace-nowrap">
                Auto-detected
              </span>
            )}
          </div>
          <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
            {typeStyle.label}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
        {skill.description}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="text-[10px] text-gray-400">+{tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>{skill.author || 'Unknown'}</span>
        <span>v{skill.version || '1.0.0'}</span>
      </div>
    </div>
  );
};

export default SkillCard;
