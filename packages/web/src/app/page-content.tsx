'use client';

import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Globe, TrendingUp, ExternalLink } from 'lucide-react';
import type { MonitoredUrl, CheckResult, ChangeDetection } from '@boat-monitor/shared';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function PageContent({ urls, recentChecks, recentChanges }: {
  urls: MonitoredUrl[];
  recentChecks: CheckResult[];
  recentChanges: ChangeDetection[];
}) {
  const [checks, setChecks] = useState<CheckResult[]>(recentChecks);
  const [offset, setOffset] = useState(recentChecks.length);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, offset]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/checks?limit=20&offset=${offset}`);
      const newChecks = await response.json();

      if (newChecks.length === 0) {
        setHasMore(false);
      } else {
        setChecks([...checks, ...newChecks]);
        setOffset(offset + newChecks.length);
      }
    } catch (error) {
      console.error('Failed to load more checks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Hero Section */}
      <motion.div variants={item} className="text-center space-y-4">
        <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          24/7 Überwachung der Bootsliegeplatz-Warteliste in Konstanz
        </p>
      </motion.div>

      {/* Status Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Activity}
          label="Status"
          value="Online"
          gradient="from-green-500 to-emerald-600"
          iconColor="text-green-500"
        />
        <StatCard
          icon={Globe}
          label="Überwachte URLs"
          value={urls.length.toString()}
          gradient="from-blue-500 to-cyan-600"
          iconColor="text-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Änderungen gesamt"
          value={recentChanges.length.toString()}
          gradient="from-purple-500 to-pink-600"
          iconColor="text-purple-500"
        />
      </motion.div>

      {/* Monitored URLs */}
      <motion.div variants={item}>
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl shadow-blue-500/10 p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Überwachte URLs</h3>
          </div>
          <div className="space-y-3">
            {urls.map((url, index) => (
              <URLCard key={url.id} url={url} index={index} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* All Checks with Infinite Scroll */}
      <motion.div variants={item}>
        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl shadow-cyan-500/10 p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Alle Prüfungen</h3>
          </div>
          <div className="space-y-2">
            {checks.map((check, index) => (
              <CheckCard key={check.id} check={check} index={index} recentChanges={recentChanges} />
            ))}
          </div>

          {/* Loader for infinite scroll */}
          <div ref={loaderRef} className="py-4 text-center">
            {loading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-400" />
              </div>
            )}
            {!hasMore && (
              <p className="text-sm text-slate-500 dark:text-slate-400">Keine weiteren Prüfungen</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, gradient, iconColor }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="group relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <Icon className={`h-8 w-8 ${iconColor}`} />
          <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} opacity-10`} />
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function URLCard({ url, index }: { url: MonitoredUrl; index: number }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="group relative overflow-hidden backdrop-blur-sm bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4 hover:shadow-lg transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-slate-900 dark:text-white">{url.name}</h4>
          <a
            href={url.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-400 hover:underline truncate transition-colors"
          >
            <span className="truncate">{url.url}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
          {url.lastChecked && (
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Zuletzt geprüft: {new Date(url.lastChecked).toLocaleString('de-DE')}
            </p>
          )}
        </div>
        <div>
          {url.enabled ? (
            <span className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-medium shadow-lg shadow-green-500/50">
              <CheckCircle2 className="h-4 w-4" />
              <span>Aktiv</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-sm font-medium">
              Inaktiv
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CheckCard({ check, index, recentChanges }: { check: CheckResult; index: number; recentChanges: ChangeDetection[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Find related change
  const relatedChange = recentChanges.find(c => c.checkId === check.id);

  // Determine dot color based on change priority
  const changePriority = (check as any).changePriority;
  let dotColor = 'bg-green-500 shadow-green-500/50';

  if (changePriority === 'CRITICAL') {
    dotColor = 'bg-red-500 shadow-red-500/50';
  } else if (changePriority === 'IMPORTANT' || changePriority === 'INFO') {
    dotColor = 'bg-blue-500 shadow-blue-500/50';
  } else if (check.status !== 'SUCCESS') {
    dotColor = 'bg-red-500 shadow-red-500/50';
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="backdrop-blur-sm bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Main Check Info */}
      <div
        className="flex items-center justify-between py-3 px-4 cursor-pointer"
        onClick={() => relatedChange && setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className={`w-2 h-2 ${dotColor} rounded-full shadow-lg animate-pulse`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {(check as any).urlName || 'Unbekannte URL'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {new Date(check.checkedAt).toLocaleString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <a
              href={(check as any).url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 hover:underline truncate max-w-md transition-colors"
            >
              <span className="truncate">{(check as any).url}</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white">{check.responseTime}ms</span>
          <Activity className="h-4 w-4 text-cyan-500" />
          {relatedChange && (isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />)}
        </div>
      </div>

      {/* Dropdown Details */}
      {isOpen && relatedChange && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-200/50 dark:border-slate-700/50 px-4 py-4 space-y-4"
        >
          {/* Change Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                relatedChange.priority === 'CRITICAL'
                  ? 'bg-red-500 text-white'
                  : relatedChange.priority === 'IMPORTANT'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}>
                {relatedChange.priority}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{relatedChange.type}</span>
              <span className="text-xs text-slate-500">
                {Math.round(relatedChange.confidence * 100)}% Sicherheit
              </span>
            </div>
            <p className="text-sm text-slate-900 dark:text-white">{relatedChange.description}</p>
            {relatedChange.matchedKeywords && relatedChange.matchedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {relatedChange.matchedKeywords.map((keyword, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                    🔑 {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Diff */}
          {relatedChange.diff && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Änderungen</h4>
              <div className="relative max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
                  {relatedChange.diff}
                </pre>
              </div>
            </div>
          )}

          {/* Screenshot */}
          {check.screenshotPath && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Screenshot</h4>
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                {imageError ? (
                  <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Screenshot nicht verfügbar</p>
                  </div>
                ) : (
                  <Image
                    src={`/api/screenshots/${check.id}/image`}
                    alt="Screenshot"
                    fill
                    className="object-cover object-top"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
