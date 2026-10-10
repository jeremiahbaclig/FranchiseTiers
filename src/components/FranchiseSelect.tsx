import { FRANCHISE_REGISTRY } from "../franchises/registry";

interface FranchiseSelectProps {
  onSelect: (franchiseId: string) => void;
}

/** Generated entirely from the franchise registry; never hardcode a specific franchise here. */
export function FranchiseSelect({ onSelect }: FranchiseSelectProps) {
  return (
    <div className="franchise-select">
      <h1>Choose a franchise</h1>
      <div className="franchise-select__grid">
        {FRANCHISE_REGISTRY.map((f) => (
          <button key={f.id} className="franchise-card" onClick={() => onSelect(f.id)}>
            {f.logoUrl && <img src={f.logoUrl} alt="" className="franchise-card__logo" />}
            <h2>{f.displayName}</h2>
            <p>{f.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
