import React from "react";

export const Panel: React.FC<{
  title?: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, aside, className = "", children }) => (
  <section className={`panel ${className}`}>
    {(title || aside) && (
      <div className="panel-h">
        {title && <h2>{title}</h2>}
        {aside && <div className="aside">{aside}</div>}
      </div>
    )}
    {children}
  </section>
);

export const PageHead: React.FC<{ title: string; intro?: string; children?: React.ReactNode }> = ({
  title,
  intro,
  children,
}) => (
  <header className="page-head">
    <div>
      <h1>{title}</h1>
      {intro && <p>{intro}</p>}
    </div>
    {children && <div className="row">{children}</div>}
  </header>
);

export const Reading: React.FC<{ label: string; value: React.ReactNode; unit?: string; color?: string }> = ({
  label,
  value,
  unit,
  color,
}) => (
  <div className="reading">
    <div className="k">{label}</div>
    <div className={`v ${typeof value === "string" && value.length > 9 ? "long" : ""}`} style={color ? { color } : undefined}>
      {value}
      {unit && <small>{unit}</small>}
    </div>
  </div>
);

export const Readings: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="readings">{children}</div>
);

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Slider: React.FC<{
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}> = ({ label, value, display, min, max, step, onChange }) => (
  <label className="field">
    <span>
      {label} <b>{display}</b>
    </span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
  </label>
);

export const Status: React.FC<{ msg: string; error?: boolean }> = ({ msg, error }) =>
  msg ? (
    <div className={`status ${error ? "err" : ""}`} role="status">
      {msg}
    </div>
  ) : null;

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="empty">{children}</div>;

export const fmt = (n: number | null | undefined, digits = 1) =>
  n === null || n === undefined || Number.isNaN(n) ? "–" : n.toFixed(digits);

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

// Recharts styling shared by every figure
export const chart = {
  axis: { stroke: "#8a7f98", fontSize: 12, tickLine: false },
  grid: "#e9e1e8",
  tooltip: {
    contentStyle: {
      background: "#fbf9fb",
      border: "1px solid #c6b7c4",
      borderRadius: 8,
      fontSize: 13,
      color: "#231a3d",
    },
  },
  exc: "#4a3aa8",
  inh: "#c42f63",
  spike: "#d99a06",
  ok: "#23775a",
  ink: "#231a3d",
};
