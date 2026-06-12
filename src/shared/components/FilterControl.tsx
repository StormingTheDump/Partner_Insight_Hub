import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type SelectOption = {
  label: string;
  value: string;
};

export function SelectFilter({
  icon,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { icon?: ReactNode; options: SelectOption[] }) {
  return (
    <label className="filter-control">
      {icon}
      <select {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SearchFilter({ icon, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return (
    <label className="filter-control">
      {icon}
      <input type="search" {...props} />
    </label>
  );
}

