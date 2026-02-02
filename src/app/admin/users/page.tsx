import { AdminNav } from "@/components/admin-nav";
import { AdminUsers } from "@/components/admin-users";

export default function AdminUsersPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary">Users</h2>
      <AdminNav />
      <AdminUsers />
    </div>
  );
}
