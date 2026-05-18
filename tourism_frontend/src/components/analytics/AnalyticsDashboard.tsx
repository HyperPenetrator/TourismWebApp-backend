'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAnalyticsSSE, AnalyticsSnapshot } from '@/hooks/useAnalyticsSSE';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  Zap,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
  Shield,
  Wifi,
  WifiOff,
  Lock,
} from 'lucide-react';

// ── Mini Sparkline (pure SVG, no dependencies) ────────────────────────────────
const Sparkline = ({
  data,
  color = '#10b981',
  height = 32,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) => {
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-fill-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ── Metric Card ───────────────────────────────────────────────────────────────
const MetricCard = ({
  icon,
  label,
  value,
  sub,
  sparkData,
  sparkColor,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  sparkData?: number[];
  sparkColor?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="relative overflow-hidden rounded-xl border border-white/10 dark:border-white/5
               bg-white/5 dark:bg-white/[0.02] backdrop-blur-lg
               p-4 flex flex-col gap-2 group
               hover:border-tactical-emerald/30 transition-all duration-300"
  >
    {/* Subtle glow on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                    bg-gradient-to-br from-tactical-emerald/5 to-transparent pointer-events-none" />

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-tactical-emerald/10 flex items-center justify-center text-tactical-emerald">
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/40">
          {label}
        </span>
      </div>
      {sparkData && sparkData.length > 1 && (
        <Sparkline data={sparkData} color={sparkColor || '#10b981'} width={64} height={20} />
      )}
    </div>

    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-foreground tracking-tight tabular-nums">
        {value}
      </span>
      {sub && (
        <span className="text-[10px] font-medium text-slate-400 dark:text-white/30">
          {sub}
        </span>
      )}
    </div>
  </motion.div>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBar = ({
  data,
  total,
}: {
  data: Record<string, number>;
  total: number;
}) => {
  const segments = useMemo(() => {
    const statusColors: Record<string, string> = {
      '2': '#10b981', // 2xx — green
      '3': '#f59e0b', // 3xx — amber
      '4': '#f97316', // 4xx — orange
      '5': '#ef4444', // 5xx — red
    };

    return Object.entries(data)
      .map(([code, count]) => ({
        code,
        count,
        pct: total > 0 ? (count / total) * 100 : 0,
        color: statusColors[code[0]] || '#94a3b8',
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [data, total]);

  return (
    <div className="flex flex-col gap-2">
      {/* Stacked bar */}
      <div className="h-2 rounded-full overflow-hidden flex bg-slate-800/30">
        {segments.map((s) => (
          <motion.div
            key={s.code}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(s.pct, 0.5)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ backgroundColor: s.color }}
            className="h-full"
            title={`${s.code}: ${s.count}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {segments.map((s) => (
          <div key={s.code} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] font-mono text-slate-400">
              {s.code} <span className="font-bold text-foreground/70">{s.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Top Paths Table ───────────────────────────────────────────────────────────
const TopPaths = ({ paths, total }: { paths: { path: string; count: number }[]; total: number }) => (
  <div className="flex flex-col gap-1.5">
    {paths.slice(0, 6).map((p, i) => {
      const pct = total > 0 ? (p.count / total) * 100 : 0;
      return (
        <motion.div
          key={p.path}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 relative h-6 rounded-md overflow-hidden bg-slate-800/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
              className="absolute inset-y-0 left-0 bg-tactical-emerald/15 rounded-md"
            />
            <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-mono text-foreground/70 truncate pr-12">
              {p.path}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-tactical-emerald tabular-nums w-10 text-right">
            {p.count}
          </span>
        </motion.div>
      );
    })}
  </div>
);

// ── Connection Status Pill ────────────────────────────────────────────────────
const ConnectionPill = ({ connected }: { connected: boolean }) => (
  <div
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all duration-300 ${
      connected
        ? 'border-tactical-emerald/30 text-tactical-emerald bg-tactical-emerald/5'
        : 'border-amber-500/30 text-amber-500 bg-amber-500/5 animate-pulse'
    }`}
  >
    {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
    {connected ? 'Live' : 'Reconnecting'}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const AnalyticsDashboard = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { snapshot, isConnected } = useAnalyticsSSE(
    isAuthenticated ? token : null
  );

  // ── Auth / Role Gate ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
        <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center">
          <Lock size={24} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium">Authentication required to view analytics</p>
        <p className="text-[11px] text-slate-300">Please log in to access the dashboard</p>
      </div>
    );
  }

  if (user?.role !== 'artisan' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
        <div className="w-16 h-16 rounded-full border border-amber-500/20 flex items-center justify-center">
          <Shield size={24} className="text-amber-500/50" />
        </div>
        <p className="text-sm font-medium">Artisan Access Only</p>
        <p className="text-[11px] text-slate-300 text-center max-w-xs">
          The analytics dashboard is available to artisan accounts.
          Switch to an artisan account to view traffic metrics.
        </p>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (!snapshot) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-tactical-emerald">
            Analytics Command
          </h2>
          <ConnectionPill connected={isConnected} />
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-white/5 bg-white/[0.02] skeleton-shimmer"
          />
        ))}
      </div>
    );
  }

  const s = snapshot;

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-tactical-emerald">
            Analytics Command
          </h2>
          <span className="text-[9px] font-mono text-slate-400/50">
            60-min window
          </span>
        </div>
        <ConnectionPill connected={isConnected} />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Activity size={14} />}
          label="Requests"
          value={s.total_requests.toLocaleString()}
          sub={`${s.requests_per_minute}/min`}
          sparkData={s.requests_trend}
          delay={0}
        />
        <MetricCard
          icon={<Users size={14} />}
          label="Visitors"
          value={s.unique_visitors}
          delay={0.05}
        />
        <MetricCard
          icon={<Zap size={14} />}
          label="Avg Latency"
          value={`${s.avg_latency_ms}`}
          sub="ms"
          sparkData={s.latency_trend}
          sparkColor="#f59e0b"
          delay={0.1}
        />
        <MetricCard
          icon={<Clock size={14} />}
          label="P95 Latency"
          value={`${s.p95_latency_ms}`}
          sub="ms"
          delay={0.15}
        />
        <MetricCard
          icon={<AlertTriangle size={14} />}
          label="Errors"
          value={s.error_count}
          sub={`${s.error_rate_pct}%`}
          delay={0.2}
        />
        <MetricCard
          icon={<TrendingUp size={14} />}
          label="Success"
          value={`${(100 - s.error_rate_pct).toFixed(1)}%`}
          delay={0.25}
        />
      </div>

      {/* Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl border border-white/10 dark:border-white/5
                   bg-white/5 dark:bg-white/[0.02] backdrop-blur-lg p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-tactical-emerald" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/40">
            Response Codes
          </span>
        </div>
        <StatusBar data={s.status_distribution} total={s.total_requests} />
      </motion.div>

      {/* Top Paths */}
      {s.top_paths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-xl border border-white/10 dark:border-white/5
                     bg-white/5 dark:bg-white/[0.02] backdrop-blur-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-tactical-emerald" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/40">
              Hot Endpoints
            </span>
          </div>
          <TopPaths paths={s.top_paths} total={s.total_requests} />
        </motion.div>
      )}

      {/* Timestamp footer */}
      <div className="flex items-center justify-center pt-2">
        <span className="text-[9px] font-mono text-slate-400/40">
          Last update: {new Date(s.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
