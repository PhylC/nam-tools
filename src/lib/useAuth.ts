"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { useAptMode } from "../app/components/AptMode";
import { getSupabaseBrowserClient } from "./supabaseClient";
import { getUserPlan, type UserPlan } from "./userPlan";

type AuthResult = {
  ok: boolean;
  message: string;
};

function getAuthRedirectUrl(path: string) {
  if (typeof window === "undefined") return `https://accountplanningtools.com${path}`;
  return `${window.location.origin}${path}`;
}

function logAuthError(context: string, error: unknown) {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`Supabase auth error: ${context}`, error);
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
    return "An account may already exist for this email. Try logging in or use forgot password.";
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
      ? "Account creation is not configured correctly. Please contact support."
      : "Sign-in is not configured correctly. Please contact support.";
  }

  if (context === "signup") return "We could not create your account. Please try again.";
  if (context === "signout") return "Could not sign out. Please try again.";
  return "We could not log you in. Check your email and password.";
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logAuthError("login", error);
        return { ok: false, message: authErrorMessage(error, "login") };
      }
      return { ok: true, message: "Logged in." };
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, message: "Account creation is not configured. Please contact support." };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl("/login?confirmed=true"),
        },
      });
      if (error) {
        logAuthError("signup", error);
        return { ok: false, message: authErrorMessage(error, "signup") };
      }
      if (data.session) return { ok: true, message: "Account created. You are now logged in." };
      return { ok: true, message: "Account created. Check your inbox to confirm your email, then log in." };
    },
    [supabase],
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { ok: true, message: "Signed out." };
    const { error } = await supabase.auth.signOut();
    if (error) {
      logAuthError("signout", error);
      return { ok: false, message: authErrorMessage(error, "signout") };
    }
    setUser(null);
    return { ok: true, message: "Signed out." };
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
