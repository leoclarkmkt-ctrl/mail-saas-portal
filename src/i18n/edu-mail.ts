export type EduMailLang = "en" | "zh";

type EduMailDict = {
  common: {
    switchToEn: string;
    switchToZh: string;
  };
  login: {
    eyebrow: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    signIn: string;
    signingIn: string;
    forgot: string;
    backHome: string;
    show: string;
    hide: string;
    agreement: string;
    loginFailed: string;
    academicYearNotRegistered: string;
  };
  errors: Record<string, string>;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cardTitle: string;
    cardBody: string;
    cardCta: string;
  };
  inbox: {
    title: string;
    refresh: string;
    refreshing: string;
    logout: string;
    loggingOut: string;
    expiresAtLabel: string;
    goDashboard: string;
    emptyTitle: string;
    emptyBody: string;
    from: string;
    subject: string;
    received: string;
    detailPlaceholderTitle: string;
    detailPlaceholderBody: string;
    noContent: string;
    emailContentTitle: string;
    unknownSender: string;
    noSubject: string;
    loading: string;
    failed: string;
  };
};

const en: EduMailDict = {
  common: {
    switchToEn: "English",
    switchToZh: "中文"
  },
  login: {
    eyebrow: "Education Mail",
    title: "Welcome Back",
    subtitle: "Please login below to continue",
    emailLabel: "User ID / Email",
    emailPlaceholder: "yourname@nsuk.edu.kg",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    signIn: "Sign In",
    signingIn: "Signing In...",
    forgot: "Forgot Password?",
    backHome: "Back to Home",
    show: "Show",
    hide: "Hide",
    agreement: "By signing in you agree to the campus email usage policy.",
    loginFailed: "Login failed. Please check your credentials.",
    academicYearNotRegistered:
      "Academic year not registered. Please register in the Student Dashboard."
  },
  errors: {
    unknown: "Login failed. Please try again.",
    login_edu_email_required: "Email is required.",
    login_edu_password_required: "Password is required.",
    login_edu_email_not_found: "This email does not exist. Please enter the correct email.",
    login_edu_password_invalid: "Incorrect password. Please check your password.",
    login_edu_academic_year_not_registered:
      "Academic year not registered. Please register in the Student Dashboard."
  },
  hero: {
    eyebrow: "NSUK Edu Mail",
    title: "A modern inbox built for next-generation campus workflows.",
    subtitle:
      "Stay connected with faculty announcements, class updates, and secure student communications from one intelligent portal.",
    cardTitle: "Need a new mailbox?",
    cardBody: "Claim your education email and manage renewals in the student dashboard.",
    cardCta: "Activate your edu account →"
  },
  inbox: {
    title: "My Inbox",
    refresh: "Refresh Mail",
    refreshing: "Refreshing...",
    logout: "Sign out",
    loggingOut: "Signing Out...",
    expiresAtLabel: "Expires",
    goDashboard: "Go to Student Dashboard",
    emptyTitle: "No messages yet",
    emptyBody: "Please click refresh to load your latest email messages.",
    from: "From",
    subject: "Subject",
    received: "Received",
    detailPlaceholderTitle: "Select an email to view details",
    detailPlaceholderBody: "Choose a message from the list to preview it here.",
    noContent: "No previewable content for this email.",
    emailContentTitle: "Email content",
    unknownSender: "Unknown",
    noSubject: "(No subject)",
    loading: "Loading...",
    failed: "Failed to load"
  }
};

const zh: EduMailDict = {
  common: {
    switchToEn: "English",
    switchToZh: "中文"
  },
  login: {
    eyebrow: "教育邮箱",
    title: "欢迎回来",
    subtitle: "请登录以继续",
    emailLabel: "User ID / Email",
    emailPlaceholder: "yourname@nsuk.edu.kg",
    passwordLabel: "密码",
    passwordPlaceholder: "••••••••",
    signIn: "登录",
    signingIn: "登录中...",
    forgot: "忘记密码？",
    backHome: "返回首页",
    show: "显示",
    hide: "隐藏",
    agreement: "登录即表示你同意校园邮箱使用政策。",
    loginFailed: "登录失败，请检查账号或密码。",
    academicYearNotRegistered: "学年未注册，请进入学生中心控制台注册！"
  },
  errors: {
    unknown: "登录失败，请稍后再试。",
    login_edu_email_required: "邮箱不能为空，请输入正确邮箱！",
    login_edu_password_required: "密码不能为空，请核对密码！",
    login_edu_email_not_found: "该邮箱不存在，请输入正确邮箱！",
    login_edu_password_invalid: "密码错误，请核对密码！",
    login_edu_academic_year_not_registered: "学年未注册，请进入学生中心控制台注册！"
  },
  hero: {
    eyebrow: "NSUK Edu Mail",
    title: "面向下一代校园流程的现代化收件箱。",
    subtitle: "随时掌握教学公告、课程更新与安全的学生沟通。",
    cardTitle: "需要新的邮箱？",
    cardBody: "前往学生面板开通教育邮箱并管理续期。",
    cardCta: "激活教育邮箱 →"
  },
  inbox: {
    title: "我的收件箱",
    refresh: "刷新邮件",
    refreshing: "刷新中...",
    logout: "退出登录",
    loggingOut: "退出中...",
    expiresAtLabel: "到期时间",
    goDashboard: "前往学生中心控制台",
    emptyTitle: "暂无邮件",
    emptyBody: "请点击刷新按钮加载您的最新邮件。",
    from: "发件人",
    subject: "主题",
    received: "收件时间",
    detailPlaceholderTitle: "请选择一封邮件查看详情",
    detailPlaceholderBody: "从左侧列表中选择邮件进行预览。",
    noContent: "该邮件暂无可显示的正文内容。",
    emailContentTitle: "邮件内容",
    unknownSender: "未知",
    noSubject: "(无主题)",
    loading: "加载中...",
    failed: "加载失败"
  }
};

export const eduMailDictionaries: Record<EduMailLang, EduMailDict> = { en, zh };

export function getEduMailDict(lang: EduMailLang): EduMailDict {
  return eduMailDictionaries[lang];
}
