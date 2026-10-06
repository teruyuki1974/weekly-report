import { getUsers, getAllDepartments } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { UserManager } from "@/components/admin/UserManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, departments, currentUser] = await Promise.all([
    getUsers(),
    getAllDepartments(),
    getCurrentUser(),
  ]);

  return (
    <div>
      <UserManager
        users={users}
        departments={departments}
        currentUserId={currentUser!.id}
      />
    </div>
  );
}
