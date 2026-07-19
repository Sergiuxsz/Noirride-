import type { Vehicle } from '../types';

export const mockVehicles: Vehicle[] = [
  {
    id: 'veh-1',
    name: 'Tuned VW Golf 4 R32',
    category: 'Custom Street & VIP',
    tagline: 'Raw VR6 acoustic symphony & bespoke street tuning',
    description: 'Heavily modified MK4 R32 featuring widebody stance, Recaro bucket leather seating, custom air suspension, and high-flow Stage 3 tuning.',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1000',
    fallbackSvg: 'sedan',
    passengerCapacity: 3,
    luggageCapacity: 2,
    basePrice: 120,
    ratePerKm: 3.5,
    ratePerHour: 95,
    features: ['Stage 3 Turbo & VR6 Sound', 'Recaro Bucket Seats', 'AccuAir Air Suspension', 'Focal High-Fidelity Audio'],
    makeModel: 'Volkswagen Golf 4 R32 Twin-Turbo'
  },
  {
    id: 'veh-2',
    name: 'Cadillac Escalade ESV',
    category: 'Premium SUV',
    tagline: 'Commanding presence with uncompromised rear legroom',
    description: 'The definitive American luxury extended-wheelbase SUV. Features second-row captain chairs, AKG studio audio, and supreme privacy tinting.',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000',
    fallbackSvg: 'suv',
    passengerCapacity: 6,
    luggageCapacity: 6,
    basePrice: 185,
    ratePerKm: 5.0,
    ratePerHour: 140,
    features: ['Executive Captain Seats', 'Panoramic Glass Roof', 'Privacy Partition Glass', 'Apple/Android Rear Entertainment'],
    makeModel: 'Cadillac Escalade ESV Sport Platinum'
  },
  {
    id: 'veh-3',
    name: 'Mercedes-Benz V-Class',
    category: 'Luxury Van',
    tagline: 'Mobile executive boardroom & roadshow specialist',
    description: 'Custom VIP interior with face-to-face conference seating, retractable burr-walnut tables, and discrete ambient mood lighting.',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1000',
    fallbackSvg: 'van',
    passengerCapacity: 7,
    luggageCapacity: 7,
    basePrice: 210,
    ratePerKm: 5.5,
    ratePerHour: 160,
    features: ['Face-to-Face Seating', 'Retractable Conference Table', 'Nespresso Coffee Bar', 'High-Ceiling Headroom'],
    makeModel: 'Mercedes-Benz V 300 d Exclusive Long'
  },
  {
    id: 'veh-4',
    name: 'Mercedes-Maybach S 680',
    category: 'Executive Class',
    tagline: 'The absolute pinnacle of automotive bespoke luxury',
    description: 'First-class rear suites with 43-degree reclining massage seats, silver champagne flutes, active road noise cancellation, and chauffeur partition.',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=1000',
    fallbackSvg: 'executive',
    passengerCapacity: 2,
    luggageCapacity: 2,
    basePrice: 350,
    ratePerKm: 9.0,
    ratePerHour: 260,
    features: ['First-Class Reclining Suites', 'Hot Stone Massage Seating', 'Robbe & Berking Flutes', 'Private Chauffeur Partition'],
    makeModel: 'Mercedes-Maybach S 680 V12'
  }
];
