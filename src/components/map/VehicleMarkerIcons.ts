export const getVehicleMarkerSVG = (vehicleIdOrName?: string): string => {
  const normalized = (vehicleIdOrName || '').toLowerCase();

  // 1. Rolls-Royce Phantom VIII (veh-4)
  if (normalized.includes('veh-4') || normalized.includes('phantom') || normalized.includes('rolls-royce')) {
    return `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="20" fill="#0A0B0E" stroke="#D4AF37" stroke-width="2.5" fill-opacity="0.95"/>
      <circle cx="22" cy="22" r="16" stroke="#D4AF37" stroke-width="1" stroke-dasharray="2 2" fill="none"/>
      <!-- Crown / RR Emblem -->
      <path d="M14 26L16 16L22 20L28 16L30 26H14Z" fill="#D4AF37" stroke="#FFF" stroke-width="1"/>
      <circle cx="14" cy="14" r="1.5" fill="#D4AF37"/>
      <circle cx="22" cy="13" r="1.5" fill="#D4AF37"/>
      <circle cx="30" cy="14" r="1.5" fill="#D4AF37"/>
      <path d="M16 28H28" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  // 2. Mercedes-Maybach S-Class (veh-1)
  if (normalized.includes('veh-1') || normalized.includes('maybach') || normalized.includes('s-class')) {
    return `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="20" fill="#0D111A" stroke="#E2E8F0" stroke-width="2.5" fill-opacity="0.95"/>
      <circle cx="22" cy="22" r="17" stroke="#D4AF37" stroke-width="1.5" fill="none"/>
      <!-- Maybach M Emblem -->
      <path d="M15 27V16L22 22L29 16V27" stroke="#D4AF37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M18 27V19.5L22 23L26 19.5V27" stroke="#FFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  // 3. Cadillac Escalade ESV Armored B6 (veh-2)
  if (normalized.includes('veh-2') || normalized.includes('escalade') || normalized.includes('armored')) {
    return `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 4L38 10V22C38 31 31 38 22 41C13 38 6 31 6 22V10L22 4Z" fill="#12141C" stroke="#D4AF37" stroke-width="2.5"/>
      <!-- Armored SUV Silhouette -->
      <path d="M14 26H30M16 22L19 16H25L28 22M14 22H30V26H14V22Z" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="18" cy="26" r="2" fill="#D4AF37"/>
      <circle cx="26" cy="26" r="2" fill="#D4AF37"/>
    </svg>`;
  }

  // 4. Mercedes-Benz V-Class VIP Lounge (veh-3)
  if (normalized.includes('veh-3') || normalized.includes('v-class') || normalized.includes('lounge') || normalized.includes('van')) {
    return `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="36" height="28" rx="8" fill="#12141C" stroke="#D4AF37" stroke-width="2.5"/>
      <!-- Van Lounge Icon -->
      <path d="M12 16H32V25H12V16Z" fill="#1A1D28" stroke="#FFF" stroke-width="1.5"/>
      <circle cx="17" cy="20" r="2" fill="#D4AF37"/>
      <circle cx="27" cy="20" r="2" fill="#D4AF37"/>
      <path d="M12 28H32" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  // 5. BMW 7 Series Protection i7 (veh-5)
  if (normalized.includes('veh-5') || normalized.includes('bmw') || normalized.includes('i7')) {
    return `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="20" fill="#0B132B" stroke="#38BDF8" stroke-width="2.5" fill-opacity="0.95"/>
      <!-- Illuminated Kidney Grille & Shield -->
      <rect x="15" y="16" width="6" height="10" rx="3" stroke="#38BDF8" stroke-width="2" fill="#D4AF37"/>
      <rect x="23" y="16" width="6" height="10" rx="3" stroke="#38BDF8" stroke-width="2" fill="#D4AF37"/>
      <path d="M12 28L22 32L32 28" stroke="#FFF" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  // 6. Bentley Mulsanne EWB (veh-6)
  if (normalized.includes('veh-6') || normalized.includes('bentley') || normalized.includes('mulsanne')) {
    return `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="20" fill="#0F172A" stroke="#D4AF37" stroke-width="2.5" fill-opacity="0.95"/>
      <!-- Bentley Flying Wings -->
      <path d="M10 20C14 20 18 24 22 24C26 24 30 20 34 20C30 17 26 16 22 16C18 16 14 17 10 20Z" fill="#D4AF37"/>
      <circle cx="22" cy="22" r="4" fill="#1E293B" stroke="#FFF" stroke-width="1.5"/>
      <text x="22" y="24" font-family="sans-serif" font-weight="bold" font-size="7" fill="#D4AF37" text-anchor="middle">B</text>
    </svg>`;
  }

  // Default Luxury Executive Car Marker
  return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#12141C" stroke="#D4AF37" stroke-width="2" fill-opacity="0.95"/>
    <path d="M10 18L13 12H27L30 18M10 18V28H13V25H27V28H30V18M10 18H30M15 22C15 22.8 14.3 23.5 13.5 23.5C12.7 23.5 12 22.8 12 22C12 21.2 12.7 20.5 13.5 20.5C14.3 20.5 15 21.2 15 22ZM28 22C28 22.8 27.3 23.5 26.5 23.5C25.7 23.5 25 22.8 25 22C25 21.2 25.7 20.5 26.5 20.5C27.3 20.5 28 21.2 28 22Z" stroke="#D4AF37" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
};
