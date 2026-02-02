import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="mb-6 flex flex-wrap gap-4 text-sm">
      <Link href="/admin" className="text-primary hover:underline">Overview</Link>
      <Link href="/admin/codes" className="text-primary hover:underline">Codes</Link>
      <Link href="/admin/users" className="text-primary hover:underline">Users</Link>
      <Link href="/admin/audit" className="text-primary hover:underline">Audit</Link>
    </nav>
  );
}
