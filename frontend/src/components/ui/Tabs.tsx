export interface TabOption<T extends string> {
    id: T;
    label: string;
}

interface TabsProps<T extends string> {
    options: TabOption<T>[];
    activeTab: T;
    onChange: (id: T) => void;
}

export const Tabs = <T extends string>({ options, activeTab, onChange }: TabsProps<T>) => (
    <div className="flex gap-2 bg-surface p-1 rounded-full border border-surface-hover flex-1">
        {options.map((option) => (
            <button
                key={option.id}
                onClick={() => onChange(option.id)}
                className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${activeTab === option.id ? "bg-brand text-white shadow-md" : "text-text-muted"
                    }`}
            >
                {option.label}
            </button>
        ))}
    </div>
);
