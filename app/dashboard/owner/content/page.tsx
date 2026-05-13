"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
    FileText, Image as ImageIcon, Globe, Scissors,
    ArrowRight, Plus, Clock, Eye, RefreshCw, Loader2,
    CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentStats = {
    blog: { total: number; published: number; drafts: number };
    gallery: { total: number; published: number; hidden: number };
    services: { total: number; active: number; inactive: number };
};

type ActivityItem = {
    id: string;
    timestamp: string;
    user: string;
    role: string;
    rawAction: string;
    entity: string;
    entityId: string | null;
    details: string;
};

type Section = {
    title: string;
    desc: string;
    icon: React.ReactNode;
    count: string;
    published: string;
    draft: string;
    href: string;
    color: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entityIcon(entity: string) {
    if (entity === "BlogPost") return <FileText size={13} />;
    if (entity === "GalleryItem") return <ImageIcon size={13} />;
    if (entity === "Service") return <Scissors size={13} />;
    return <Globe size={13} />;
}

function entityLabel(entity: string): string {
    const map: Record<string, string> = {
        BlogPost: "Blog",
        GalleryItem: "Gallery",
        Service: "Service",
    };
    return map[entity] ?? entity;
}

function actionLabel(rawAction: string): string {
    if (rawAction.startsWith("CREATE")) return "Created";
    if (rawAction.startsWith("UPDATE")) return "Updated";
    if (rawAction.startsWith("DELETE")) return "Deleted";
    if (rawAction.startsWith("PUBLISH")) return "Published";
    return rawAction;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OwnerContentPage() {
    const [stats, setStats] = useState<ContentStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const [blogRes, galleryRes, servicesRes, logsRes] = await Promise.all([
                fetch("/api/blog/stats"),
                fetch("/api/gallery/stats"),
                fetch("/api/services/stats"),
                fetch("/api/activity-logs?entity=BlogPost,GalleryItem,Service&limit=8"),
            ]);

            let blogTotal = 0, blogPublished = 0, blogDrafts = 0;
            let galleryTotal = 0, galleryPublished = 0, galleryHidden = 0;
            let servicesTotal = 0, servicesActive = 0, servicesInactive = 0;

            if (blogRes.ok) {
                const d = await blogRes.json();
                blogTotal = d.total ?? 0;
                blogPublished = d.published ?? 0;
                blogDrafts = d.draft ?? 0;
            }
            if (galleryRes.ok) {
                const d = await galleryRes.json();
                galleryTotal = d.total ?? 0;
                galleryPublished = d.published ?? 0;
                galleryHidden = d.hidden ?? 0;
            }
            if (servicesRes.ok) {
                const d = await servicesRes.json();
                servicesTotal = d.total ?? 0;
                servicesActive = d.active ?? 0;
                servicesInactive = d.inactive ?? 0;
            }

            setStats({
                blog: { total: blogTotal, published: blogPublished, drafts: blogDrafts },
                gallery: { total: galleryTotal, published: galleryPublished, hidden: galleryHidden },
                services: { total: servicesTotal, active: servicesActive, inactive: servicesInactive },
            });

            // Activity logs
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setActivity(logsData.logs ?? []);
            } else {
                setActivity([]);
            }
        } catch {
            setError("Failed to load content data. Please refresh.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Section definitions (populated from state) ───────────────────────────
    const sections: Section[] = stats
        ? [
            {
                title: "Blog Posts",
                desc: "Review beauty tips, updates, and articles",
                icon: <FileText size={22} />,
                count: `${stats.blog.total} posts`,
                published: `${stats.blog.published} published`,
                draft: stats.blog.drafts > 0 ? `${stats.blog.drafts} drafts` : "",
                href: "/dashboard/receptionist/blog",
                color: "bg-blue-50 text-blue-600",
            },
            {
                title: "Gallery",
                desc: "View salon photos & transformation images",
                icon: <ImageIcon size={22} />,
                count: `${stats.gallery.total} photos`,
                published: `${stats.gallery.published} visible`,
                draft: stats.gallery.hidden > 0 ? `${stats.gallery.hidden} hidden` : "",
                href: "/dashboard/receptionist/gallery",
                color: "bg-purple-50 text-purple-600",
            },
            {
                title: "Services",
                desc: "Review service listings, prices & descriptions",
                icon: <Scissors size={22} />,
                count: `${stats.services.total} services`,
                published: `${stats.services.active} active`,
                draft: stats.services.inactive > 0 ? `${stats.services.inactive} inactive` : "",
                href: "/admin/services",
                color: "bg-gold/10 text-gold-dark",
            },
            {
                title: "Site Content",
                desc: "Manage homepage, about, and site pages",
                icon: <Globe size={22} />,
                count: "CMS",
                published: "Live pages",
                draft: "",
                href: "/dashboard/admin/content",
                color: "bg-green-50 text-green-600",
            },
        ]
        : [];

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-xl text-espresso">Content Management</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-sm border border-cream-darker/50 p-6 animate-pulse">
                            <div className="w-10 h-10 bg-cream-dark rounded-full mb-3" />
                            <div className="h-4 bg-cream-dark rounded w-32 mb-2" />
                            <div className="h-3 bg-cream-dark rounded w-48 mb-3" />
                            <div className="h-3 bg-cream-dark rounded w-24" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="font-display text-xl text-espresso">Content Management</h1>
                <div className="bg-red-50 border border-red-200 rounded-sm p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-600 mb-3">{error}</p>
                    <button onClick={() => loadData()} className="btn-gold text-xs py-2 px-4">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-xl text-espresso">Content Management</h1>
                    <p className="text-xs text-charcoal-lighter mt-0.5">
                        Overview of all site content — review and manage from here
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
                    >
                        {refreshing
                            ? <Loader2 size={13} className="animate-spin" />
                            : <RefreshCw size={13} />
                        }
                        Refresh
                    </button>
                    <Link href="/dashboard/receptionist/blog" className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5">
                        <Plus size={14} /> New Post
                    </Link>
                </div>
            </div>

            {/* Content Section Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section) => (
                    <Link
                        key={section.title}
                        href={section.href}
                        className="bg-white rounded-sm border border-cream-darker/50 p-6 hover:shadow-lg hover:border-gold/20 transition-all group cursor-pointer block"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${section.color}`}>
                                {section.icon}
                            </div>
                            <span className="text-xs text-charcoal-lighter bg-cream px-2 py-1 rounded-sm font-semibold">
                                {section.count}
                            </span>
                        </div>
                        <h3 className="font-display text-base font-semibold text-espresso mb-1">{section.title}</h3>
                        <p className="text-xs text-charcoal-lighter mb-2">{section.desc}</p>
                        <div className="flex items-center gap-3 text-[10px] text-charcoal-lighter mb-3">
                            <span className="flex items-center gap-1">
                                <Eye size={10} className="text-green-500" /> {section.published}
                            </span>
                            {section.draft && (
                                <span className="flex items-center gap-1">
                                    <Clock size={10} className="text-amber-500" /> {section.draft}
                                </span>
                            )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-gold font-semibold uppercase tracking-wider group-hover:text-gold-dark transition-colors">
                            Manage <ArrowRight size={12} />
                        </span>
                    </Link>
                ))}
            </div>

            {/* Recent Content Activity */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-4">Recent Content Activity</h2>

                {activity.length === 0 ? (
                    <div className="text-center py-8">
                        <Clock className="w-8 h-8 text-charcoal-lighter/30 mx-auto mb-2" />
                        <p className="text-sm text-charcoal-lighter">No recent content activity</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {activity.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 py-2.5 px-3 hover:bg-cream/30 rounded-sm transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold flex-shrink-0">
                                    {entityIcon(item.entity)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-espresso truncate">
                                        <span className="text-charcoal-lighter">{actionLabel(item.rawAction)}</span>
                                        {item.details ? ` — ${item.details.slice(0, 60)}` : ""}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] bg-cream px-1.5 py-0.5 rounded text-charcoal-lighter font-semibold uppercase">
                                            {entityLabel(item.entity)}
                                        </span>
                                        <span className="text-[10px] text-charcoal-lighter/60">
                                            {item.user} · {timeAgo(item.timestamp)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action chip */}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${
                                    item.rawAction.startsWith("CREATE") ? "bg-green-100 text-green-700"
                                    : item.rawAction.startsWith("UPDATE") ? "bg-blue-100 text-blue-700"
                                    : item.rawAction.startsWith("DELETE") ? "bg-red-100 text-red-700"
                                    : "bg-cream text-charcoal-lighter"
                                }`}>
                                    {item.rawAction.startsWith("CREATE") ? <CheckCircle2 size={9} className="inline" />
                                     : item.rawAction.startsWith("DELETE") ? <XCircle size={9} className="inline" />
                                     : null}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {activity.length > 0 && (
                    <Link
                        href="/dashboard/admin/logs"
                        className="mt-4 flex items-center gap-1 text-xs text-gold hover:text-gold-dark transition-colors font-semibold"
                    >
                        View Full Activity Log <ArrowRight size={12} />
                    </Link>
                )}
            </div>
        </div>
    );
}
