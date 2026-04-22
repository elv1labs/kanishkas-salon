export default function GalleryLoading() {
    return (
        <div className="min-h-screen bg-cream">
            <div className="relative h-[50vh] bg-espresso flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="skeleton-gold h-4 w-20 mx-auto" />
                    <div className="skeleton-gold h-10 w-56 mx-auto rounded" />
                </div>
            </div>
            <div className="container-salon section-padding">
                <div className="flex justify-center gap-3 mb-10">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="skeleton-gold h-8 w-16 rounded-sm" />
                    ))}
                </div>
                <div className="masonry-grid">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="skeleton-gold rounded-sm mb-4"
                            style={{ height: `${200 + (i % 3) * 80}px` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
