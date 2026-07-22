import React from 'react';
import { Badge } from '../ui/Badge';
import type { RideStatus } from '../../types';
import { useTranslation } from 'react-i18next';

interface RideStatusBadgeProps {
  status: RideStatus;
}

export const RideStatusBadge: React.FC<RideStatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  switch (status) {
    case 'SCHEDULED':
      return <Badge variant="blue" dot>{t('dispatch.status.scheduled', 'Scheduled')}</Badge>;
    case 'EN_ROUTE':
      return <Badge variant="amber" dot>{t('dispatch.status.enRoute', 'En Route')}</Badge>;
    case 'ARRIVED':
      return <Badge variant="gold" dot>{t('dispatch.status.arrived', 'Arrived')}</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="emerald" dot>{t('dispatch.status.inProgress', 'In Progress')}</Badge>;
    case 'COMPLETED':
      return <Badge variant="silver">{t('dispatch.status.completed', 'Completed')}</Badge>;
    case 'CANCELLED':
      return <Badge variant="rose">{t('dispatch.status.cancelled', 'Cancelled')}</Badge>;
    default:
      return <Badge variant="dark">{status}</Badge>;
  }
};
