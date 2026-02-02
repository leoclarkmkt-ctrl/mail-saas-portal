"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (values: AdminLoginValues) => {
    setMessage(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Login failed");
      return;
    }
    window.location.href = "/admin";
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input type="email" {...form.register("email")} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" {...form.register("password")} />
      </div>
      <Button type="submit">Sign In</Button>
      {message && <p className="text-sm text-rose-500">{message}</p>}
    </form>
  );
}
