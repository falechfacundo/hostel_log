import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

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
      userProfile: null,
      loading: true,
      isAuthenticated: false,
      authSubscription: null, // Track auth subscription

      // Initialize auth state on app load
      init: async () => {
        try {
          set({ loading: true });

          // Clean up previous subscription if exists
          const prevSubscription = get().authSubscription;
          if (prevSubscription) {
            prevSubscription.unsubscribe();
          }

          // Get current session
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("Session retrieval error:", sessionError);
            set({ loading: false, isAuthenticated: false });
            return null;
          }

          let profile = null;
          if (session?.user) {
            // Fetch user profile when session exists
            profile = await fetchUserProfile(session.user.id);
          }

          // Set initial state
          set({
            user: session?.user || null,
            userProfile: profile,
            isAuthenticated: !!session?.user,
            loading: false,
          });

          // Listen to auth changes - store the subscription
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(
              "Auth state change:",
              event,
              session ? "session exists" : "no session"
            );

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

            // Show toast notifications for auth events
            if (event === "SIGNED_IN") {
              toast.success("Sesión iniciada correctamente");
            } else if (event === "SIGNED_OUT") {
              toast.info("Sesión cerrada");
            } else if (event === "TOKEN_REFRESHED") {
              console.log("Token refreshed successfully");
            }
          });

          // Store subscription for cleanup
          set({ authSubscription: subscription });

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

      // Refresh session manually if needed
      refreshSession: async () => {
        try {
          set({ loading: true });
          const { data, error } = await supabase.auth.refreshSession();

          if (error) throw error;

          const { session, user } = data;

          // Fetch profile after refresh
          let profile = null;
          if (user) {
            profile = await fetchUserProfile(user.id);
          }

          set({
            user: user || null,
            userProfile: profile,
            isAuthenticated: !!user,
            loading: false,
          });

          return { session, user };
        } catch (error) {
          set({ loading: false });
          console.error("Session refresh error:", error);
          throw error;
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
          toast.error(`Error: ${error.message}`);
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
          toast.error(`Error: ${error.message}`);
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

          return true;
        } catch (error) {
          set({ loading: false });
          toast.error(`Error al cerrar sesión: ${error.message}`);
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
      }),
      onRehydrateStorage: () => (state) => {
        // When storage is rehydrated (e.g., after page refresh)
        if (state) {
          // Initialize auth on rehydration to ensure fresh subscription
          state.init();
        }
      },
    }
  )
);
