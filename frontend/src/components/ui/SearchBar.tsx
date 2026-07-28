import { Search } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = "Hledat..." }: SearchBarProps) => (
    <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-surface py-4 pl-12 pr-4 rounded-3xl border border-surface-hover focus:outline-none focus:border-brand text-text-main transition-colors"
        />
    </div>
);
