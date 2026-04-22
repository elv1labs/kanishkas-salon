import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kanishkasacademy.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/dashboard/", "/api/", "/login", "/register"],
            },
        ],
        sitemap: `${BASE}/sitemap.xml`,
    };
}
