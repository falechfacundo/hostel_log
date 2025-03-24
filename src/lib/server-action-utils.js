"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Execute a server action with a server-side Supabase client
 * No authentication check since server has direct access
 */
export async function withServerDb(actionFn, ...args) {
  try {
    // Create server-side Supabase client with service role
    const supabase = await createServerSupabaseClient();

    // Execute the action with the server Supabase client
    return await actionFn(supabase, ...args);
  } catch (error) {
    console.error("Server action error:", error);
    return {
      error: `Error en el servidor: ${error.message}`,
      status: 500,
    };
  }
}

/**
 * Authenticate a server action and run it
 * This must be an async function since it's in a "use server" file
 */
export async function withAuth(actionFn, ...args) {
  try {
    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session, return unauthorized error
    if (!session) {
      return {
        error: "No autenticado. Por favor inicie sesión nuevamente.",
        status: 401,
      };
    }

    // Execute the action with authenticated supabase client
    return await actionFn(supabase, ...args);
  } catch (error) {
    console.error("Server action error:", error);
    return {
      error: `Error en el servidor: ${error.message}`,
      status: 500,
    };
  }
}

/**
 * Select operation with filters
 */
export async function dbSelect(supabase, table, options = {}) {
  const { columns = "*", filters = {}, limit, order, single = false } = options;

  let query = supabase.from(table).select(columns);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === "object" && value.operator) {
        // Complex filter with operator
        query = query[value.operator](key, value.value);
      } else {
        // Simple equality filter
        query = query.eq(key, value);
      }
    }
  });

  // Apply limit
  if (limit) {
    query = query.limit(limit);
  }

  // Apply ordering
  if (order) {
    const { column, ascending = true } = order;
    query = query.order(column, { ascending });
  }

  // Execute query
  const { data, error } = single ? await query.single() : await query;

  if (error) throw error;
  return data;
}

/**
 * Insert operation
 */
export async function dbInsert(supabase, table, data, options = {}) {
  const { select = "*", single = true } = options;

  const query = supabase.from(table).insert(data);

  if (select) {
    query.select(select);
  }

  const result = single ? await query.single() : await query;

  if (result.error) throw result.error;
  return result.data;
}

/**
 * Update operation
 */
export async function dbUpdate(supabase, table, data, filters, options = {}) {
  const { select = "*", single = false } = options;

  let query = supabase.from(table).update(data);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  if (select) {
    query.select(select);
  }

  const result = single ? await query.single() : await query;

  if (result.error) throw result.error;
  return result.data;
}

/**
 * Delete operation
 */
export async function dbDelete(supabase, table, filters) {
  let query = supabase.from(table).delete();

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  const { error } = await query;

  if (error) throw error;
  return { success: true };
}
