import { getDictionary } from "@/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  const dict = getDictionary();
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-primary">{dict.admin.loginTitle}</h2>
      </CardHeader>
      <CardContent>
        <AdminLoginForm
          labels={{
            email: dict.admin.email,
            password: dict.admin.password,
            submit: dict.admin.submit,
            required: dict.admin.required,
            success: dict.admin.success,
            failure: dict.admin.failure,
            networkError: dict.admin.networkError
          }}
        />
      </CardContent>
    </Card>
  );
}
