import React, { useState, useEffect } from 'react';
import { X, User, Car, Phone, Mail, FileText, Check, AlertCircle } from 'lucide-react';
import type { Ride, RideStatus } from '../../types';
import { RideStatusBadge } from './RideStatusBadge';
import { TripTimeline } from '../booking/TripTimeline';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
    { value: 'SCHEDULED', label: t('dispatch.status.scheduled', 'Scheduled') },
    { value: 'EN_ROUTE', label: t('dispatch.status.enRoute', 'En Route') },
    { value: 'ARRIVED', label: t('dispatch.status.arrived', 'Arrived at Curbside') },
    { value: 'IN_PROGRESS', label: t('dispatch.status.inProgress', 'In Progress') },
    { value: 'COMPLETED', label: t('dispatch.status.completed', 'Completed') },
    { value: 'CANCELLED', label: t('dispatch.status.cancelled', 'Cancelled') },
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
        className="w-full max-w-2xl bg-secondary border-l border-border h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-tertiary/60">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-gold-500">{ride.id}</span>
              <RideStatusBadge status={ride.status} />
            </div>
            <p className="text-xs text-muted mt-1">
              {t('dispatch.createdOn', 'Created on')} {new Date(ride.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-content hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Change Controls */}
          <div className="p-5 rounded-2xl bg-tertiary border border-gold-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif uppercase tracking-widest text-gold-500 font-semibold">
                {t('dispatch.commandProtocol', 'Instant Command Protocol Switch')}
              </span>
              <AlertCircle size={16} className="text-gold-500" />
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
                        ? 'bg-gold-500 text-black border-gold-500 shadow-lg shadow-gold-500/10'
                        : 'bg-secondary text-muted border-border hover:border-gold-500/50 hover:text-content'
                      }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Dossier */}
          <div className="p-5 rounded-2xl bg-tertiary/40 border border-border space-y-4">
            <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-gold-500">
              <User size={16} /> {t('dispatch.vipDossier', 'VIP Client Dossier')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-muted">{t('dispatch.passengerName', 'Passenger Name')}</span>
                <span className="font-semibold text-sm text-content">{ride.customerName}</span>
              </div>
              <div>
                <span className="block text-muted">{t('dispatch.vipStatus', 'VIP Status Tier')}</span>
                <span className="font-semibold text-gold-500">{ride.vipTier || t('dispatch.standard', 'Standard')} {t('dispatch.member', 'Member')}</span>
              </div>
              <div className="flex items-center gap-2 text-content">
                <Phone size={14} className="text-muted" /> {ride.customerPhone}
              </div>
              <div className="flex items-center gap-2 text-content truncate">
                <Mail size={14} className="text-muted" /> {ride.customerEmail}
              </div>
            </div>
          </div>

          {/* Route & Schedule */}
          <div className="p-5 rounded-2xl bg-tertiary/40 border border-border space-y-4">
            <h4 className="text-xs font-serif uppercase tracking-widest text-gold-500">
              {t('dispatch.itinerarySchedule', 'Itinerary & Schedule')}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-muted">{t('dispatch.pickupCoordinates', 'Pickup Coordinates')}</span>
                <span className="font-medium text-content">{ride.pickupLocation}</span>
              </div>
              <div>
                <span className="block text-muted">{t('dispatch.destCoordinates', 'Destination Coordinates')}</span>
                <span className="font-medium text-content">{ride.destination}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <div>
                  <span className="block text-muted">{t('dispatch.date', 'Date')}</span>
                  <span className="font-semibold text-content">{ride.date}</span>
                </div>
                <div>
                  <span className="block text-muted">{t('dispatch.time', 'Time')}</span>
                  <span className="font-semibold text-content">{ride.time}</span>
                </div>
                <div>
                  <span className="block text-muted">{t('dispatch.partySize', 'Party Size')}</span>
                  <span className="font-semibold text-content">{ride.passengers} {t('dispatch.pax', 'Pax')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & Chauffeur */}
          <div className="p-5 rounded-2xl bg-tertiary/40 border border-border space-y-4">
            <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-gold-500">
              <Car size={16} /> {t('dispatch.assetAssignment', 'Asset & Chauffeur Assignment')}
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-muted">{t('dispatch.assignedAsset', 'Assigned Asset')}</span>
                <span className="font-semibold text-sm text-content">{ride.vehicleName}</span>
              </div>
              <div>
                <span className="block text-muted">{t('dispatch.vettedChauffeur', 'Vetted Chauffeur')}</span>
                <span className="font-semibold text-sm text-content">{ride.driverName}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Timeline */}
          <div>
            <TripTimeline status={ride.status} etaMinutes={8} />
          </div>

          {/* Internal Notes Editor */}
          <div className="p-5 rounded-2xl bg-tertiary/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-gold-500">
                <FileText size={16} /> {t('dispatch.internalNotes', 'Internal Operations Dossier Notes')}
              </div>
              {isSaved && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold animate-fade-in">
                  <Check size={14} /> {t('dispatch.dossierSynced', 'Dossier Synced')}
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('dispatch.notesPlaceholder', 'Enter flight tracking codes, VIP preferences, gate codes, or security notes...')}
              className="w-full bg-secondary text-content placeholder-muted border border-border rounded-xl p-3 text-xs focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={handleSaveNotes}>
                {t('dispatch.saveNotes', 'Save Internal Notes')}
              </Button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-border bg-tertiary/80 flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase text-muted">{t('dispatch.guaranteedRevenue', 'Guaranteed Revenue')}</span>
            <span className="font-serif text-xl font-bold text-gold-500">${ride.price}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('dispatch.closeDossier', 'Close Dossier Panel')}
          </Button>
        </div>
      </div>
    </div>
  );
};
