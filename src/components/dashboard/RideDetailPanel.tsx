import React, { useState, useEffect } from 'react';
import { X, User, Car, Phone, Mail, FileText, Check, AlertCircle } from 'lucide-react';
import type { Ride, RideStatus } from '../../types';
import { RideStatusBadge } from './RideStatusBadge';
import { TripTimeline } from '../booking/TripTimeline';
import { Button } from '../ui/Button';

interface RideDetailPanelProps {
  ride: Ride | null;
  onClose: () => void;
  onUpdateStatus: (rideId: string, status: RideStatus, notes?: string) => void;
}

export const RideDetailPanel: React.FC<RideDetailPanelProps> = ({
  ride,
  onClose,
  onUpdateStatus,
}) => {
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (ride) {
      setNotes(ride.notes || '');
      setIsSaved(false);
    }
  }, [ride]);

  if (!ride) return null;

  const statuses: { value: RideStatus; label: string }[] = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'EN_ROUTE', label: 'En Route' },
    { value: 'ARRIVED', label: 'Arrived at Curbside' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const handleSaveNotes = () => {
    onUpdateStatus(ride.id, ride.status, notes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleStatusSwitch = (newStatus: RideStatus) => {
    onUpdateStatus(ride.id, newStatus, notes);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fade-in flex justify-end">
      <div
        className="w-full max-w-2xl bg-[#12141C] border-l border-white/15 h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#1A1D28]/60">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-[#D4AF37]">{ride.id}</span>
              <RideStatusBadge status={ride.status} />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Created on {new Date(ride.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Change Controls */}
          <div className="p-5 rounded-2xl bg-[#1A1D28] border border-[#D4AF37]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif uppercase tracking-widest text-[#D4AF37] font-semibold">
                Instant Command Protocol Switch
              </span>
              <AlertCircle size={16} className="text-[#D4AF37]" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {statuses.map((s) => {
                const isCurrent = ride.status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleStatusSwitch(s.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${isCurrent
                        ? 'bg-[#D4AF37] text-[#0A0B0E] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                        : 'bg-[#12141C] text-[#94A3B8] border-white/10 hover:border-white/25 hover:text-[#F8FAFC]'
                      }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Dossier */}
          <div className="p-5 rounded-2xl bg-[#1A1D28]/40 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
              <User size={16} /> VIP Client Dossier
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-[#94A3B8]">Passenger Name</span>
                <span className="font-semibold text-sm text-[#F8FAFC]">{ride.customerName}</span>
              </div>
              <div>
                <span className="block text-[#94A3B8]">VIP Status Tier</span>
                <span className="font-semibold text-[#D4AF37]">{ride.vipTier || 'Standard'} Member</span>
              </div>
              <div className="flex items-center gap-2 text-[#E2E8F0]">
                <Phone size={14} className="text-[#94A3B8]" /> {ride.customerPhone}
              </div>
              <div className="flex items-center gap-2 text-[#E2E8F0] truncate">
                <Mail size={14} className="text-[#94A3B8]" /> {ride.customerEmail}
              </div>
            </div>
          </div>

          {/* Route & Schedule */}
          <div className="p-5 rounded-2xl bg-[#1A1D28]/40 border border-white/10 space-y-4">
            <h4 className="text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
              Itinerary & Schedule
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-[#94A3B8]">Pickup Coordinates</span>
                <span className="font-medium text-[#F8FAFC]">{ride.pickupLocation}</span>
              </div>
              <div>
                <span className="block text-[#94A3B8]">Destination Coordinates</span>
                <span className="font-medium text-[#F8FAFC]">{ride.destination}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                <div>
                  <span className="block text-[#94A3B8]">Date</span>
                  <span className="font-semibold text-[#F8FAFC]">{ride.date}</span>
                </div>
                <div>
                  <span className="block text-[#94A3B8]">Time</span>
                  <span className="font-semibold text-[#F8FAFC]">{ride.time}</span>
                </div>
                <div>
                  <span className="block text-[#94A3B8]">Party Size</span>
                  <span className="font-semibold text-[#F8FAFC]">{ride.passengers} Pax</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & Chauffeur */}
          <div className="p-5 rounded-2xl bg-[#1A1D28]/40 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
              <Car size={16} /> Asset & Chauffeur Assignment
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-[#94A3B8]">Assigned Asset</span>
                <span className="font-semibold text-sm text-[#F8FAFC]">{ride.vehicleName}</span>
              </div>
              <div>
                <span className="block text-[#94A3B8]">Vetted Chauffeur</span>
                <span className="font-semibold text-sm text-[#F8FAFC]">{ride.driverName}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Timeline */}
          <div>
            <TripTimeline status={ride.status} etaMinutes={8} />
          </div>

          {/* Internal Notes Editor */}
          <div className="p-5 rounded-2xl bg-[#1A1D28]/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
                <FileText size={16} /> Internal Operations Dossier Notes
              </div>
              {isSaved && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold animate-fade-in">
                  <Check size={14} /> Dossier Synced
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter flight tracking codes, VIP preferences, gate codes, or security notes..."
              className="w-full bg-[#12141C] text-[#F8FAFC] placeholder-[#64748B] border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={handleSaveNotes}>
                Save Internal Notes
              </Button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1A1D28]/80 flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase text-[#94A3B8]">Guaranteed Revenue</span>
            <span className="font-serif text-xl font-bold text-[#D4AF37]">${ride.price}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Dossier Panel
          </Button>
        </div>
      </div>
    </div>
  );
};
