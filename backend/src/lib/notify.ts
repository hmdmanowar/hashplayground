import type { Prisma } from '@prisma/client'

// Fans out an internal 'activity' notification to every admin except the
// acting user — shared by project create/update/export, since none of them
// should route through the admin-only POST /notifications endpoint (that's
// for admin-composed messages only).
export async function notifyOtherAdmins(
  tx: Prisma.TransactionClient,
  actingUsername: string,
  message: string,
  link?: string,
): Promise<void> {
  const otherAdmins = await tx.user.findMany({ where: { role: 'admin', username: { not: actingUsername } } })
  if (otherAdmins.length === 0) return

  await tx.notification.createMany({
    data: otherAdmins.map((admin) => ({
      toUsername: admin.username,
      fromUsername: actingUsername,
      kind: 'activity' as const,
      message,
      link,
    })),
  })
}
