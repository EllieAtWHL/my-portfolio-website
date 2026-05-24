import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}

export function FormField({ label, required, htmlFor, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" htmlFor={htmlFor}>
        {label}{' '}
        {required ? (
          <span style={{ color: 'var(--spurs-dark-accent)' }} aria-hidden="true">*</span>
        ) : (
          <span className="text-gray-400">(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

interface TextInputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'date' | 'time';
  value: string | null | undefined;
  onChange: (value: string | undefined) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function TextInput({ 
  id, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false,
  className = '',
  placeholder 
}: TextInputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      required={required}
      aria-required={required}
      placeholder={placeholder}
      className={`w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text ${className}`}
    />
  );
}

interface NumberInputProps {
  id?: string;
  name?: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number | string;
  className?: string;
}

export function NumberInput({ 
  id, 
  name, 
  value, 
  onChange, 
  min, 
  max, 
  step,
  className = ''
}: NumberInputProps) {
  return (
    <input
      id={id}
      name={name}
      type="number"
      min={min}
      max={max}
      step={step}
      value={value === null || value === undefined ? '' : value}
      onChange={(e) => onChange(e.target.value !== '' ? (step === 'any' ? parseFloat(e.target.value) : parseInt(e.target.value)) : null)}
      className={`w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text ${className}`}
    />
  );
}

interface SelectInputProps {
  id?: string;
  name?: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string | number; label: string }>;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function SelectInput({ 
  id, 
  name, 
  value, 
  onChange, 
  options, 
  required = false,
  className = '',
  placeholder = 'Select option'
}: SelectInputProps) {
  return (
    <select
      id={id}
      name={name}
      value={value?.toString() || ''}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      aria-required={required}
      className={`w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface CheckboxInputProps {
  id?: string;
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function CheckboxInput({ 
  id, 
  name, 
  checked, 
  onChange, 
  label,
  className = ''
}: CheckboxInputProps) {
  return (
    <label className="flex items-center">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`mr-2 ${className}`}
        style={{ accentColor: 'var(--spurs-dark-accent)' }}
      />
      {label}
    </label>
  );
}

interface RadioGroupProps {
  name: string;
  value: string | boolean | null;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export function RadioGroup({ name, value, onChange, options, className = '' }: RadioGroupProps) {
  return (
    <div className={`flex space-x-4 ${className}`}>
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="mr-2"
            style={{ accentColor: 'var(--spurs-dark-accent)' }}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

interface TextAreaProps {
  id?: string;
  name?: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  rows?: number;
  className?: string;
}

export function TextArea({ 
  id, 
  name, 
  value, 
  onChange, 
  rows = 4,
  className = ''
}: TextAreaProps) {
  return (
    <textarea
      id={id}
      name={name}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      rows={rows}
      className={`w-full p-2 bg-gray-700 border border-gray-600 rounded text-white spurs-text ${className}`}
    />
  );
}
