export default function AboutLoading() {
    return (
        <div className="min-h-screen bg-cream">
            <div className="relative h-[50vh] bg-espresso flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="skeleton-gold h-4 w-20 mx-auto" />
                    <div className="skeleton-gold h-10 w-48 mx-auto rounded" />
                </div>
            </div>
            <div className="container-salon section-padding">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="skeleton-gold aspect-[4/5] rounded-sm" />
                    <div className="space-y-4">
                        <div className="skeleton-gold h-3 w-24" />
                        <div className="skeleton-gold h-8 w-48 rounded" />
                        <div className="skeleton-gold h-0.5 w-16" />
                        <div className="skeleton-gold h-24 w-full rounded" />
                        <div className="skeleton-gold h-24 w-full rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
