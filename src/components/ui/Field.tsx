import type { ReactNode } from "react";
import { FIELD, cx } from "@/lib/ui-recipes";

let seq = 0;

interface Props {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id?: string;
  children: (props: { id: string; className: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}

/**
 * A label wired to its input, every time.
 *
 * Fourteen input treatments existed across three label styles and five error
 * styles, and ten of the twenty-four inputs had no focus ring at all. The
 * render prop is so the caller still owns the element (input, textarea,
 * select) while the wiring, the classes and the error plumbing are not
 * optional.
 */
export default function Field({ label, hint, error, required, id, children }: Props) {
  const fieldId = id || `f${++seq}`;
  const msgId = error || hint ? `${fieldId}-msg` : undefined;

  return (
    <div>
      <label htmlFor={fieldId} className={FIELD.label}>
        {label}
        {required && <span className="text-alarm-ink"> *</span>}
      </label>
      {children({
        id: fieldId,
        className: cx(FIELD.input, error && FIELD.invalid),
        ...(error ? { "aria-invalid": true as const } : {}),
        ...(msgId ? { "aria-describedby": msgId } : {}),
      })}
      {error ? (
        <p id={msgId} className={FIELD.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className={FIELD.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { FIELD };
