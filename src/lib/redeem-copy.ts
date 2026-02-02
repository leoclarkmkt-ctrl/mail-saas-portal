export type RedeemStatusKey = "idle" | "validating" | "submitting" | "success" | "error";

export type RedeemMessageKey =
  | "required_activation_code"
  | "required_personal_email"
  | "required_username"
  | "invalid_username"
  | "required_password"
  | "invalid_email"
  | "invalid_password_rules"
  | "verifying"
  | "submit_success"
  | "submit_failed_generic"
  | "network_error"
  | "healthCheckFailed"
  | "healthDbUnavailable"
  | "healthDbUnavailableHint"
  | "requestTimeout"
  | "serverReturnedNonJson"
  | "serverErrorPrefix";

export type RedeemCopy = {
  title: string;
  fields: {
    activationCode: string;
    activationCodePlaceholder: string;
    activationCodeHelp: string;
    personalEmail: string;
    personalEmailHelp: string;
    eduUsername: string;
    eduUsernameHelp: string;
    password: string;
    passwordHelp: string;
  };
  buttons: {
    submit: string;
  };
  successTitle: string;
  submitFailedGeneric: string;
  serverErrorPrefix: string;
  dashboard: string;
  copyInfo: string;
  webmail: string;
  expiresAt: string;
  copied: string;
  eduEmail: string;
  status: Record<RedeemStatusKey, string>;
  messages: Record<RedeemMessageKey, string>;
};

const zh: RedeemCopy = {
  title: "使用身份编码开通您的教育邮箱",
  fields: {
    activationCode: "身份编码",
    activationCodePlaceholder: "请输入身份编码",
    activationCodeHelp: "用于开通或续期您的 NSUK 教育邮箱",
    personalEmail: "个人邮箱",
    personalEmailHelp: "用于学生中心登录及密码找回",
    eduUsername: "教育邮箱用户名",
    eduUsernameHelp: "自定义您的教育邮箱前缀，例如 xxxx@nsuk.edu.kg",
    password: "密码",
    passwordHelp: "密码至少 8 位，且必须包含大写字母、小写字母、数字和特殊字符"
  },
  buttons: {
    submit: "立即开通教育邮箱"
  },
  successTitle: "开通成功",
  submitFailedGeneric: "提交失败，请检查信息后重试。",
  serverErrorPrefix: "服务器返回：",
  dashboard: "进入控制台",
  copyInfo: "复制登录信息",
  webmail: "教育邮箱登录地址",
  expiresAt: "到期时间",
  copied: "已复制",
  eduEmail: "教育邮箱",
  status: {
    idle: "待提交",
    validating: "校验中",
    submitting: "提交中",
    success: "提交成功",
    error: "提交失败"
  },
  messages: {
    required_activation_code: "请输入身份编码",
    required_personal_email: "请输入个人邮箱",
    required_username: "请输入教育邮箱用户名",
    invalid_username: "用户名仅允许字母、数字、点、下划线或短横线，长度 3-32 位",
    required_password: "请输入密码",
    invalid_email: "邮箱格式不正确",
    invalid_password_rules: "密码规则不符合要求",
    verifying: "校验中",
    submit_success: "提交成功",
    submit_failed_generic: "提交失败，请检查信息后重试。",
    network_error: "网络异常，请稍后重试。",
    healthCheckFailed: "健康检查失败，请稍后重试。",
    healthDbUnavailable: "数据库连接不可用。",
    healthDbUnavailableHint: "请联系管理员检查 Supabase 环境变量与数据库 schema。",
    requestTimeout: "请求超时，请稍后重试。",
    serverReturnedNonJson: "服务器返回了非预期响应。",
    serverErrorPrefix: "服务器返回："
  }
};

const en: RedeemCopy = {
  title: "Activate your Education Email with an Identity Code",
  fields: {
    activationCode: "Identity Code",
    activationCodePlaceholder: "Enter your identity code",
    activationCodeHelp: "Used to activate or renew your NSUK education email.",
    personalEmail: "Personal Email",
    personalEmailHelp: "Used for student console login and password recovery.",
    eduUsername: "Education Email Username",
    eduUsernameHelp: "Customize your education email prefix, e.g. xxxx@nsuk.edu.kg",
    password: "Password",
    passwordHelp: "Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters."
  },
  buttons: {
    submit: "Activate"
  },
  successTitle: "Activation Successful",
  submitFailedGeneric: "Submission failed. Please review your details and try again.",
  serverErrorPrefix: "Server: ",
  dashboard: "Go to Dashboard",
  copyInfo: "Copy Login Info",
  webmail: "Webmail Address",
  expiresAt: "Expires At",
  copied: "Copied",
  eduEmail: "Education Email",
  status: {
    idle: "Idle",
    validating: "Validating",
    submitting: "Submitting",
    success: "Success",
    error: "Error"
  },
  messages: {
    required_activation_code: "Please enter your identity code.",
    required_personal_email: "Please enter your personal email.",
    required_username: "Please enter your education email username.",
    invalid_username:
  "Username must be 3-32 characters and use letters, numbers, dot, underscore, or hyphen only.",
    required_password: "Please enter your password.",
    invalid_email: "Invalid email format.",
    invalid_password_rules: "Password does not meet the required rules.",
    verifying: "Verifying",
    submit_success: "Submission successful.",
    submit_failed_generic: "Submission failed. Please review your details and try again.",
    network_error: "Network error. Please try again.",
    healthCheckFailed: "Health check failed. Please try again.",
    healthDbUnavailable: "Database connection is unavailable.",
    healthDbUnavailableHint: "Please contact the administrator to check Supabase env and schema.",
    requestTimeout: "Request timed out. Please try again.",
    serverReturnedNonJson: "Server returned a non-JSON response.",
    serverErrorPrefix: "Server: "
  }
};

export function getRedeemCopy(locale: "en" | "zh"): RedeemCopy {
  return locale === "zh" ? zh : en;
}
