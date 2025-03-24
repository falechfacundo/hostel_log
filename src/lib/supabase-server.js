"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Constants for Supabase connection
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Use service role key for server operations
const SUPABASE_SERVICE_ROLE_KEY = SUPABASE_ANON_KEY;

// Function to create a Supabase client with server context
export async function createServerSupabaseClient() {
  // Create client with service role for direct database access
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // No need for cookies since we're using service role
  });
}

// Example of a server action for data fetching
export async function fetchPartnersByDateAction(dateStr) {
  try {
    const supabase = await createServerSupabaseClient();

    // No need to verify authentication - server has direct access

    // Query partners by date
    const { data: partners, error } = await supabase
      .from("partners")
      .select("*")
      .lte("start_date", dateStr)
      .gte("end_date", dateStr)
      .order("name");

    if (error) throw error;

    // If no partners, return empty array
    if (!partners?.length) {
      return { partners: [] };
    }

    return {
      partners,
      status: 200,
    };
  } catch (error) {
    console.error("SERVER ACTION Error:", error);
    return { error: error.message, status: 500 };
  }
}
