import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { RideStatus } from '../../types';
import type { SortField, SortOrder } from '../../hooks/useRideFilters';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: RideStatus | 'ALL';
  onStatusFilterChange: (status: RideStatus | 'ALL') => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onToggleSort: (field: SortField) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortField,
  sortOrder,
  onToggleSort,
}) => {
  const statusOptions: { value: RideStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All Operations' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'EN_ROUTE', label: 'En Route' },
    { value: 'ARRIVED', label: 'Arrived' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#12141C] border border-white/10">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
        {statusOptions.map((opt) => {
          const isActive = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${isActive
                  ? 'bg-[#D4AF37] text-[#0A0B0E] shadow-md shadow-[#D4AF37]/10'
                  : 'bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-[#F8FAFC]'
                }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="flex items-center gap-3">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search passenger, driver, ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search size={16} />}
            className="py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant={sortField === 'time' ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => onToggleSort('time')}
            leftIcon={<ArrowUpDown size={14} />}
          >
            Time ({sortField === 'time' ? sortOrder.toUpperCase() : 'DESC'})
          </Button>

          <Button
            variant={sortField === 'price' ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => onToggleSort('price')}
            leftIcon={<ArrowUpDown size={14} />}
          >
            Fare ({sortField === 'price' ? sortOrder.toUpperCase() : 'DESC'})
          </Button>
        </div>
      </div>
    </div>
  );
};
