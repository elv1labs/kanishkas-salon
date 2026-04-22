export default function ServicesLoading() {
    return (
        <div className="min-h-screen bg-cream">
            <div className="relative h-[50vh] bg-espresso flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="skeleton-gold h-4 w-20 mx-auto" />
                    <div className="skeleton-gold h-10 w-60 mx-auto rounded" />
                    <div className="skeleton-gold h-4 w-48 mx-auto" />
                </div>
            </div>
            <div className="container-salon section-padding">
                <div className="flex justify-center gap-3 mb-10">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton-gold h-8 w-16 rounded-sm" />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
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
