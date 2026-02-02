import { AdminNav } from "@/components/admin-nav";
import { AdminCodes } from "@/components/admin-codes";

export default function AdminCodesPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-primary">Activation Codes</h2>
      <AdminNav />
      <AdminCodes />
    </div>
  );
}
