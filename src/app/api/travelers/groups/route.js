import { withServerDb, dbInsert } from "@/lib/server-action-utils";
import { NextResponse } from "next/server";

/**
 * Handler for creating traveler groups
 */
export async function POST(request) {
  try {
    // Parse the request body
    const data = await request.json();

    // Validate required fields
    if (!data.people || !Array.isArray(data.people) || data.people.length < 2) {
      return NextResponse.json(
        { message: "Se requieren al menos 2 personas para crear un grupo" },
        { status: 400 }
      );
    }

    if (!data.partnerId) {
      return NextResponse.json(
        { message: "ID del socio es requerido" },
        { status: 400 }
      );
    }

    // Use withServerDb pattern similar to partner-actions.js
    const result = await withServerDb(async (supabase) => {
      try {
        // First create the group
        const groupData = {
          partner_id: data.partnerId,
          size: data.people?.length,
          created_at: new Date().toISOString(),
        };

        // Insert group and get its ID
        const newGroup = await dbInsert(supabase, "groups", groupData);

        // Create array to store all person records
        const members = [];

        // Insert each person in the group
        for (const person of data.people) {
          const personData = {
            name: person.name.trim(),
            partner_id: data.partnerId,
            group_id: newGroup.id, // Link to the parent group
            created_at: new Date().toISOString(),
          };

          // Insert person using dbInsert utility
          const newPerson = await dbInsert(supabase, "person", personData);
          members.push(newPerson);
        }

        // Return the group with its members
        return {
          group: {
            ...newGroup,
            people: members, // Add people to match expected structure
          },
          status: 200,
        };
      } catch (error) {
        console.error("Error in group creation:", error);
        throw error;
      }
    });

    // Handle errors from the withServerDb utility
    if (result.error) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status || 500 }
      );
    }

    // Return success response with created group
    return NextResponse.json({
      message: "Grupo creado exitosamente",
      group: result.group,
      status: 200,
    });
  } catch (error) {
    console.error("Error in group creation API:", error);
    return NextResponse.json(
      { message: `Error del servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
