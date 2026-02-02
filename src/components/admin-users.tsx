"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminUsers() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [years, setYears] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const search = () => {
    fetch(`/api/admin/users?query=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setUsers(data.users ?? []));
  };

  useEffect(() => {
    search();
  }, []);

  const renew = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, years })
    });
    search();
  };

  const toggleSuspend = async (userId: string, suspended: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, suspend: !suspended })
    });
    search();
  };

  const resetPassword = async (userId: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, reset_password: true })
    });
    const data = await res.json();
    if (res.ok && data.temp_password) {
      setMessage(`Temp password: ${data.temp_password}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search email" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={search}>Search</Button>
        <Input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} />
      </div>
      {message && <p className="text-sm text-slate-500">{message}</p>}
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Personal Email</th>
              <th className="p-3">Edu Email</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="p-3">{user.personal_email}</td>
                <td className="p-3">{user.edu_email}</td>
                <td className="p-3">{user.expires_at}</td>
                <td className="p-3">{user.is_suspended ? "Suspended" : user.status}</td>
                <td className="p-3 flex gap-2">
                  <Button size="sm" onClick={() => renew(user.id)}>Renew</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleSuspend(user.id, user.is_suspended)}>
                    {user.is_suspended ? "Unsuspend" : "Suspend"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resetPassword(user.id)}>
                    Reset Password
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
