import { Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ApiError } from "../api";
import { useAction } from "../hooks";
import { useSession } from "../session";
import { ErrorPanel } from "../components/ErrorPanel";
export function ExportButton() {
  const { session } = useSession();
  const [params] = useSearchParams();
  const action = useAction();
  if (!session?.capabilities.feedback_export) return null;
  async function download() {
    const filters = new URLSearchParams();
    for (const key of ["month", "cycle_id"])
      if (params.get(key)) filters.set(key, params.get(key)!);
    const response = await fetch("/api/v1/reports/feedback.csv?" + filters, {
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      if (response.status === 401)
        window.dispatchEvent(new Event("session-expired"));
      throw new ApiError(
        data?.error?.message || "The export could not be prepared.",
        response.status,
      );
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = "feedback.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div>
      <button
        className="button"
        disabled={action.busy}
        onClick={() => void action.run(download)}
      >
        <Download size={15} />
        {action.busy ? "Preparing…" : "Export CSV"}
      </button>
      <ErrorPanel error={action.error} />
    </div>
  );
}
