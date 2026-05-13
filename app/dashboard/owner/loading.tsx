// app/dashboard/owner/loading.tsx
export default function OwnerDashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Hero banner skeleton */}
            <div className="bg-espresso rounded-sm p-6 h-[88px] animate-pulse opacity-60" />

            {/* Metric cards skeleton — 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-sm border border-cream-darker/50 p-5 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-6 h-6 rounded-full bg-cream-darker/60" />
                            <div className="w-3 h-3 rounded-full bg-cream-darker/40" />
                        </div>
                        <div className="h-8 w-24 rounded bg-cream-darker/60 mb-2" />
                        <div className="h-3 w-32 rounded bg-cream-darker/40" />
                    </div>
                ))}
            </div>

            {/* Feature cards skeleton — 3 columns, 8 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-sm border border-cream-darker/50 p-5 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-cream-darker/50 mb-4" />
                        <div className="h-4 w-28 rounded bg-cream-darker/60 mb-2" />
                        <div className="h-3 w-40 rounded bg-cream-darker/40" />
                    </div>
                ))}
            </div>
        </div>
    );
}
