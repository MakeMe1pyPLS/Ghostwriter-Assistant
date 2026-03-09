export const getCardStyleClasses = (stylePreset?: string) => {
  switch (stylePreset) {
    case 'corporate':
      return "bg-white rounded-lg border border-slate-300 shadow-sm p-5";
    case 'executive':
      return "bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-xl border border-slate-700 shadow-lg p-6";
    case 'elevated':
      return "bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] transition-shadow p-6";
    case 'compact':
      return "bg-white rounded-md border border-slate-200 shadow-sm p-3";
    case 'soft':
    default:
      return "bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-6 md:p-8 hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)] transition-all duration-300";
  }
};
