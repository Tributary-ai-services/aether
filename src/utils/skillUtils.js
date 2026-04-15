import {
  Image, Search, Code, Wrench, Zap, Globe, Database, Bot,
  Server, FileText, BarChart3, Shield, Brain, Lightbulb,
  MessageSquare, Workflow
} from 'lucide-react';

export const skillIconMap = {
  Image, Search, Code, Wrench, Zap, Globe, Database, Bot,
  Server, FileText, BarChart3, Shield, Brain, Lightbulb,
  MessageSquare, Workflow,
};

export const skillTypeColors = {
  mcp: { bg: 'bg-blue-100', text: 'text-blue-700', activeBg: 'bg-blue-200', ring: 'ring-blue-400' },
  function: { bg: 'bg-purple-100', text: 'text-purple-700', activeBg: 'bg-purple-200', ring: 'ring-purple-400' },
  builtin: { bg: 'bg-green-100', text: 'text-green-700', activeBg: 'bg-green-200', ring: 'ring-green-400' },
};

export function getSkillIcon(iconName) {
  return skillIconMap[iconName] || Wrench;
}

export function getSkillTypeStyle(type) {
  return skillTypeColors[type] || skillTypeColors.builtin;
}
