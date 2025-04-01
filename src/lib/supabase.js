"use client";

import { createClient } from "@supabase/supabase-js";

// Constants for Supabase connection
const SUPABASE_URL = "https://dscksmpcnanobrauqowj.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY2tzbXBjbmFub2JyYXVxb3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE4MDIsImV4cCI6MjA1ODk3NzgwMn0.zrHCAKik-zodrL9ncFRMPiQL0SX9sarQQhVatIe27EE";

// Create a browser client with proper storage settings
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // Enable persistent sessions
    storageKey: "supabase-auth", // Custom storage key
    storage: {
      getItem: (key) => {
        if (typeof window === "undefined") {
          return null;
        }
        // Get from localStorage with some error handling
        try {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          console.error("Error accessing localStorage:", error);
          return null;
        }
      },
      setItem: (key, value) => {
        if (typeof window === "undefined") {
          return;
        }
        // Set to localStorage with error handling
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error("Error writing to localStorage:", error);
        }
      },
      removeItem: (key) => {
        if (typeof window === "undefined") {
          return;
        }
        // Remove from localStorage with error handling
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error("Error removing from localStorage:", error);
        }
      },
    },
  },
});

// This function should be in a separate server-actions file
// Moving the server code to a separate file
