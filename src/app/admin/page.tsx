import { AdminNav } from "@/components/admin-nav";
import { AdminSummary } from "@/components/admin-summary";

export default function AdminPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary">Admin Overview</h2>
      <AdminNav />
      <AdminSummary />
    </div>
  );
}
