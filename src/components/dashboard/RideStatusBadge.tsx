import React from 'react';
import { Badge } from '../ui/Badge';
import type { RideStatus } from '../../types';

interface RideStatusBadgeProps {
  status: RideStatus;
}

export const RideStatusBadge: React.FC<RideStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'SCHEDULED':
      return <Badge variant="blue" dot>Scheduled</Badge>;
    case 'EN_ROUTE':
      return <Badge variant="amber" dot>En Route</Badge>;
    case 'ARRIVED':
      return <Badge variant="gold" dot>Arrived</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="emerald" dot>In Progress</Badge>;
    case 'COMPLETED':
      return <Badge variant="silver">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="rose">Cancelled</Badge>;
    default:
      return <Badge variant="dark">{status}</Badge>;
  }
};
