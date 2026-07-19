import type { Driver } from '../types';

export const mockDrivers: Driver[] = [
  {
    id: 'drv-1',
    name: 'Laurent Vance',
    rating: 4.98,
    completedRides: 1420,
    phone: '+1 (555) 019-2834',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    languages: ['English', 'French', 'German'],
    vehicleMake: 'Volkswagen Golf 4 R32 Twin-Turbo',
    licensePlate: 'R32-TURBO'
  },
  {
    id: 'drv-2',
    name: 'Marcus Sterling',
    rating: 5.0,
    completedRides: 2150,
    phone: '+1 (555) 018-9912',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    languages: ['English', 'Italian'],
    vehicleMake: 'Cadillac Escalade ESV',
    licensePlate: 'NOIR-08'
  },
  {
    id: 'drv-3',
    name: 'Elena Rostova',
    rating: 4.99,
    completedRides: 1890,
    phone: '+1 (555) 014-4421',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    languages: ['English', 'Russian', 'Spanish'],
    vehicleMake: 'Mercedes-Maybach S 680',
    licensePlate: 'MAYBACH'
  },
  {
    id: 'drv-4',
    name: 'Sebastian Thorne',
    rating: 4.96,
    completedRides: 980,
    phone: '+1 (555) 012-7788',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
    languages: ['English', 'Mandarin'],
    vehicleMake: 'Mercedes-Benz V 300 d',
    licensePlate: 'NOIR-VIP'
  }
];
