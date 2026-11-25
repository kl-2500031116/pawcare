import { createContext, useContext, useEffect, useState } from "react";
import { FunctionsFetchError } from "@supabase/supabase-js";
import { sendEmailNotification } from "./data.js";
import { getSupabase } from "./supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    let client;
    try {
      client = getSupabase();
    } catch (error) {
      setAuthError(error.message);
      setLoading(false);
      setAuthReady(true);
      return undefined;
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthError("");
    });

    client.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!active) return;
        setSession(data.session);
        setAuthReady(true);
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error.message);
        setAuthReady(true);
        setLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return undefined;
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    getSupabase()
      .from("profiles")
      .select("id, full_name, email, phone, role, created_at")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error("Your account profile is missing. Contact a PawCare administrator.");
        if (!active) return;
        setProfile(data);
        setAuthError("");
      })
      .catch((error) => {
        if (active) setAuthError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authReady, session?.user?.id]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    authError,
    refreshUser: async () => {
      const { data, error } = await getSupabase().auth.getSession();
      if (error) throw error;
      setSession(data.session);
    },
    register: async ({ full_name, phone, email, password }) => {
      const { data, error } = await getSupabase().auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: full_name.trim(), phone: phone.trim() },
        },
      });
      if (error) throw error;
      return data;
    },
    verifyOtp: async (email, token, type) => {
      const { data, error } = await getSupabase().auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type,
      });
      if (error) throw error;
      return data;
    },
    resendSignupOtp: async (email) => {
      const { error } = await getSupabase().auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });
      if (error) throw error;
    },
    requestPasswordReset: async (email) => {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
    },
    completePasswordReset: async (password) => {
      const client = getSupabase();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;
    },
    signIn: async (email, password) => {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      return data;
    },
    updateProfile: async (updates) => {
      if (!session?.user) throw new Error("Please sign in to update your account.");
      const { data, error } = await getSupabase()
        .from("profiles")
        .update({ full_name: updates.full_name.trim(), phone: updates.phone.trim() })
        .eq("id", session.user.id)
        .select("id, full_name, email, phone, role, created_at")
        .single();
      if (error) throw error;
      setProfile(data);
      return {
        ...data,
        notificationWarning: await sendEmailNotification("profile_updated", session.user.id),
      };
    },
    updateUserRole: async (id, role) => {
      if (!["adopter", "admin"].includes(role)) throw new Error("Choose a valid account role.");
      const { error } = await getSupabase()
        .from("profiles")
        .update({ role })
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
    },
    deleteUser: async (id) => {
      const { error } = await getSupabase().functions.invoke("admin-delete-user", {
        body: { userId: id },
      });
      if (error instanceof FunctionsFetchError) {
        throw new Error("Could not reach the account-deletion function. Confirm admin-delete-user is deployed to this Supabase project, then try again.");
      }
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await getSupabase().auth.signOut();
      return { error };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
