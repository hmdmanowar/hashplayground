import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  listUsers,
  blockUser,
  unblockUser,
  removeUserAccount,
  deleteProjectsForUser,
  setUserRole,
  hasOtherActiveAdmin,
  isTopAdmin,
  ADMIN_USERS_CACHE_KEY,
  type UserSummary,
} from '../../services/userService'
import {
  sendNotification,
  listAllNotifications,
  BROADCAST_RECIPIENT,
  type Notification,
} from '../../services/notificationService'
import {
  BanIcon,
  CheckCircleIcon,
  ShieldIcon,
  TrashIcon,
  FolderMinusIcon,
  CrownIcon,
  BellIcon,
  ClockIcon,
} from '../../components/Icons/Icons'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import NotifyDialog from '../../components/NotifyDialog/NotifyDialog'
import { usePageHeaderActions } from '../../hooks/usePageHeaderActions'
import RowActionsMenu, {
  menuItemClass,
  menuItemDangerClass,
  menuIconClass,
} from '../../components/RowActionsMenu/RowActionsMenu'
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay'
import { getCached, setCached } from '../../lib/dataCache'

type DialogRequest =
  | { kind: 'confirm'; title: string; message: string; onConfirm: () => void }
  | { kind: 'notify'; target: string; targetLabel: string }
  | { kind: 'notifyHistory' }
  | null

