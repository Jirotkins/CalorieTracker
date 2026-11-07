// Zástupný blok při načítání — rozměry a tvar se předávají přes className
export function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`bg-surface animate-pulse ${className}`} aria-hidden="true" />;
}

// Seznam karet (jídla, recepty) — postupně slábne, ať to nepůsobí jako skutečný obsah
export function CardListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-3" aria-label="Načítám">
            {Array.from({ length: count }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-3xl" />
            ))}
        </div>
    );
}
