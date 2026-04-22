import SessionProvider from "@/components/providers/SessionProvider";

export const metadata = {
    title: "Book Appointment | Kanishka's Family Salon & Academy",
    description: "Book your appointment online at Kanishka's Family Salon & Academy, Indore. Choose your preferred service, staff, date and time.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}
