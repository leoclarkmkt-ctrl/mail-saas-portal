export const en = {
  locale: "en",
  common: {
    brand: "National Science University of Kyrgyzstan",
    brandZh: "吉尔吉斯斯坦国立科学大学",
    portal: "Mail Portal",
    admin: "Admin",
    switchToZh: "中文",
    switchToEn: "English",
    copy: "Copy",
    copied: "Copied",
    submit: "Submit",
    cancel: "Cancel",
    back: "Back"
  },
  home: {
    title: "NSUK Official Mail Portal",
    subtitle: "Secure, international academic email services for students and researchers.",
    redeem: "Activate Education Email",
    webmail: "Open Education Email",
    dashboard: "Go to Student Console",
    adminHint: "Administrator"
  },
  redeem: {
    title: "Activate your Education Email with an Identity Code",
    activationCode: "Enter your identity code",
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
    networkError: "Network error. Please try again.",
    successTitle: "Activation Successful",
    webmail: "Education Email URL",
    dashboard: "Go to Dashboard",
    copyInfo: "Copy Login Info",
    renewNotice: "Detected existing account. This activation will renew the subscription." 
  },
  login: {
    title: "Sign In",
    personalTab: "Personal Email Login",
    eduTab: "Education Email Login",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    submit: "Sign In"
  },
  forgot: {
    title: "Password Recovery",
    description: "Only personal email can be used to recover password.",
    email: "Personal Email",
    submit: "Send Reset Link",
    notice: "If the email exists, a reset link will be sent."
  },
  reset: {
    title: "Reset Password",
    newPassword: "New Password",
    submit: "Reset Password"
  },
  dashboard: {
    title: "Student Console",
    status: "Status",
    active: "Active",
    expired: "Expired",
    suspended: "Suspended",
    personalEmail: "Personal Email",
    eduEmail: "Education Email",
    expiresAt: "Expires At",
    webmail: "Open Education Email",
    copyInfo: "Copy Login Info",
    copyWebmail: "Copy Education Email Info",
    changePassword: "Change Password",
    oldPassword: "Current Password",
    newPassword: "New Password",
    passwordHint: "Your portal password matches the education mailbox password.",
    passwordUpdated: "Password updated. The same password applies to your education mailbox.",
    renew: "Renew with Activation Code",
    renewHint: "Enter a new activation code to extend by 1 year.",
    renewSubmit: "Renew",
    expiredNotice: "Your mailbox has expired and is temporarily disabled. Renew to restore access.",
    logout: "Sign Out"
  },
  admin: {
    loginTitle: "Administrator Sign In",
    summary: "Overview",
    codes: "Activation Codes",
    users: "Users",
    audit: "Audit Logs",
    status: "System Status",
    overviewTitle: "Admin Overview",
    loginLabels: {
      email: "Email",
      password: "Password",
      submit: "Sign In",
      failed: "Login failed"
    },
    summaryLabels: {
      loading: "Loading...",
      activationCodes: "Activation Codes",
      unused: "Unused",
      used: "Used",
      revoked: "Revoked",
      users: "Users",
      total: "Total",
      eduAccounts: "Edu Accounts",
      active: "Active",
      expired: "Expired",
      last24h: "Last 24h",
      redeems: "Redeems",
      logins: "Logins"
    },
    codesLabels: {
      prefix: "Prefix",
      note: "Note",
      generate: "Generate",
      exportCsv: "Export CSV",
      statuses: {
        all: "All",
        unused: "Unused",
        used: "Used",
        revoked: "Revoked"
      },
      code: "Code",
      status: "Status",
      created: "Created",
      actions: "Actions",
      revoke: "Revoke"
    },
    usersLabels: {
      searchPlaceholder: "Search email",
      search: "Search",
      personalEmail: "Personal Email",
      eduEmail: "Edu Email",
      expires: "Expires",
      status: "Status",
      actions: "Actions",
      renew: "Renew",
      suspend: "Suspend",
      unsuspend: "Unsuspend",
      resetPassword: "Reset Password",
      tempPassword: "Temp password",
      suspended: "Suspended"
    },
    auditLabels: {
      searchPlaceholder: "Search",
      search: "Search",
      action: "Action",
      user: "User",
      ip: "IP",
      time: "Time"
    }
  },
  status: {
    title: "System Status",
    description: "Check environment variables, Supabase connectivity, schema initialization, and Auth redirect URLs.",
    panel: {
      env: "Environment variables configured",
      envDetailPrefix: "Missing: ",
      envOk: "Configured",
      supabase: "Supabase connection",
      supabaseOk: "Connected",
      supabaseFail: "Connection failed",
      schema: "Database schema initialized",
      schemaOk: "Initialized",
      schemaFail: "Run schema.sql + seed.sql in Supabase SQL Editor.",
      redirect: "Auth redirect URLs configured",
      redirectMissing: "No hint provided",
      redirectTitle: "Suggested configuration",
      redirectCopy: "Copy suggested config",
      copied: "Copied",
      loading: "Loading..."
    }
  },
  footer: {
    description:
      "NSUK is committed to advancing research collaboration across Central Asia and the globe, building a scientific community for the future.",
    copyright: "© 2026 NSUK. All rights reserved.",
    follow: "Follow us",
    platforms: ["LinkedIn", "X", "YouTube", "ResearchGate"]
  }
};
