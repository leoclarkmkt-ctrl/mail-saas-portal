export type RedeemStatusKey = "idle" | "validating" | "submitting" | "success" | "error";

export type RedeemCopy = {
  title: string;
  activationCode: string;
  activationCodePlaceholder: string;
  activationCodeHelp: string;
  personalEmail: string;
  personalEmailHelp: string;
  eduUsername: string;
  eduUsernameHelp: string;
  password: string;
  passwordHelp: string;
  submit: string;
  submitting: string;
  successTitle: string;
  submitSuccess: string;
  submitFailedGeneric: string;
  networkError: string;
  serverErrorPrefix: string;
  dashboard: string;
  copyInfo: string;
  webmail: string;
  expiresAt: string;
  copied: string;
  eduEmail: string;
  status: Record<RedeemStatusKey, string>;
  errors: {
    required_activation_code: string;
    required_personal_email: string;
    required_username: string;
    required_password: string;
    invalid_email: string;
    invalid_password_rules: string;
  };
};

const zh: RedeemCopy = {
  title: "使用身份编码开通您的教育邮箱",
  activationCode: "身份编码",
  activationCodePlaceholder: "请输入身份编码",
  activationCodeHelp: "用于开通或续期您的 NSUK 教育邮箱",
  personalEmail: "个人邮箱",
  personalEmailHelp: "用于学生中心登录及密码找回",
  eduUsername: "教育邮箱用户名",
  eduUsernameHelp: "自定义您的教育邮箱前缀，例如 xxxx@nsuk.edu.kg",
  password: "密码",
  passwordHelp: "密码至少 8 位，且必须包含大写字母、小写字母、数字和特殊字符",
  submit: "立即开通教育邮箱",
  submitting: "正在提交...",
  successTitle: "开通成功",
  submitSuccess: "提交成功",
  submitFailedGeneric: "提交失败，请检查信息后重试。",
  networkError: "网络异常，请稍后重试。",
  serverErrorPrefix: "服务器返回：",
  dashboard: "进入控制台",
  copyInfo: "复制登录信息",
  webmail: "Webmail 地址",
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
  errors: {
    required_activation_code: "请输入身份编码",
    required_personal_email: "请输入个人邮箱",
    required_username: "请输入教育邮箱用户名",
    required_password: "请输入密码",
    invalid_email: "邮箱格式不正确",
    invalid_password_rules: "密码规则不符合要求"
  }
};

const en: RedeemCopy = {
  title: "Activate your Education Email with an Identity Code",
  activationCode: "Identity Code",
  activationCodePlaceholder: "Enter your identity code",
  activationCodeHelp: "Used to activate or renew your NSUK education email.",
  personalEmail: "Personal Email",
  personalEmailHelp: "Used for student console login and password recovery.",
  eduUsername: "Education Email Username",
  eduUsernameHelp: "Customize your education email prefix, e.g. xxxx@nsuk.edu.kg",
  password: "Password",
  passwordHelp: "Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.",
  submit: "Activate",
  submitting: "Submitting...",
  successTitle: "Activation Successful",
  submitSuccess: "Submission successful.",
  submitFailedGeneric: "Submission failed. Please review your details and try again.",
  networkError: "Network error. Please try again.",
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
  errors: {
    required_activation_code: "Please enter your identity code.",
    required_personal_email: "Please enter your personal email.",
    required_username: "Please enter your education email username.",
    required_password: "Please enter your password.",
    invalid_email: "Invalid email format.",
    invalid_password_rules: "Password does not meet the required rules."
  }
};

export function getRedeemCopy(locale: "en" | "zh"): RedeemCopy {
  return locale === "zh" ? zh : en;
}
