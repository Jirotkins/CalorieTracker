interface SwitchProps {
    checked: boolean;
    onChange: () => void;
}

export const Switch = ({ checked, onChange }: SwitchProps) => {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shrink-0 ${checked ? "bg-brand" : "bg-surface-hover shadow-inner"
                }`}
        >
            <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0"
                    }`}
            />
        </button>
    );
};
