"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAptMode } from "../app/components/AptMode";
import { getSupabaseBrowserClient } from "./supabaseClient";
import { getUserPlan, type UserPlan } from "./userPlan";

type AuthResult = {
  ok: boolean;
  message: string;
};

export function useAuth() {
  const { aptMode } = useAptMode();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(() => Boolean(getSupabaseBrowserClient()));
  const supabase = getSupabaseBrowserClient();
  const isConfigured = Boolean(supabase);
  const isSignedIn = Boolean(user);
  const plan: UserPlan = getUserPlan(aptMode, null, isSignedIn);

  useEffect(() => {
    if (!supabase) {
      setIsLoadingAuth(false);
      return;
    }

    let isMounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setUser(data.user ?? null);
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
        return { ok: false, message: "Sign-in is temporarily unavailable. Please try again later." };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, message: "We could not log you in. Check your email and password." };
      return { ok: true, message: "Logged in." };
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, message: "Account creation is temporarily unavailable. Please try again later." };
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { ok: false, message: "We could not create your account. Please try again." };
      return { ok: true, message: "Account created. Check your inbox to confirm your email, then log in." };
    },
    [supabase],
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return { ok: true, message: "Signed out." };
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, message: "Could not sign out. Please try again." };
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