function NotificationHistoryDialog({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[] | null>(null)

  useEffect(() => {
    listAllNotifications().then((all) => setNotifications(all.filter((entry) => entry.kind !== 'activity')))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Notification history</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Messages and alerts sent by admins</p>

        <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-[var(--border-panel)]">
          {notifications === null ? (
            <LoadingOverlay compact />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-app)]">
                <tr>
                  <th className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 font-medium">To</th>
                  <th className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 font-medium">From</th>
                  <th className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 font-medium">Kind</th>
                  <th className="px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 font-medium">Message</th>
                  <th className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 font-medium">Sent at</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((entry) => (
                  <tr key={entry.id} className="border-t border-[var(--border-panel)]">
                    <td className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1">
                      {entry.toUsername === BROADCAST_RECIPIENT ? 'All users' : entry.toUsername}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 text-[var(--color-muted)]">
                      {entry.fromUsername}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 capitalize text-[var(--color-muted)]">
                      {entry.kind}
                    </td>
                    <td className="max-w-[280px] truncate px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1" title={entry.message}>
                      {entry.message}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 max-[1281px]:px-2 max-[1281px]:py-1 text-[var(--color-muted)]">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {notifications !== null && notifications.length === 0 && (
            <p className="px-3 py-4 text-sm text-[var(--color-muted)]">No notifications sent yet</p>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const HIERARCHY_TOOLTIP = 'Only the top admin can manage other admins'

function AdminDashboard() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const cachedUsers = getCached<UserSummary[]>(ADMIN_USERS_CACHE_KEY)
  const [users, setUsers] = useState<UserSummary[]>(cachedUsers ?? [])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(cachedUsers ? 'ready' : 'loading')
  const [dialog, setDialog] = useState<DialogRequest>(null)

  usePageHeaderActions(
    user ? (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDialog({ kind: 'notifyHistory' })}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
        >
          <ClockIcon className="h-3.5 w-3.5" />
          Notification history
        </button>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'notify', target: BROADCAST_RECIPIENT, targetLabel: 'all users' })}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--color-primary-strong)] px-4 py-2 max-[1281px]:px-3 max-[1281px]:py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          <BellIcon className="h-3.5 w-3.5" />
          Notify all users
        </button>
      </div>
    ) : null,
  )

  async function refreshUsers() {
    try {
      const data = await listUsers()
      setCached(ADMIN_USERS_CACHE_KEY, data)
      setUsers(data)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    refreshUsers()
  }, [])

  if (!user) return null
  if (status === 'loading') return <LoadingOverlay />
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-panel)] p-10 text-center">
        <p className="text-sm text-[var(--color-muted)]">Couldn't load users.</p>
        <button
          type="button"
          onClick={refreshUsers}
          className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Retry
        </button>
      </div>
    )
  }

  const currentUsername = user.username
  const iAmTopAdmin = isTopAdmin(users, currentUsername)
  const totalProjects = users.reduce((sum, entry) => sum + entry.projectCount, 0)

  async function handleToggleBlock(entry: UserSummary) {
    try {
      if (entry.blocked) await unblockUser(entry.username)
      else await blockUser(entry.username)
      await refreshUsers()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update this user')
    }
  }

  async function handleMakeAdmin(entry: UserSummary) {
    try {
      await setUserRole(entry.username, 'admin')
      await refreshUsers()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update this user')
    }
  }

  async function handleDemote(entry: UserSummary) {
    try {
      await setUserRole(entry.username, 'user')
      if (entry.username === currentUsername) await refreshUser()
      await refreshUsers()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update this user')
    }
  }

  function handleDeleteAccount(entry: UserSummary) {
    const isSelf = entry.username === currentUsername
    // Display-only — the backend independently resolves and enforces the
    // real transfer target; this is just so the confirm message is specific.
    const transferToLabel = isSelf
      ? users.find((u) => u.username !== currentUsername && u.role === 'admin' && !u.blocked)?.username
      : currentUsername

    setDialog({
      kind: 'confirm',
      title: 'Delete account',
      message: isSelf
        ? `Delete your own account? Your projects will transfer to "${transferToLabel ?? 'another admin'}" and you'll be logged out immediately.`
        : `Delete the account "${entry.username}"? Any projects they own will be transferred to your account (${currentUsername}).`,
      onConfirm: async () => {
        try {
          await removeUserAccount(entry.username)
          setDialog(null)
          if (isSelf) {
            await logout()
            navigate('/login', { replace: true })
          } else {
            await refreshUsers()
          }
        } catch (error) {
          setDialog(null)
          showToast(error instanceof Error ? error.message : 'Could not delete this account')
        }
      },
    })
  }

  function handleDeleteProjects(entry: UserSummary) {
    setDialog({
      kind: 'confirm',
      title: 'Delete all projects',
      message: `Delete all ${entry.projectCount} project${entry.projectCount === 1 ? '' : 's'} owned by "${entry.username}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteProjectsForUser(entry.username)
          await refreshUsers()
          setDialog(null)
        } catch (error) {
          setDialog(null)
          showToast(error instanceof Error ? error.message : 'Could not delete these projects')
        }
      },
    })
  }

  async function handleSendNotification(kind: 'message' | 'alert', message: string) {
    if (dialog?.kind !== 'notify') return
    try {
      await sendNotification(dialog.target, kind, message)
      setDialog(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not send notification')
    }
  }

  return (
    <div>
      {dialog?.kind === 'confirm' && (
        <ConfirmDialog
          open
          title={dialog.title}
          message={dialog.message}
          confirmLabel="Delete"
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'notify' && (
        <NotifyDialog
          targetLabel={dialog.targetLabel}
          onSend={handleSendNotification}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'notifyHistory' && <NotificationHistoryDialog onClose={() => setDialog(null)} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Total users</p>
          <p className="mt-1 text-2xl font-semibold">{users.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Total projects</p>
          <p className="mt-1 text-2xl font-semibold">{totalProjects}</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--border-panel)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-panel)]">
            <tr>
              <th className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">Username</th>
              <th className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">Role</th>
              <th className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">Joined</th>
              <th className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">Projects</th>
              <th className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">Status</th>
              <th className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((entry) => {
              const isSelf = entry.username === currentUsername
              const selfDeleteBlocked = isSelf && !hasOtherActiveAdmin(users, currentUsername)
              const targetIsAdmin = entry.role === 'admin'
              const restrictedByHierarchy = targetIsAdmin && !isSelf && !iAmTopAdmin
              const targetIsTopAdmin = targetIsAdmin && isTopAdmin(users, entry.username)
              const selfDemoteBlocked = isSelf && targetIsTopAdmin && !hasOtherActiveAdmin(users, currentUsername)
              const demoteDisabled = targetIsTopAdmin ? !isSelf || selfDemoteBlocked : !iAmTopAdmin
              const demoteTooltip = targetIsTopAdmin
                ? isSelf
                  ? selfDemoteBlocked
                    ? 'Promote another user to admin first'
                    : undefined
                  : 'The top admin can only be demoted by themself'
                : !iAmTopAdmin
                  ? HIERARCHY_TOOLTIP
                  : undefined

              const isTargetTopAdmin = targetIsAdmin && isTopAdmin(users, entry.username)

              return (
                <tr
                  key={entry.username}
                  className={`border-t border-[var(--border-panel)] ${
                    isTargetTopAdmin ? 'bg-[var(--color-accent-soft)]' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 font-medium">{entry.username}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">
                    <span
                      className="flex items-center gap-1.5"
                      title={isTargetTopAdmin ? 'Top admin — has superior authority over other admins' : undefined}
                    >
                      {isTargetTopAdmin && <CrownIcon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />}
                      <span className="capitalize">{entry.role}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">
                    {new Date(entry.joinedAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5 text-[var(--color-muted)]">{entry.projectCount}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5">
                    <span
                      className="rounded-full border px-2 py-0.5 text-xs"
                      style={
                        entry.blocked
                          ? { color: '#ef4444', borderColor: '#ef4444' }
                          : { color: '#22c55e', borderColor: '#22c55e' }
                      }
                    >
                      {entry.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 max-[1281px]:px-2.5 max-[1281px]:py-1.5">
                    <RowActionsMenu>
                      <button
                        type="button"
                        onClick={() =>
                          setDialog({ kind: 'notify', target: entry.username, targetLabel: entry.username })
                        }
                        className={menuItemClass}
                      >
                        <BellIcon className={menuIconClass} />
                        Notify
                      </button>
                      <button
                        type="button"
                        disabled={isSelf || restrictedByHierarchy}
                        title={restrictedByHierarchy ? HIERARCHY_TOOLTIP : undefined}
                        onClick={() => handleToggleBlock(entry)}
                        className={menuItemClass}
                      >
                        {entry.blocked ? (
                          <CheckCircleIcon className={menuIconClass} />
                        ) : (
                          <BanIcon className={menuIconClass} />
                        )}
                        {entry.blocked ? 'Unblock' : 'Block'}
                      </button>
                      {targetIsAdmin ? (
                        (!isSelf || targetIsTopAdmin) && (
                          <button
                            type="button"
                            disabled={demoteDisabled}
                            title={demoteTooltip}
                            onClick={() => handleDemote(entry)}
                            className={menuItemClass}
                          >
                            <ShieldIcon className={menuIconClass} />
                            Demote
                          </button>
                        )
                      ) : (
                        <button type="button" onClick={() => handleMakeAdmin(entry)} className={menuItemClass}>
                          <ShieldIcon className={menuIconClass} />
                          Make admin
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={selfDeleteBlocked || restrictedByHierarchy}
                        title={
                          restrictedByHierarchy
                            ? HIERARCHY_TOOLTIP
                            : selfDeleteBlocked
                              ? 'Promote another user to admin first'
                              : undefined
                        }
                        onClick={() => handleDeleteAccount(entry)}
                        className={menuItemDangerClass}
                      >
                        <TrashIcon className={menuIconClass} />
                        Delete account
                      </button>
                      <button
                        type="button"
                        disabled={entry.projectCount === 0 || restrictedByHierarchy}
                        title={restrictedByHierarchy ? HIERARCHY_TOOLTIP : undefined}
                        onClick={() => handleDeleteProjects(entry)}
                        className={menuItemDangerClass}
                      >
                        <FolderMinusIcon className={menuIconClass} />
                        Delete projects
                      </button>
                    </RowActionsMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard
