import { createClient, type AuthError, type Session, type User } from "@supabase/supabase-js";

type SignupPayload = {
  email?: unknown;
  password?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = "force-dynamic";

function jsonResponse(
  body: {
    ok: boolean;
    message: string;
    redirectTo?: string;
    confirmationRequired?: boolean;
    existingAccount?: boolean;
    session?: Pick<Session, "access_token" | "refresh_token">;
  },
  status = 200,
) {
  return Response.json(body, { status });
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getEmailDomain(email: string) {
  return email.includes("@") ? email.split("@").pop() ?? "unknown" : "invalid";
}

function getOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (forwardedProto && host) return `${forwardedProto.split(",")[0]}://${host.split(",")[0]}`;
  return new URL(request.url).origin;
}

function getSignupRedirectUrl(request: Request) {
  return `${getOrigin(request)}/login?confirmed=true`;
}

function logSignupEvent(event: string, details: Record<string, unknown>) {
  console.info(`APT signup: ${event}`, details);
}

function logSignupError(event: string, error: unknown, details: Record<string, unknown> = {}) {
  console.error(`APT signup error: ${event}`, {
    ...details,
    error,
    message: error instanceof Error ? error.message : undefined,
    stack: error instanceof Error ? error.stack : undefined,
  });
}

function signupErrorMessage(error: AuthError) {
  const message = error.message.toLowerCase();

  if (message.includes("user already registered") || message.includes("already registered") || message.includes("already exists")) {
    return "An account already exists for this email address. Try logging in or resetting your password.";
  }

  if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("least"))) {
    return "Your password must be at least 8 characters.";
  }

  if (message.includes("rate") || error.status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  return "Account creation is temporarily unavailable.";
}

function signupErrorStatus(error: AuthError) {
  const message = error.message.toLowerCase();
  if (message.includes("user already registered") || message.includes("already registered") || message.includes("already exists")) return 409;
  if (message.includes("password") || error.status === 400 || error.status === 422) return 400;
  if (error.status === 429) return 429;
  return 503;
}

function isExistingAccountSignup(user: User | null) {
  const identities = user?.identities;
  return Array.isArray(identities) && identities.length === 0;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let payload: SignupPayload;

  try {
    payload = (await request.json()) as SignupPayload;
  } catch (error) {
    logSignupError("invalid JSON", error, { requestId });
    return jsonResponse({ ok: false, message: "Send a valid account creation request." }, 400);
  }

  const email = asTrimmedString(payload.email).toLowerCase();
  const password = asTrimmedString(payload.password);
  const emailDomain = getEmailDomain(email);
  const redirectTo = getSignupRedirectUrl(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  logSignupEvent("request received", {
    requestId,
    emailDomain,
    hasEmail: Boolean(email),
    hasPassword: Boolean(password),
    redirectTo,
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
  });

  if (!email || !password) {
    return jsonResponse({ ok: false, message: "Enter your email and password." }, 400);
  }

  if (!EMAIL_PATTERN.test(email)) {
    return jsonResponse({ ok: false, message: "Please enter a valid email address." }, 400);
  }

  if (password.length < 8) {
    return jsonResponse({ ok: false, message: "Your password must be at least 8 characters." }, 400);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    logSignupError("missing Supabase configuration", new Error("Supabase signup configuration is missing"), {
      requestId,
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    });
    return jsonResponse({ ok: false, message: "Account creation is temporarily unavailable." }, 503);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    logSignupEvent("calling Supabase signUp", { requestId, emailDomain, redirectTo });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    logSignupEvent("Supabase signUp response", {
      requestId,
      emailDomain,
      hasError: Boolean(error),
      errorStatus: error?.status ?? null,
      errorMessage: error?.message ?? null,
      hasUser: Boolean(data.user),
      hasSession: Boolean(data.session),
      identityCount: data.user?.identities?.length ?? null,
      confirmationRequired: Boolean(data.user && !data.session),
    });

    if (error) {
      logSignupError("Supabase returned signup error", error, {
        requestId,
        emailDomain,
        status: error.status,
        message: error.message,
      });
      return jsonResponse({ ok: false, message: signupErrorMessage(error) }, signupErrorStatus(error));
    }

    if (isExistingAccountSignup(data.user)) {
      logSignupEvent("existing account detected", { requestId, emailDomain });
      return jsonResponse(
        {
          ok: false,
          existingAccount: true,
          message: "An account already exists for this email address. Try logging in or resetting your password.",
        },
        409,
      );
    }

    if (data.session) {
      logSignupEvent("signup completed with session", { requestId, emailDomain, redirectTo: "/workspace" });
      return jsonResponse({
        ok: true,
        message: "Account created. Redirecting to your workspace.",
        redirectTo: "/workspace",
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      });
    }

    logSignupEvent("signup completed with confirmation required", { requestId, emailDomain, redirectTo });
    return jsonResponse({
      ok: true,
      confirmationRequired: true,
      message: "Check your email to confirm your account.",
    });
  } catch (error) {
    logSignupError("signup route threw", error, { requestId, emailDomain, redirectTo });
    return jsonResponse({ ok: false, message: "Account creation is temporarily unavailable." }, 503);
  }
}
