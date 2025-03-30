import { withServerDb, dbInsert } from "@/lib/server-action-utils";
import { NextResponse } from "next/server";

/**
 * Handler for creating individual travelers
 */
export async function POST(request) {
  try {
    // Parse the request body
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.partnerId) {
      return NextResponse.json(
        { message: "Nombre y ID del socio son requeridos" },
        { status: 400 }
      );
    }

    // Use withServerDb pattern similar to partner-actions.js
    const result = await withServerDb(async (supabase) => {
      try {
        // Format data for insertion
        const individualData = {
          name: data.name.trim(),
          partner_id: data.partnerId,
          group_id: null, // Individuals don't belong to a group
          created_at: new Date().toISOString(),
        };

        // Insert into person table using dbInsert utility
        const newIndividual = await dbInsert(
          supabase,
          "person",
          individualData
        );

        return {
          traveler: newIndividual,
          status: 200,
        };
      } catch (error) {
        console.error("Error in individual traveler creation:", error);
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

    // Return success response with created traveler
    return NextResponse.json({
      message: "Viajero individual creado exitosamente",
      traveler: result.traveler,
      status: 200,
    });
  } catch (error) {
    console.error("Error in individual traveler creation API:", error);
    return NextResponse.json(
      { message: `Error del servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
