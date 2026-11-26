import React, { useEffect, useState } from 'react';
import {
  Activity,
  ClipboardCheck,
  FileClock,
  LogOut,
  QrCode,
  RefreshCw,
  Route,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { UserProfile } from '../types';
import { fetchAdminOverview, type AdminOverview } from '../utils/apiClient';

interface AdminDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

const metricCards = [
  { key: 'totalTravellers', label: 'Registered travellers', icon: Users },
  { key: 'totalJourneys', label: 'Journeys', icon: Route },
  { key: 'activeJourneys', label: 'Active journeys', icon: Activity },
  { key: 'totalAssessments', label: 'Readiness assessments', icon: ClipboardCheck },
  { key: 'pendingContentReviews', label: 'Pending content reviews', icon: FileClock },
  { key: 'totalQrVerifications', label: 'QR verifications', icon: QrCode },
  { key: 'validQrSummaries', label: 'Valid QR passes', icon: ShieldCheck },
] as const;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
}) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadOverview = async () => {
    if (!currentUser.accessToken) {
      setError('This session has no server access token. Sign in again to continue.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      setOverview(await fetchAdminOverview(currentUser.accessToken));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the administrator dashboard.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, [currentUser.accessToken]);

  return (
    <div className="min-h-screen bg-pearl-slate text-pearl-text">
      <header className="border-b border-pearl-border bg-pearl-navy/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pearl-gold-light">
              Pearl Travel
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Admin dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-pearl-text-secondary sm:block">{currentUser.email}</span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-pearl-border px-3 py-2 text-sm text-pearl-text-secondary transition hover:bg-pearl-dark"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Operations overview</h2>
            <p className="mt-1 text-sm text-pearl-placeholder">
              Live totals from the Pearl Travel API and its database.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOverview()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-pearl-border px-3 py-2 text-sm text-pearl-text-secondary transition hover:bg-pearl-dark disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </section>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-pearl-danger/40 bg-pearl-danger/10 p-4 text-sm text-pearl-danger-light">
            <p>{error}</p>
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 font-semibold underline underline-offset-4"
            >
              Return to sign in
            </button>
          </div>
        )}

        <section aria-label="Administrator metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map(({ key, label, icon: Icon }) => (
            <article key={key} className="rounded-2xl border border-pearl-border bg-pearl-dark p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-pearl-placeholder">{label}</p>
                <span className="rounded-lg bg-pearl-surface p-2 text-pearl-gold-light">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-5 text-3xl font-semibold tabular-nums">
                {isLoading ? '—' : (overview?.kpis[key] ?? '—')}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-pearl-border bg-pearl-dark p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Service health</h2>
              <p className="mt-1 text-sm text-pearl-placeholder">
                API and database status reported by the server.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                overview?.systemHealth.database === 'healthy'
                  ? 'bg-pearl-success/15 text-pearl-success-light'
                  : 'bg-pearl-gold/10 text-pearl-gold-light'
              }`}
            >
              {isLoading ? 'Checking' : overview?.systemHealth.database ?? 'Unavailable'}
            </span>
          </div>
          {overview && (
            <p className="mt-4 text-sm text-pearl-placeholder">
              API {overview.systemHealth.api}
              {overview.systemHealth.databaseLatencyMs !== null &&
                ` · Database latency ${overview.systemHealth.databaseLatencyMs} ms`}
              {' · Updated '}
              {new Date(overview.generatedAt).toLocaleString()}
            </p>
          )}
        </section>
      </main>
    </div>
  );
};
