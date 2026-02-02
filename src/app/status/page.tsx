import { StatusPanel } from "@/components/status-panel";

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-primary">System Status</h2>
      <p className="text-sm text-slate-500">
        检查环境变量、Supabase 连接、数据库初始化与 Auth Redirect URL 配置。
      </p>
      <StatusPanel />
    </div>
  );
}
