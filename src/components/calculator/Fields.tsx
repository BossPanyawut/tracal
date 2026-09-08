import { useId } from "react";
export function NumberField({ label, ariaLabel, value, onChange, unit, help }: { label: string; ariaLabel?: string; value: string; onChange: (value: string) => void; unit: string; help?: string }) {
  const id = useId();
  return <label className="field-block"><span className="field-block-label">{label}</span><div className="field-block-row"><input aria-label={ariaLabel ?? label} aria-describedby={help ? id : undefined} inputMode="decimal" maxLength={33} placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} /><span className="unit-chip plain">{unit}</span></div>{help && <span id={id} className="help-text">{help}</span>}</label>;
}
