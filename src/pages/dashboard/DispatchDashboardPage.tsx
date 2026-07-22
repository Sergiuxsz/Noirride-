import React, { useState } from 'react';
import { Terminal, Activity, Car, DollarSign, Clock, XCircle } from 'lucide-react';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { FilterBar } from '../../components/dashboard/FilterBar';
import { RidesTable } from '../../components/dashboard/RidesTable';
import { RideDetailPanel } from '../../components/dashboard/RideDetailPanel';
import { FleetLiveMap } from '../../components/dashboard/FleetLiveMap';
import { useRideFilters } from '../../hooks/useRideFilters';
import type { Ride } from '../../types';
import { useTranslation } from 'react-i18next';

export const DispatchDashboardPage: React.FC = () => {
  const {
    rides,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    sortOrder,
    toggleSort,
    stats,
    updateRideStatus,
  } = useRideFilters();
  const { t } = useTranslation();

  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  // Sync selectedRide with live updates from Firestore (via rides array)
  React.useEffect(() => {
    if (selectedRide) {
      const liveRide = rides.find(r => r.id === selectedRide.id);
      if (liveRide && JSON.stringify(liveRide) !== JSON.stringify(selectedRide)) {
        setSelectedRide(liveRide);
      }
    }
  }, [rides, selectedRide]);

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in">
      <div className="container-custom pt-6 space-y-6">
        {/* Command Center Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-content">
              {t('dispatch.executiveFleetOperations', 'Executive Fleet Operations')}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted bg-secondary px-3 py-1.5 rounded-xl border border-border">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('dispatch.networkStatus', 'Network Status: 100% Encrypted • 12 Active Dossiers')}</span>
          </div>
        </div>

        {/* Overview KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title={t('dispatch.totalOperations', 'Total Operations')}
            value={stats.totalRidesToday}
            subtitle={t('dispatch.todaysManifest', "Today's manifest")}
            icon={<Car size={20} />}
          />
          <StatsCard
            title={t('dispatch.activeTransfers', 'Active Transfers')}
            value={stats.activeRides}
            subtitle={t('dispatch.enRouteInProgress', 'En Route / In Progress')}
            icon={<Activity size={20} className="text-emerald-400" />}
            trend={t('dispatch.liveProtocol', 'LIVE PROTOCOL')}
          />
          <StatsCard
            title={t('dispatch.scheduledDossiers', 'Scheduled Dossiers')}
            value={stats.upcomingRides}
            subtitle={t('dispatch.pendingDispatch', 'Pending dispatch')}
            icon={<Clock size={20} />}
          />
          <StatsCard
            title={t('dispatch.terminatedOrders', 'Terminated Orders')}
            value={stats.cancelledRides}
            subtitle={t('dispatch.zeroFeeRelease', 'Zero fee release')}
            icon={<XCircle size={20} className="text-rose-400" />}
          />
          <StatsCard
            title={t('dispatch.guaranteedRevenue', 'Guaranteed Revenue')}
            value={stats.revenueToday}
            subtitle={t('dispatch.authorizedBilling', 'Authorized billing')}
            icon={<DollarSign size={20} />}
            isRevenue
          />
        </div>

        {/* Compact Activity Feed */}
        <div className="p-4 rounded-xl bg-secondary/80 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gold-500 font-semibold uppercase tracking-wider">
            <Activity size={15} /> {t('dispatch.liveFeed', 'Live Dispatch Feed:')}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-muted">
            <span>• <strong className="text-content">NR-8942</strong> {t('dispatch.feedMsg1', '(Victoria Kensington) status switched to EN_ROUTE')}</span>
            <span>• <strong className="text-content">NR-8940</strong> {t('dispatch.feedMsg2', '(Sophia Al-Mansoor) active roadshow checkpoint 3 reached')}</span>
          </div>
          <span className="font-mono text-[11px] text-muted">{t('dispatch.updatedJustNow', 'Updated just now')}</span>
        </div>

        {/* Real-Time Mapbox Integration */}
        <FleetLiveMap />

        {/* Filter & Search Controls */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortField={sortField}
          sortOrder={sortOrder}
          onToggleSort={toggleSort}
        />

        {/* Operational Manifest Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-muted">
            <span>{t('dispatch.showing', 'Showing')} <strong className="text-content">{rides.length}</strong> {t('dispatch.operationalRecords', 'operational transfer records')}</span>
            <span>{t('dispatch.clickRecord', 'Click any record row to open full telemetry dossier and control status')}</span>
          </div>
          <RidesTable
            rides={rides}
            onSelectRide={(ride) => setSelectedRide(ride)}
            onResetFilters={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          />
        </div>
      </div>

      {/* Ride Detail Drawer */}
      <RideDetailPanel
        ride={selectedRide}
        onClose={() => setSelectedRide(null)}
        onUpdateStatus={(rideId, status, notes) => {
          updateRideStatus(rideId, status, notes);
          if (selectedRide && selectedRide.id === rideId) {
            setSelectedRide((prev) => (prev ? { ...prev, status, notes } : null));
          }
        }}
      />
    </div>
  );
};
