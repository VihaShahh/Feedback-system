import type { Feedback } from "../types";
export function ConflictPanel({
  latest,
  useLatest,
  keepLocal,
}: {
  latest: Feedback;
  useLatest: () => void;
  keepLocal: () => void;
}) {
  return (
    <div className="notice info" role="alert">
      <div>
        <strong>
          A newer version was saved. Your current edits are still here.
        </strong>
        <p className="tiny">
          Review version {latest.version} before choosing how to continue.
        </p>
        <div className="revision">
          <h3>Latest strengths</h3>
          <p>{latest.strengths}</p>
          <h3>Latest areas to develop</h3>
          <p>{latest.improvements}</p>
        </div>
        <div className="form-actions left">
          <button type="button" className="button small" onClick={useLatest}>
            Use latest version
          </button>
          <button type="button" className="button small" onClick={keepLocal}>
            Keep my edits for review
          </button>
        </div>
      </div>
    </div>
  );
}
