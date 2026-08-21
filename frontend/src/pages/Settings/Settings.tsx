import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateOwnProfile, changeOwnPassword } from "../../services/userService";
import { PencilIcon } from "../../components/Icons/Icons";
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";
import { getProfileCompletionPercent } from "../../utils/profileCompletion";

interface EditableFieldProps {
  label: string
  value: string
  placeholder: string
  type?: string
  onSave: (value: string) => Promise<void>
}

function EditableField({ label, value, placeholder, type = "text", onSave }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(!value);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await onSave(draft.trim());
      setIsEditing(false);
      setStatus("Saved");
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-[var(--color-muted)]">{label}</span>
        <div className="flex items-center gap-2">
          <span>{value || "—"}</span>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setIsEditing(true);
            }}
            aria-label={`Edit ${label.toLowerCase()}`}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          {status && <span className="text-xs text-[var(--color-primary)]">{status}</span>}
        </div>
      </div>
    );
  }

  return (
    <form className="mt-3 flex flex-col gap-2" onSubmit={handleSubmit}>
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm text-[var(--color-muted)]">{label}</label>
          <input
            type={type}
            autoFocus
            className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm transition-colors"
            placeholder={placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
          >
            Cancel
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}

function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function resetPasswordForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  }

  if (!user) return null;

  const currentUser = user;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function handleSaveName(value: string) {
    await updateOwnProfile(currentUser.username, { name: value });
    await refreshUser();
  }

  async function handleSaveEmail(value: string) {
    await updateOwnProfile(currentUser.username, { email: value });
    await refreshUser();
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError("");
    setPasswordStatus("");

    if (!newPassword || newPassword.length < 4) {
      setPasswordError("New password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      await changeOwnPassword(currentUser.username, currentPassword, newPassword);
      resetPasswordForm();
      setIsEditingPassword(false);
      setPasswordStatus("Password updated");
      setTimeout(() => setPasswordStatus(""), 2000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Could not update password");
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
        <h2 className="font-medium">Account</h2>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">Profile completion</span>
          <span className="font-medium">{getProfileCompletionPercent(user)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-muted)]/20">
          <div
            className="h-full rounded-full bg-[var(--color-primary-strong)] transition-[width]"
            style={{ width: `${getProfileCompletionPercent(user)}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border-panel)] pt-3 text-sm">
          <span className="text-[var(--color-muted)]">Username</span>
          <span>{user.username}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">Role</span>
          <span className="capitalize">{user.role}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">Joined</span>
          <span>
            {user.joinedAt ? new Date(user.joinedAt).toLocaleString() : "—"}
          </span>
        </div>

        <div className="mt-2 border-t border-[var(--border-panel)] pt-1">
          <EditableField
            label="Name"
            value={user.name ?? ""}
            placeholder="Add your name"
            onSave={handleSaveName}
          />
          <EditableField
            label="Email"
            value={user.email ?? ""}
            placeholder="Add your email"
            type="email"
            onSave={handleSaveEmail}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
        <h2 className="font-medium">Change password</h2>
        {!isEditingPassword ? (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-[var(--color-muted)]">Password</span>
            <div className="flex items-center gap-2">
              <span>••••••••</span>
              <button
                type="button"
                onClick={() => setIsEditingPassword(true)}
                aria-label="Change password"
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--hover-overlay)] hover:text-[var(--color-primary)]"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              {passwordStatus && (
                <span className="text-xs text-[var(--color-primary)]">{passwordStatus}</span>
              )}
            </div>
          </div>
        ) : (
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={handleChangePassword}
          >
            <input
              type="password"
              autoFocus
              className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm transition-colors"
              placeholder="Current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <input
              type="password"
              className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm transition-colors"
              placeholder="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <input
              type="password"
              className="rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm transition-colors"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="cursor-pointer self-start rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                Update password
              </button>
              <button
                type="button"
                onClick={() => {
                  resetPasswordForm();
                  setIsEditingPassword(false);
                }}
                className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
        <h2 className="font-medium">Appearance</h2>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
        <h2 className="font-medium">Session</h2>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 cursor-pointer rounded-full border border-transparent bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[var(--color-primary)]"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default Settings;
