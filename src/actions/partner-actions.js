"use server";

import {
  withServerDb,
  dbSelect,
  dbInsert,
  dbDelete,
} from "@/lib/server-action-utils";

/**
 * Fetch partners by date range
 */
export async function fetchPartnersByDate(dateStr) {
  return withServerDb(async (supabase, dateStr) => {
    try {
      const partners = await dbSelect(supabase, "partners", {
        filters: {
          start_date: { operator: "lte", value: dateStr },
          end_date: { operator: "gte", value: dateStr },
        },
        order: { column: "name" },
      });

      if (!partners?.length) {
        return {
          partners: [],
          groups: [],
          individuals: [],
          status: 200,
        };
      }

      // Fetch all related data for each partner using Promise.all for parallel processing
      const partnersWithData = await Promise.all(
        partners.map(async (partner) => {
          const [groups, individuals, hostelAssignments] = await Promise.all([
            // Fetch groups with their members
            dbSelect(supabase, "groups", {
              columns: `*, person(*)`,
              filters: { partner_id: partner.id },
            }),

            // Fetch individuals (people WITHOUT a group)
            dbSelect(supabase, "person", {
              filters: {
                partner_id: partner.id,
                group_id: { operator: "is", value: null },
              },
              order: { column: "name" },
            }),

            // Fetch hostel assignments
            dbSelect(supabase, "hostel_partner_assignments", {
              columns: `*, hostel:hostels(*)`,
              filters: { partner_id: partner.id },
            }),
          ]);
          console.log("individuals", individuals);

          // Format groups to match expected structure
          // Note: Group members are already included in the group.person property
          const formattedGroups = groups.map((group) => ({
            ...group,
            people: group.person || [], // Rename 'person' to 'people' for consistency
          }));

          return {
            ...partner,
            groups: formattedGroups,
            individuals: individuals || [], // These are ONLY people without a group
            hostelAssignments: hostelAssignments || [],
          };
        })
      );

      // Collect all groups and standalone individuals for convenience
      const allGroups = partnersWithData.flatMap((p) => p.groups || []);
      const allIndividuals = partnersWithData.flatMap(
        (p) => p.individuals || []
      );

      return {
        partners: partnersWithData,
        groups: allGroups,
        individuals: allIndividuals, // These are ONLY people without a group
        status: 200,
      };
    } catch (error) {
      console.error("Error in fetchPartnersByDate server action:", error);
      throw error;
    }
  }, dateStr);
}

/**
 * Create a new partner
 */
export async function createPartner(partnerData) {
  return withServerDb(async (supabase, partnerData) => {
    try {
      const newPartner = await dbInsert(supabase, "partners", partnerData);

      // Add empty arrays for client-side use
      return {
        ...newPartner,
        groups: [], // Groups will be empty for a new partner
        individuals: [], // Standalone people without groups will be empty for a new partner
        hostelAssignments: [],
        status: 200,
      };
    } catch (error) {
      console.error("Error in createPartner server action:", error);
      throw error;
    }
  }, partnerData);
}

/**
 * Delete a partner
 */
export async function deletePartner(partnerId) {
  return withServerDb(async (supabase, partnerId) => {
    try {
      await dbDelete(supabase, "partners", { id: partnerId });

      return {
        id: partnerId,
        success: true,
        status: 200,
      };
    } catch (error) {
      console.error("Error in deletePartner server action:", error);
      throw error;
    }
  }, partnerId);
}

/**
 * Updates an existing partner record
 */
export async function updatePartner(id, partnerData) {
  try {
    // Validate required fields
    if (!id) {
      return { error: "Partner ID is required" };
    }

    if (!partnerData.name) {
      return { error: "Partner name is required" };
    }

    // Update the partner record
    const { data, error } = await supabase
      .from("partners")
      .update(partnerData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating partner:", error);
      return { error: error.message };
    }

    return data;
  } catch (error) {
    console.error("Unexpected error updating partner:", error);
    return { error: error.message || "Failed to update partner" };
  }
}
