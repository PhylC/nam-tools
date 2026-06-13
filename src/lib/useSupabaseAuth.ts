"use client";

import { useAuth } from "./useAuth";

export function useSupabaseAuth() {
  const auth = useAuth();
  return {
    user: auth.user,
    isAuthenticated: auth.isSignedIn,
    isLoading: auth.isLoadingAuth,
  };
}
