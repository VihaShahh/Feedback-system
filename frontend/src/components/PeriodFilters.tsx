import { useSearchParams } from "react-router-dom";
import { useQuery } from "../hooks";
import type { Cycle } from "../types";
import { Input, Select } from "./Fields";
export function PeriodFilters() {
  const [params, setParams] = useSearchParams();
  const cycles = useQuery<{ items: Cycle[] }>("/cycles");
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  }
  return (
    <div className="filter-bar">
      <Input
        label="Conversation month"
        type="month"
        value={params.get("month") || ""}
        onChange={(event) => change("month", event.target.value)}
      />
      <Select
        label="Review cycle"
        value={params.get("cycle_id") || ""}
        onChange={(event) => change("cycle_id", event.target.value)}
      >
        <option value="">All review cycles</option>
        {cycles.data?.items.map((cycle) => (
          <option key={cycle.id} value={cycle.id}>
            {cycle.name}
          </option>
        ))}
      </Select>
      {params.size > 0 && (
        <button className="button" onClick={() => setParams({})}>
          Clear filters
        </button>
      )}
    </div>
  );
}
