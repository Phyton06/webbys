import React from 'react'

interface FilterOption {
  key: string
  label: string
  choices: Array<{ value: string; label: string }>
}

interface FilterBarProps {
  options: FilterOption[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}

export const FilterBar: React.FC<FilterBarProps> = ({
  options,
  values,
  onChange,
}) => {
  const handleSelectChange = (key: string, value: string) => {
    onChange({
      ...values,
      [key]: value,
    })
  }

  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-surface-elevated rounded-lg border border-border shadow-sm">
      {options.map((option) => (
        <div key={option.key} className="flex flex-col gap-1">
          <label
            htmlFor={option.key}
            className="text-xs font-semibold text-text-muted"
          >
            {option.label}
          </label>
          <select
            id={option.key}
            value={values[option.key] || ''}
            onChange={(e) => handleSelectChange(option.key, e.target.value)}
            className="px-3 py-1.5 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
          >
            {option.choices.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
