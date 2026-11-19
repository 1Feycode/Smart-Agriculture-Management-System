import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  description?: string
  error?: string
}

export function FormField({
  id,
  label,
  description,
  error,
  required,
  ...inputProps
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [inputProps['aria-describedby'], descriptionId, errorId]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true" className="form-field__required"> *</span>}
      </label>
      {description && <p id={descriptionId} className="form-field__description">{description}</p>}
      <input
        {...inputProps}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {error && <p id={errorId} className="form-field__error">{error}</p>}
    </div>
  )
}
