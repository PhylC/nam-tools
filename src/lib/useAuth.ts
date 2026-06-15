"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { useAptMode } from "../app/components/AptMode";
import { getSupabaseBrowserClient } from "./supabaseClient";
import { getUserPlan, type UserPlan } from "./userPlan";

type AuthResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function getAuthRedirectUrl(path: string) {
  if (typeof window === "undefined") return `https://accountplanningtools.com${path}`;
  return `${window.location.origin}${path}`;
}

function logAuthError(context: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`Supabase auth error: ${context}`, error);
  if (error instanceof Error && error.stack) {
    console.warn(`Supabase auth stack: ${context}`, error.stack);
  }
}

function logAuthOperation(operation: string) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`Supabase auth operation: ${operation}`);
}

function logAuthResponse(context: string, data: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`Supabase auth response: ${context}`, data);
}

function authErrorMessage(error: AuthError, context: "login" | "signup" | "signout") {
  const message = error.message.toLowerCase();
  const status = error.status;

  if (message.includes("email not confirmed") || message.includes("not confirmed")) {
    return "Email not confirmed. Please check your inbox.";
  }

  if (message.includes("invalid login credentials") || message.includes("invalid credentials")) {
    return "No account found or password incorrect. Create a free account first if you have not registered.";
  }

  if (message.includes("user already registered") || message.includes("already registered") || message.includes("already exists")) {
    return "An account already exists for this email address. Try logging in or resetting your password.";
  }

  if (message.includes("password") && (message.includes("weak") || message.includes("short"))) {
    return "Your password must be at least 8 characters.";
  }

  if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
    return "Network error. Check your connection and try again.";
  }

  if (status === 429 || message.includes("rate")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (message.includes("api key") || message.includes("invalid key") || message.includes("project")) {
    return context === "signup"
      ? "Account creation is temporarily unavailable."
      : "Sign-in is not configured correctly. Please contact support.";
  }

  if (context === "signup") return "Account creation is temporarily unavailable.";
  if (context === "signout") return "Could not sign out. Please try again.";
  return "We could not log you in. Check your email and password.";
}

function unknownAuthErrorMessage(error: unknown, context: "login" | "signup" | "signout") {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
    return "Auth service unavailable. Check your connection and try again.";
  }

  if (context === "signup") return "Account creation is temporarily unavailable.";
  if (context === "signout") return "Auth service unavailable. We could not sign you out right now.";
  return "Auth service unavailable. Please try again later.";
}

function isExistingAccountSignup(data: { user?: User | null } | null) {
  const identities = data?.user?.identities;
  return Array.isArray(identities) && identities.length === 0;
}

export function useAuth() {
  const supabase = getSupabaseBrowserClient();
  const { aptMode } = useAptMode();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(() => Boolean(supabase));
  const isConfigured = Boolean(supabase);
  const isSignedIn = Boolean(user);
  const plan: UserPlan = getUserPlan(aptMode, null, isSignedIn);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;
    logAuthOperation("getUser");
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) logAuthError("get user", error);
        setUser(data.user ?? null);
        setIsLoadingAuth(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        logAuthError("get user", error);
        setUser(null);
        setIsLoadingAuth(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      logAuthOperation(`onAuthStateChange:${_event}`);
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, message: "Sign-in is not configured. Please contact support." };
      }
      logAuthOperation("signInWithPassword");
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          logAuthError("login", error);
          return { ok: false, message: authErrorMessage(error, "login") };
        }
        return { ok: true, message: "Logged in." };
      } catch (error) {
        logAuthError("login thrown", error);
        return { ok: false, message: unknownAuthErrorMessage(error, "login") };
      }
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, message: "Account creation is temporarily unavailable." };
      }
      logAuthOperation("signUp");
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl("/login?confirmed=true"),
          },
        });
        logAuthResponse("signup", {
          hasUser: Boolean(data.user),
          hasSession: Boolean(data.session),
          identityCount: data.user?.identities?.length ?? null,
        });
        if (error) {
          logAuthError("signup", error);
          return { ok: false, message: authErrorMessage(error, "signup") };
        }
        if (isExistingAccountSignup(data)) {
          return {
            ok: false,
            message: "An account already exists for this email address. Try logging in or resetting your password.",
          };
        }
        if (data.session) return { ok: true, message: "Account created. Redirecting to your workspace.", redirectTo: "/workspace" };
        return { ok: true, message: "Check your email to confirm your account." };
      } catch (error) {
        logAuthError("signup thrown", error);
        return { ok: false, message: unknownAuthErrorMessage(error, "signup") };
      }
    },
    [supabase],
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { ok: true, message: "Signed out." };
    logAuthOperation("signOut");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logAuthError("signout", error);
        return { ok: false, message: authErrorMessage(error, "signout") };
      }
      setUser(null);
      return { ok: true, message: "Signed out." };
    } catch (error) {
      logAuthError("signout thrown", error);
      return { ok: false, message: unknownAuthErrorMessage(error, "signout") };
    }
  }, [supabase]);

  return useMemo(
    () => ({
      user,
      isSignedIn,
      isAuthenticated: isSignedIn,
      isLoadingAuth,
      isLoading: isLoadingAuth,
      isConfigured,
      signIn,
      signUp,
      signOut,
      plan,
    }),
    [user, isSignedIn, isLoadingAuth, isConfigured, signIn, signUp, signOut, plan],
  );
}
