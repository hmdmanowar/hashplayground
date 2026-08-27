import { GitBranchIcon, CheckCircleIcon, XIcon } from "../../../components/Icons/Icons";
import type { PendingUpdateRequest } from "../../../services/versionService";

interface PendingUpdateBannerProps {
  request: PendingUpdateRequest;
  isTopAdmin: boolean;
  isResolving: boolean;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
}

// Shown at the top of the Playground while a lower-level admin's update
// request is awaiting the top admin's decision — the "open PR" state. See
// versions.service.ts's requestUpdate/resolveUpdateRequest.
function PendingUpdateBanner({ request, isTopAdmin, isResolving, onReview, onApprove, onReject }: PendingUpdateBannerProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <GitBranchIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p>
          <span className="font-medium">{request.requestedByUsername}</span> requested an update on{" "}
          {new Date(request.createdAt).toLocaleString()}
          {!isTopAdmin && " — waiting for the top admin to review it."}
        </p>
      </div>
      {isTopAdmin && (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onReview}
            className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-primary)]"
          >
            Review changes
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={isResolving}
            className="flex cursor-pointer items-center gap-1 rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XIcon className="h-3.5 w-3.5" />
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={isResolving}
            className="flex cursor-pointer items-center gap-1 rounded-full bg-[var(--color-primary-strong)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Approve
          </button>
        </div>
      )}
    </div>
  );
}

export default PendingUpdateBanner;
