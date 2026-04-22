export default function ContactLoading() {
    return (
        <div className="min-h-screen bg-cream">
            <div className="relative h-[50vh] bg-espresso flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="skeleton-gold h-4 w-20 mx-auto" />
                    <div className="skeleton-gold h-10 w-48 mx-auto rounded" />
                </div>
            </div>
            <div className="container-salon section-padding">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="skeleton-gold h-[400px] rounded-sm" />
                    <div className="bg-white rounded-sm p-8 space-y-4">
                        <div className="skeleton-gold h-6 w-48 rounded" />
                        <div className="skeleton-gold h-0.5 w-16" />
                        <div className="skeleton-gold h-10 w-full rounded" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="skeleton-gold h-10 rounded" />
                            <div className="skeleton-gold h-10 rounded" />
                        </div>
                        <div className="skeleton-gold h-24 w-full rounded" />
                        <div className="skeleton-gold h-12 w-full rounded-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
}
