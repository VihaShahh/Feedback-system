import { AlertCircle } from "lucide-react";
import { ApiError } from "../api";
export function ErrorPanel({
  error,
  retry,
}: {
  error?: Error;
  retry?: () => void;
}) {
  if (!error) return null;
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={19} />
      <div>
        <strong>{error.message}</strong>
        {error instanceof ApiError && error.fields.length > 0 && (
          <ul>
            {error.fields.map((field) => (
              <li key={field.field}>
                {field.field}: {field.message}
              </li>
            ))}
          </ul>
        )}
        {error instanceof ApiError && error.requestId && (
          <small>Reference: {error.requestId}</small>
        )}
        {retry && (
          <button className="text-button" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
