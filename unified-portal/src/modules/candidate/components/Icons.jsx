/**
 * Icons Library — Candidate Portal
 * Professional inline SVG icon components.
 * Each icon accepts: size (default 20), color (default "currentColor"), style (optional).
 */

const iconProps = (size, color, style) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style },
  'aria-hidden': true,
});

// ── Navigation ────────────────────────────────────────────────────────────────

export function DashboardIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function CertificateIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M8.5 14l-2 6 5.5-2.5L17.5 20l-2-6" />
      <path d="M9 14h6" />
    </svg>
  );
}

export function ExploreIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" fill={color} stroke="none" />
    </svg>
  );
}

export function LearningIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function LogoutIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Chapter / Content Types ───────────────────────────────────────────────────

export function VideoIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function DocumentIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export function LinkIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 16, color = '#10b981', style }) {
  return (
    <svg {...iconProps(size, color, style)} fill={color} stroke="none">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.25 14.56l-3.75-3.75 1.06-1.06 2.69 2.69 5.44-5.44 1.06 1.06-6.5 6.5z" />
    </svg>
  );
}

// ── UI Actions ────────────────────────────────────────────────────────────────

export function SearchIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function BackIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// ── States / Empty ────────────────────────────────────────────────────────────

export function BookOpenIcon({ size = 48, color = '#334155', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function AwardIcon({ size = 48, color = '#334155', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export function WrenchIcon({ size = 40, color = '#6366f1', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" />
    </svg>
  );
}

export function AlertCircleIcon({ size = 40, color = '#f87171', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ── AI Assistant ──────────────────────────────────────────────────────────────

export function AiSparkIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.5l-6.2 4.4 2.4-7.2L2 9.2h7.6z" />
    </svg>
  );
}

export function SendIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function CloseIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Certificate card icon ─────────────────────────────────────────────────────

export function RibbonIcon({ size = 32, color = '#fbbf24', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v9" />
      <path d="M9 18l3-2 3 2" />
    </svg>
  );
}
