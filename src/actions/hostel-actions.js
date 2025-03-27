"use server";

import {
  withServerDb,
  dbSelect,
  dbInsert,
  dbUpdate,
  dbDelete,
} from "@/lib/server-action-utils";

/**
 * Fetch all hostels
 */
export async function fetchHostels() {
  return withServerDb(async (supabase) => {
    try {
      const hostels = await dbSelect(supabase, "hostels", {
        columns: `*, rooms(*)`,
        order: { column: "name" },
      });

      return {
        hostels: hostels || [],
        status: 200,
      };
    } catch (error) {
      console.error("Error in fetchHostels server action:", error);
      throw error;
    }
  });
}

/**
 * Add a new hostel
 */
export async function addHostel(hostelData) {
  return withServerDb(async (supabase, hostelData) => {
    try {
      const newHostel = await dbInsert(supabase, "hostels", hostelData);

      return {
        hostel: {
          ...newHostel,
          rooms: [],
        },
        status: 200,
      };
    } catch (error) {
      console.error("Error in addHostel server action:", error);
      throw error;
    }
  }, hostelData);
}

/**
 * Update a hostel
 */
export async function updateHostel(id, data) {
  return withServerDb(
    async (supabase, { id, data }) => {
      try {
        const updatedHostel = await dbUpdate(
          supabase,
          "hostels",
          data,
          { id },
          { single: true }
        );

        return {
          hostel: updatedHostel,
          status: 200,
        };
      } catch (error) {
        console.error("Error in updateHostel server action:", error);
        throw error;
      }
    },
    { id, data }
  );
}

/**
 * Delete a hostel
 */
export async function deleteHostel(id) {
  return withServerDb(async (supabase, id) => {
    try {
      await dbDelete(supabase, "hostels", { id });

      return {
        id,
        success: true,
        status: 200,
      };
    } catch (error) {
      console.error("Error in deleteHostel server action:", error);
      throw error;
    }
  }, id);
}
