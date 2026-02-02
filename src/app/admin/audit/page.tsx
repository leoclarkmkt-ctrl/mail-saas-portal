import { AdminNav } from "@/components/admin-nav";
import { AdminAudit } from "@/components/admin-audit";

export default function AdminAuditPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary">Audit Logs</h2>
      <AdminNav />
      <AdminAudit />
    </div>
  );
}
