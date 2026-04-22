import { redirect } from "next/navigation";

// This route was a placeholder during development.
// Admin implementation tracking has been merged into the main admin dashboard.
export default function ImplementationPage() {
    redirect("/dashboard/admin");
}
