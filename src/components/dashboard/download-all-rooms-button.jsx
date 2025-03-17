"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { format } from "date-fns";

export function DownloadAllRoomsButton({
  hostel,
  assignments,
  date,
  entities,
  checkedEntities,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { groups, individuals } = entities || {};

  // Generate and download a single consolidated image
  const downloadConsolidatedView = async () => {
    // Check if there are any assignments
    const hasAssignments = hostel.rooms.some((room) =>
      assignments.some((a) => a.roomId === room.id)
    );

    if (!hasAssignments) {
      toast.info("No hay habitaciones con asignaciones para descargar");
      return;
    }

    setIsGenerating(true);
    setShowPreview(true);

    try {
      // Small delay to ensure the preview DOM is rendered
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get the consolidated view element
      const element = document.getElementById("consolidated-hostel-view");
      if (!element) {
        throw new Error("No se pudo generar la vista consolidada");
      }

      // Generate the image
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          // Make sure the cloned element is visible for rendering
          const clonedElement = clonedDoc.getElementById(
            "consolidated-hostel-view"
          );
          if (clonedElement) {
            clonedElement.style.position = "absolute";
            clonedElement.style.left = "0";
            clonedElement.style.top = "0";
            clonedElement.style.opacity = "1";
            clonedElement.style.pointerEvents = "none";
            clonedElement.style.zIndex = "-1";
            clonedElement.style.width = "850px";
          }
        },
      });

      // Create a download link for the image
      const imageDataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageDataUrl;
      link.download = `${hostel.name}-Asignaciones-${format(
        date,
        "yyyy-MM-dd"
      )}.png`.replace(/\s+/g, "-");
      link.click();
    } catch (error) {
      console.error("Error al generar la imagen consolidada:", error);
    } finally {
      setShowPreview(false);
      setIsGenerating(false);
    }
  };

  // Create entity lookup map for efficient access
  const entitiesMap = {};

  // Process groups
  if (Array.isArray(groups)) {
    // Remove incorrect console.log
    groups.forEach((group) => {
      // Store the group with its people data
      entitiesMap[group.id] = {
        ...group,
        type: "group",
        // Ensure people is always an array
        people: Array.isArray(group.people) ? [...group.people] : [],
      };
    });
  }

  // Process individuals
  if (Array.isArray(individuals)) {
    individuals.forEach((individual) => {
      entitiesMap[individual.id] = { ...individual, type: "individual" };
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={downloadConsolidatedView}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="text-xs">Descargar Asignaciones</span>
            </>
          )}
        </Button>
      </div>

      {/* Hidden consolidated view for image generation */}
      {showPreview && (
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <div
            id="consolidated-hostel-view"
            style={{
              backgroundColor: "white",
              padding: "20px",
              width: "850px",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <h1
              style={{
                textAlign: "center",
                fontSize: "24px",
                paddingBottom: "12px",
                borderBottom: "2px solid #000",
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              {hostel.name} - {format(date, "dd/MM/yyyy")}
            </h1>

            {hostel.rooms
              .filter((room) => assignments.some((a) => a.roomId === room.id))
              .map((room) => {
                const roomAssignments = assignments.filter(
                  (a) => a.roomId === room.id
                );
                return (
                  <div
                    key={`consolidated-${room.id}`}
                    style={{
                      borderRadius: "5px",
                      padding: "10px",
                      justifyContent: "center",
                      display: "inline",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "18px",
                        marginBottom: "10px",
                        padding: "5px",
                        borderRadius: "3px",
                        textAlign: "center",
                      }}
                    >
                      Habitación de {room.capacity} personas
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: "12px",
                      }}
                    >
                      {roomAssignments.map((assignment) => {
                        const entityId =
                          assignment.entityId ||
                          assignment.groupId ||
                          assignment.individualId;
                        const entity = entitiesMap[entityId];

                        return entity ? (
                          <div
                            key={`entity-${assignment.id}`}
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "12px",
                            }}
                          >
                            {/* <div
                              style={{
                                marginBottom: "5px",
                                fontSize: "14px",
                                fontWeight: "bold",
                              }}
                            >
                              • {entity.name} {entity.lastName || ""} 
                               {entity.type === "group" &&
                                entity.size &&
                                ` (Grupo de ${entity.size})`}
                            </div> */}

                            {/* Show all people in the group */}
                            {entity.type === "group" &&
                              Array.isArray(entity.people) &&
                              entity.people.length > 0 && (
                                <div
                                  style={{
                                    borderRadius: "12px",
                                    padding: "12px",
                                    display: "inline",
                                  }}
                                >
                                  {entity.people.map((person, idx) => (
                                    <div
                                      key={`person-${entityId}-${idx}`}
                                      style={{
                                        marginBottom: "4px",
                                        color: "#555",
                                        fontSize: "14px",
                                        fontStyle: "italic",
                                        textAlign: "center",
                                      }}
                                    >
                                      {person.name} {person.lastName || ""}
                                      {person.age && ` (${person.age} años)`}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ) : (
                          <div
                            key={`person-${assignment.id}`}
                            style={{
                              marginBottom: "4px",
                              fontSize: "14px",
                              fontStyle: "italic",
                              color: "#555",
                            }}
                          >
                            (datos no disponibles)
                          </div>
                        );
                      })}
                      {roomAssignments.length === 0 && (
                        <div style={{ fontStyle: "italic", color: "#666" }}>
                          Sin ocupantes
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}
