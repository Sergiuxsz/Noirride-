import { useState, useMemo } from 'react';
import { useRideContext } from '../context/RideContext';
import type { RideStatus } from '../types';

export type SortField = 'time' | 'price';
export type SortOrder = 'asc' | 'desc';

export const useRideFilters = () => {
  const { rides, updateRideStatus } = useRideContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RideStatus | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSortedRides = useMemo(() => {
    return rides
      .filter((ride) => {
        if (statusFilter !== 'ALL' && ride.status !== statusFilter) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchCustomer = (ride.customerName || '').toLowerCase().includes(q);
          const matchDriver = (ride.driverName || '').toLowerCase().includes(q);
          const matchId = (ride.id || '').toLowerCase().includes(q);
          const matchPickup = (ride.pickupLocation || '').toLowerCase().includes(q);
          return matchCustomer || matchDriver || matchId || matchPickup;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'price') {
          return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
        } else {
          // Sort by creation time to ensure newest bookings are always at the top
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        }
      });
  }, [rides, statusFilter, searchQuery, sortField, sortOrder]);

  const stats = useMemo(() => {
    const totalRidesToday = rides.length;
    const activeRides = rides.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'EN_ROUTE' || r.status === 'ARRIVED').length;
    const upcomingRides = rides.filter((r) => r.status === 'SCHEDULED').length;
    const cancelledRides = rides.filter((r) => r.status === 'CANCELLED').length;
    const revenueToday = rides
      .filter((r) => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS' || r.status === 'EN_ROUTE')
      .reduce((acc, curr) => acc + (curr.price || 0), 0);

    return {
      totalRidesToday,
      activeRides,
      upcomingRides,
      cancelledRides,
      revenueToday,
    };
  }, [rides]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return {
    rides: filteredAndSortedRides,
    allRidesCount: rides.length,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    sortOrder,
    toggleSort,
    stats,
    updateRideStatus,
  };
};
