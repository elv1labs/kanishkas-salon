import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gift Vouchers | Kanishka's Family Salon & Academy",
    description: "Give the gift of beauty. Purchase a gift voucher for Kanishka's Family Salon & Academy, Indore. Valid for 12 months on all services.",
};

export default function GiftVouchersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
