import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const SUPPORTED_LANGS = new Set(["zh", "en"]);

const isIgnoredPath = (pathname: string) => {
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  return PUBLIC_FILE.test(pathname);
};

const resolveLangFromCookie = (request: NextRequest) => {
  const raw = request.cookies.get("nsuk_lang")?.value;
  if (raw && SUPPORTED_LANGS.has(raw)) {
    return raw;
  }
  return "zh";
};

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (isIgnoredPath(pathname)) {
    return NextResponse.next();
  }

  const lang = searchParams.get("lang");

  if (!lang) {
    const url = request.nextUrl.clone();
    url.searchParams.set("lang", resolveLangFromCookie(request));
    return NextResponse.redirect(url, 302);
  }

  const response = NextResponse.next();
  if (SUPPORTED_LANGS.has(lang)) {
    response.cookies.set("nsuk_lang", lang, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    response.cookies.set("portal-lang", lang, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminSession = request.cookies.get("nsuk_admin_session");
    if (!adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/dashboard")) {
    const userSession = request.cookies.get("nsuk_user_session");
    if (!userSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/:path*"]
};
