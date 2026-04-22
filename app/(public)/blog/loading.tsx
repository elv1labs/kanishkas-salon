export default function BlogLoading() {
    return (
        <>
            <section className="bg-espresso py-16 sm:py-20">
                <div className="container-salon text-center px-4">
                    <div className="skeleton-gold h-4 w-24 mx-auto mb-4 rounded" />
                    <div className="skeleton-gold h-10 w-96 max-w-full mx-auto mb-4 rounded" />
                    <div className="skeleton-gold h-4 w-64 mx-auto rounded" />
                </div>
            </section>
            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="card-luxury">
                                <div className="aspect-[16/10] skeleton-gold" />
                                <div className="p-5 space-y-3">
                                    <div className="skeleton-gold h-5 w-3/4 rounded" />
                                    <div className="skeleton-gold h-3 w-full rounded" />
                                    <div className="skeleton-gold h-3 w-1/2 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
