import { auth } from "@/auth"
import { UserMenuButton } from "@/components/features/layout/user-menu-button"

export async function UserMenu() {
  const session = await auth()
  if (!session?.user) return null
  const email = session.user.email ?? ""
  return <UserMenuButton name={session.user.name ?? email} email={email} />
}
