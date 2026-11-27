import { STATUS_OPTIONS } from "./StatusPill";

type Opt = { value: string; label: string };

export function TextField(p: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  maxLength?: number;
  hint?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  return (
    <div className="field">
      <label htmlFor={p.name}>{p.label}{p.required ? " *" : ""}</label>
      <input
        id={p.name}
        name={p.name}
        type={p.type ?? "text"}
        defaultValue={p.defaultValue ?? ""}
        required={p.required}
        maxLength={p.maxLength}
        placeholder={p.placeholder}
        autoComplete={p.autoComplete}
        inputMode={p.inputMode}
      />
      {p.hint && <span className="hint">{p.hint}</span>}
    </div>
  );
}

export function TextArea(p: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={p.name}>{p.label}{p.required ? " *" : ""}</label>
      <textarea id={p.name} name={p.name} defaultValue={p.defaultValue ?? ""} required={p.required} maxLength={p.maxLength} />
      {p.hint && <span className="hint">{p.hint}</span>}
    </div>
  );
}

export function SelectField(p: { name: string; label: string; options: Opt[]; defaultValue?: string; required?: boolean; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={p.name}>{p.label}{p.required ? " *" : ""}</label>
      <select id={p.name} name={p.name} defaultValue={p.defaultValue} required={p.required}>
        {p.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {p.hint && <span className="hint">{p.hint}</span>}
    </div>
  );
}

export function StatusField({ defaultValue = "active" }: { defaultValue?: string }) {
  return <SelectField name="status" label="Status" options={STATUS_OPTIONS} defaultValue={defaultValue} required />;
}

export function CheckboxField(p: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <div className="field field-check">
      <label htmlFor={p.name}>
        <input id={p.name} name={p.name} type="checkbox" defaultChecked={p.defaultChecked} /> {p.label}
      </label>
      {p.hint && <span className="hint">{p.hint}</span>}
    </div>
  );
}
