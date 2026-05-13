"use client";
import { usePublicSettings } from "@/hooks/usePublicSettings";

export default function WhatsAppLink({ className, children }: { className?: string; children: React.ReactNode }) {
    const { settings } = usePublicSettings();
    const whatsappNumber = settings.whatsappNumber || "919171230292";
    return (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
        </a>
    );
}