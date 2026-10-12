// Loading placeholder shaped like a dashboard: four KPI tiles, a chart and a
// side panel. Used instead of a spinner so the page doesn't jump when cards arrive.
export function DashboardSkeleton({ testId }: { testId?: string }) {
  const tile = "rounded-2xl border border-slate-200 bg-white p-4 animate-pulse";
  const bar = "rounded-md bg-slate-100";
  return (
    <div role="status" aria-label="Loading your dashboard" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" data-testid={testId}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${tile} h-36`}>
          <div className={`${bar} h-3 w-2/3`} />
          <div className={`${bar} h-7 w-1/2 mt-4`} />
          <div className={`${bar} h-4 w-1/3 mt-3`} />
        </div>
      ))}
      <div className={`${tile} col-span-2 lg:col-span-3 h-72`}>
        <div className={`${bar} h-3 w-40`} />
        <div className={`${bar} h-52 w-full mt-5`} />
      </div>
      <div className={`${tile} col-span-2 lg:col-span-1 h-72`}>
        <div className={`${bar} h-3 w-32`} />
        {[0, 1, 2].map((i) => <div key={i} className={`${bar} h-14 w-full mt-4`} />)}
      </div>
      <span className="sr-only">Loading your dashboard…</span>
    </div>
  );
}
