import { Search } from "lucide-react";

type SearchInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search..."
}: SearchInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
      <Search className="h-4 w-4 text-slate-500" />
      <input
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
