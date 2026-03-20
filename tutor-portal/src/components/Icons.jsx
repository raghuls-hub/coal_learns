/**
 * Icons Library — Tutor Portal
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

// ── Sidebar / Navigation ──────────────────────────────────────────────────────

/** Hamburger / menu toggle — replaces ☰ */
export function MenuIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/** Dashboard — replaces text 'DB' */
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

/** My Courses — replaces text 'MC' */
export function CoursesIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

/** Create Course — replaces text 'CC' */
export function CreateIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

/** Logout — replaces text 'LO' */
export function LogoutIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/** Settings — generic gear icon */
export function SettingsIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// ── Dashboard Stat Cards ──────────────────────────────────────────────────────

/** Total Courses stat icon */
export function MortarboardIcon({ size = 24, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
      <path d="M6 11.5v5.5a6 6 0 0 0 12 0v-5.5" />
      <line x1="22" y1="8.5" x2="22" y2="14" />
    </svg>
  );
}

/** Total Enrollments stat icon */
export function UsersIcon({ size = 24, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** Revenue stat icon */
export function RevenueIcon({ size = 24, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

// ── Course Card Actions ───────────────────────────────────────────────────────

export function EditIcon({ size = 15, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function DeleteIcon({ size = 15, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export function PublishIcon({ size = 15, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function UnpublishIcon({ size = 15, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── Module Editor ─────────────────────────────────────────────────────────────

export function BackIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function AddIcon({ size = 18, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function UploadIcon({ size = 32, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

// ── Quick Action / Tips ───────────────────────────────────────────────────────

export function LightbulbIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

export function ZapIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg {...iconProps(size, color, style)} fill={color} stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
