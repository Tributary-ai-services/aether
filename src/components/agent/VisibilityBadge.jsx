import React from 'react';
import { Lock, Users, Globe } from 'lucide-react';
import { VISIBILITY, agentVisibility, visibilityLabel } from '../../utils/agentVisibility.js';

const STYLES = {
  [VISIBILITY.PRIVATE]: { Icon: Lock, cls: 'bg-gray-100 text-gray-600' },
  [VISIBILITY.ORGANIZATION]: { Icon: Users, cls: 'bg-blue-50 text-blue-700' },
  [VISIBILITY.PUBLIC]: { Icon: Globe, cls: 'bg-green-50 text-green-700' },
};

/** Who can use an agent: Only me, My organization or Public (AB-13). */
const VisibilityBadge = ({ agent }) => {
  const value = agentVisibility(agent);
  const { Icon, cls } = STYLES[value];
  const label = visibilityLabel(value);
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded ${cls}`}
      title={`Visibility: ${label}`}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
};

export default VisibilityBadge;
