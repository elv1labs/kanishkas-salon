import { redirect } from "next/navigation";

// /academy is not a standalone page — courses live under /services?cat=ACADEMY.
// This redirect ensures /academy never 404s and external links work correctly.
export default function AcademyPage() {
    redirect("/services?cat=ACADEMY");
}
