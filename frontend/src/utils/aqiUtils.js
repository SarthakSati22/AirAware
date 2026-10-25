export const AQI_CATEGORIES = {
  Good: {
    label: 'Good',
    range: '0 - 50',
    color: '#10B981', // green-500
    bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    description: 'Minimal impact. Clean air posing minimal or no health risk.'
  },
  Satisfactory: {
    label: 'Satisfactory',
    range: '51 - 100',
    color: '#84CC16', // lime-500
    bgClass: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
    dotClass: 'bg-lime-400',
    description: 'Minor breathing discomfort to sensitive people.'
  },
  Moderate: {
    label: 'Moderate',
    range: '101 - 200',
    color: '#EAB308', // yellow-500
    bgClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    dotClass: 'bg-yellow-400',
    description: 'Breathing discomfort to people with asthma and heart conditions.'
  },
  Poor: {
    label: 'Poor',
    range: '201 - 300',
    color: '#F97316', // orange-500
    bgClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    dotClass: 'bg-orange-400',
    description: 'Breathing discomfort to most people on prolonged exposure.'
  },
  VeryPoor: {
    label: 'Very Poor',
    range: '301 - 400',
    color: '#EF4444', // red-500
    bgClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    dotClass: 'bg-red-400',
    description: 'Respiratory illness on prolonged exposure. Protect children and elderly.'
  },
  Severe: {
    label: 'Severe',
    range: '401 - 500',
    color: '#881337', // rose-900 / dark maroon
    bgClass: 'bg-rose-950/40 text-rose-400 border-rose-800/40',
    dotClass: 'bg-rose-500',
    description: 'Seriously affects healthy people and severely impacts vulnerable populations.'
  }
};

export const getAQIInfo = (aqi) => {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return {
      label: 'N/A',
      color: '#64748B',
      bgClass: 'bg-slate-700/20 text-slate-400 border-slate-700/30',
      dotClass: 'bg-slate-400',
      description: 'Insufficient or missing data.'
    };
  }
  const val = Number(aqi);
  if (val <= 50) return AQI_CATEGORIES.Good;
  if (val <= 100) return AQI_CATEGORIES.Satisfactory;
  if (val <= 200) return AQI_CATEGORIES.Moderate;
  if (val <= 300) return AQI_CATEGORIES.Poor;
  if (val <= 400) return AQI_CATEGORIES.VeryPoor;
  return AQI_CATEGORIES.Severe;
};
