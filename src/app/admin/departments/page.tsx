import { getDepartmentTree, getAllDepartments } from "@/app/actions";
import { DepartmentManager } from "@/components/admin/DepartmentManager";

export const dynamic = "force-dynamic";

export default async function AdminDepartmentsPage() {
  const [tree, allDepartments] = await Promise.all([
    getDepartmentTree(),
    getAllDepartments(),
  ]);

  return (
    <div>
      <DepartmentManager tree={tree} allDepartments={allDepartments} />
    </div>
  );
}
