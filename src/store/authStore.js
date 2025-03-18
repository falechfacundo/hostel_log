import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { persist } from "zustand/middleware";

// Helper function to fetch user profile
const fetchUserProfile = async (userId) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      userProfile: null, // Add userProfile to store profile data
      loading: true,
      isAuthenticated: false,

      // Initialize auth state on app load
      init: async () => {
        try {
          set({ loading: true });
          const {
            data: { session },
          } = await supabase.auth.getSession();

          let profile = null;
          if (session?.user) {
            // Fetch user profile when session exists
            profile = await fetchUserProfile(session.user.id);
          }

          set({
            user: session?.user || null,
            userProfile: profile,
            isAuthenticated: !!session?.user,
            loading: false,
          });

          // Listen to auth changes
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            // When auth state changes, fetch profile if user exists
            let profile = null;
            if (session?.user) {
              profile = await fetchUserProfile(session.user.id);
            }

            set({
              user: session?.user || null,
              userProfile: profile,
              isAuthenticated: !!session?.user,
            });
          });

          return subscription;
        } catch (error) {
          console.error("Auth initialization error:", error);
          set({
            loading: false,
            user: null,
            userProfile: null,
            isAuthenticated: false,
          });
          return null;
        }
      },

      // Sign in with email and password
      signIn: async ({ email, password }) => {
        try {
          set({ loading: true });
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          // Fetch user profile after successful sign-in
          const profile = await fetchUserProfile(data.user.id);

          set({
            user: data.user,
            userProfile: profile,
            isAuthenticated: !!data.user,
            loading: false,
          });

          return { user: data.user, profile };
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Sign up with email and password
      signUp: async ({ email, password, userData = {} }) => {
        try {
          set({ loading: true });

          // Register the user with Supabase
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                ...userData,
              },
            },
          });

          if (error) throw error;

          // If email confirmation is required
          if (data.user && data.user.identities?.length === 0) {
            set({ loading: false });
            return { user: null, requiresEmailConfirmation: true };
          }

          // If auto sign-in after registration
          const profile = await fetchUserProfile(data.user.id);

          set({
            user: data.user,
            userProfile: profile,
            isAuthenticated: !!data.user,
            loading: false,
          });

          return { user: data.user, profile, requiresEmailConfirmation: false };
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ loading: true });
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          set({
            user: null,
            userProfile: null,
            isAuthenticated: false,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
      }), // Persist both user and profile
    }
  )
);
