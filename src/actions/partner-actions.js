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
            // Fetch groups
            dbSelect(supabase, "groups", {
              columns: `*, person(*)`,
              filters: { partner_id: partner.id },
            }),

            // Fetch individuals
            dbSelect(supabase, "person", {
              filters: {
                partner_id: partner.id,
                group_id: null,
              },
              order: { column: "name" },
            }),

            // Fetch hostel assignments
            dbSelect(supabase, "hostel_partner_assignments", {
              columns: `*, hostel:hostels(*)`,
              filters: { partner_id: partner.id },
            }),
          ]);

          // Format groups to match expected structure
          const formattedGroups = groups.map((group) => ({
            ...group,
            people: group.person || [],
          }));

          return {
            ...partner,
            groups: formattedGroups,
            individuals: individuals || [],
            hostelAssignments: hostelAssignments || [],
          };
        })
      );

      // Collect all groups and individuals for convenience
      const allGroups = partnersWithData.flatMap((p) => p.groups || []);
      const allIndividuals = partnersWithData.flatMap(
        (p) => p.individuals || []
      );

      return {
        partners: partnersWithData,
        groups: allGroups,
        individuals: allIndividuals,
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
  return withAuth(async (supabase, partnerData) => {
    try {
      const newPartner = await dbInsert(supabase, "partners", partnerData);

      // Add empty arrays for client-side use
      return {
        ...newPartner,
        groups: [],
        individuals: [],
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
  return withAuth(async (supabase, partnerId) => {
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
