import React, { useState } from 'react';
import { Terminal, Activity, Car, DollarSign, Clock, XCircle } from 'lucide-react';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { FilterBar } from '../../components/dashboard/FilterBar';
import { RidesTable } from '../../components/dashboard/RidesTable';
import { RideDetailPanel } from '../../components/dashboard/RideDetailPanel';
import { FleetLiveMap } from '../../components/dashboard/FleetLiveMap';
import { useRideFilters } from '../../hooks/useRideFilters';
import type { Ride } from '../../types';

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

  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  return (
    <div className="min-h-[calc(100vh-65px)] pb-16 animate-fade-in">
      <div className="container-custom pt-6 space-y-6">
        {/* Command Center Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              Executive Fleet Operations
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] bg-[#12141C] px-3 py-1.5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Network Status: 100% Encrypted • 12 Active Dossiers</span>
          </div>
        </div>

        {/* Overview KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Operations"
            value={stats.totalRidesToday}
            subtitle="Today's manifest"
            icon={<Car size={20} />}
          />
          <StatsCard
            title="Active Transfers"
            value={stats.activeRides}
            subtitle="En Route / In Progress"
            icon={<Activity size={20} className="text-emerald-400" />}
            trend="LIVE PROTOCOL"
          />
          <StatsCard
            title="Scheduled Dossiers"
            value={stats.upcomingRides}
            subtitle="Pending dispatch"
            icon={<Clock size={20} />}
          />
          <StatsCard
            title="Terminated Orders"
            value={stats.cancelledRides}
            subtitle="Zero fee release"
            icon={<XCircle size={20} className="text-rose-400" />}
          />
          <StatsCard
            title="Guaranteed Revenue"
            value={stats.revenueToday}
            subtitle="Authorized billing"
            icon={<DollarSign size={20} />}
            isRevenue
          />
        </div>

        {/* Compact Activity Feed */}
        <div className="p-4 rounded-xl bg-[#12141C]/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold uppercase tracking-wider">
            <Activity size={15} /> Live Dispatch Feed:
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[#94A3B8]">
            <span>• <strong className="text-[#F8FAFC]">NR-8942</strong> (Victoria Kensington) status switched to EN_ROUTE</span>
            <span>• <strong className="text-[#F8FAFC]">NR-8940</strong> (Sophia Al-Mansoor) active roadshow checkpoint 3 reached</span>
          </div>
          <span className="font-mono text-[11px] text-[#64748B]">Updated just now</span>
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
          <div className="flex items-center justify-between px-2 text-xs text-[#94A3B8]">
            <span>Showing <strong className="text-[#F8FAFC]">{rides.length}</strong> operational transfer records</span>
            <span>Click any record row to open full telemetry dossier and control status</span>
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
