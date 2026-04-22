import MotionWrapper from "./MotionWrapper";

interface SectionHeadingProps {
    title: string;
    subtitle?: string;
    accent?: string;
    centered?: boolean;
    light?: boolean;
    className?: string;
}

export default function SectionHeading({
    title,
    subtitle,
    accent,
    centered = true,
    light = false,
    className = "",
}: SectionHeadingProps) {
    return (
        <MotionWrapper className={`mb-12 ${centered ? "text-center" : ""} ${className}`}>
            {accent && (
                <span
                    className={`font-accent text-sm uppercase tracking-[0.3em] ${light ? "text-gold-light" : "text-gold"
                        } mb-2 block`}
                >
                    {accent}
                </span>
            )}
            <h2
                className={`font-display text-3xl sm:text-4xl lg:text-5xl font-bold ${light ? "text-cream" : "text-espresso"
                    } mb-4`}
            >
                {title}
            </h2>
            <div
                className={`gold-line ${centered ? "mx-auto" : ""} mb-4`}
            />
            {subtitle && (
                <p
                    className={`font-body text-base sm:text-lg max-w-2xl ${centered ? "mx-auto" : ""
                        } ${light ? "text-cream-dark" : "text-charcoal-light"}`}
                >
                    {subtitle}
                </p>
            )}
        </MotionWrapper>
    );
}
