import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function normaliseEmail(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token?.trim() ?? "" : "";
}

export async function GET(request: Request) {
  const authorisedEmail = normaliseEmail(process.env.APT_TEST_USER_EMAIL);
  const token = getBearerToken(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!authorisedEmail || !token || !supabaseUrl || !supabaseAnonKey) {
    return Response.json({ canUseTestMode: false });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error) return Response.json({ canUseTestMode: false });

    return Response.json({
      canUseTestMode: normaliseEmail(data.user?.email) === authorisedEmail,
    });
  } catch {
    return Response.json({ canUseTestMode: false });
  }
}
