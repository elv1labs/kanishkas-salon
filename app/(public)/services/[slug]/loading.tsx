export default function ServiceDetailLoading() {
    return (
        <div className="min-h-screen bg-cream">
            <div className="pt-28 pb-4 container-salon px-4 sm:px-6 lg:px-8">
                <div className="skeleton-gold h-4 w-32" />
            </div>
            <div className="container-salon section-padding pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="skeleton-gold aspect-[4/3] rounded-sm" />
                    <div className="space-y-4">
                        <div className="skeleton-gold h-3 w-24" />
                        <div className="skeleton-gold h-10 w-3/4 rounded" />
                        <div className="skeleton-gold h-0.5 w-16" />
                        <div className="flex gap-6">
                            <div className="skeleton-gold h-8 w-24 rounded" />
                            <div className="skeleton-gold h-6 w-20 rounded" />
                        </div>
                        <div className="skeleton-gold h-20 w-full rounded" />
                        <div className="flex gap-3">
                            <div className="skeleton-gold h-12 w-40 rounded-sm" />
                            <div className="skeleton-gold h-12 w-40 rounded-sm" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
