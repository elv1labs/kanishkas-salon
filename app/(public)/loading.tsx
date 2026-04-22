export default function PublicLoading() {
    return (
        <div className="min-h-screen bg-cream">
            {/* Hero Skeleton */}
            <div className="relative h-[60vh] bg-espresso flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="skeleton-gold h-4 w-24 mx-auto" />
                    <div className="skeleton-gold h-12 w-80 mx-auto rounded" />
                    <div className="skeleton-gold h-4 w-60 mx-auto" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="container-salon section-padding">
                <div className="text-center mb-12 space-y-3">
                    <div className="skeleton-gold h-3 w-20 mx-auto" />
                    <div className="skeleton-gold h-8 w-64 mx-auto rounded" />
                    <div className="skeleton-gold h-0.5 w-16 mx-auto" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-sm p-6 space-y-4">
                            <div className="skeleton-gold w-14 h-14 rounded-full" />
                            <div className="skeleton-gold h-3 w-16" />
                            <div className="skeleton-gold h-5 w-3/4 rounded" />
                            <div className="skeleton-gold h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
