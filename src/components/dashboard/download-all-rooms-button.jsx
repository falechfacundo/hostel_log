"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Backpack } from "lucide-react";
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
  const [showPreview, setShowPreview] = useState(false); // Initialize as hidden
  const { groups, individuals } = entities || {};

  // Create a unique ID for this hostel's preview
  const previewId = `consolidated-hostel-view-${hostel.id}`;

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
    setShowPreview(true); // Now show the preview for this specific hostel

    try {
      // Longer delay to ensure the preview DOM is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get the consolidated view element with the unique ID
      const element = document.getElementById(previewId);
      if (!element) {
        throw new Error(
          `No se pudo generar la vista consolidada para ${hostel.name}`
        );
      }

      // Get the actual height of the content
      const actualHeight = element.scrollHeight;
      console.log(
        `Generating image for hostel: ${hostel.name}, height: ${actualHeight}px`
      );

      // Set explicit height on the element to ensure it's captured fully
      element.style.height = `${actualHeight}px`;

      // Generate the image with height configuration
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: true, // Enable logging for debugging
        useCORS: true,
        height: actualHeight + 36,
        windowHeight: actualHeight,
        imageTimeout: 0, // No timeout
        onclone: (clonedDoc) => {
          // Make sure the cloned element is visible for rendering
          const clonedElement = clonedDoc.getElementById(previewId);
          if (clonedElement) {
            // Measure again in the cloned DOM
            const clonedHeight = clonedElement.scrollHeight;
            console.log("Cloned element height:", clonedHeight);

            clonedElement.style.position = "absolute";
            clonedElement.style.left = "0";
            clonedElement.style.top = "0";
            clonedElement.style.opacity = "1";
            clonedElement.style.pointerEvents = "none";
            clonedElement.style.zIndex = "-1";
            clonedElement.style.width = "850px";
            clonedElement.style.height = `${clonedHeight}px`;

            // Make sure all parent elements don't clip the content
            let parent = clonedElement.parentElement;
            while (parent) {
              parent.style.height = "auto";
              parent.style.overflow = "visible";
              parent = parent.parentElement;
            }
          }
        },
      });

      // Adjust canvas height if needed
      if (canvas.height < actualHeight) {
        console.warn(
          `Canvas height (${canvas.height}) is less than content height (${actualHeight})`
        );
      }

      // Create a download link for the image
      const imageDataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageDataUrl;

      // Double-check we're using the correct hostel name for the download
      console.log(`Downloading image for hostel: ${hostel.name}`);
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

      {/* Hidden consolidated view for image generation - now with unique ID */}
      {showPreview && (
        // <div
        //   className="fixed right-20 top-0 bg-red-500 overflow-visible p-2 z-50"
        //   style={{ maxHeight: "none" }}
        // >
        <div
          className="fixed right-[9999rem] top-0 overflow-visible"
          style={{ maxHeight: "none" }}
        >
          <div
            id={previewId}
            style={{
              backgroundColor: "white",
              padding: "20px",
              width: "850px",
              fontFamily: "Arial, sans-serif",
              overflow: "visible",
            }}
            className="flex flex-col gap-12"
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
            <div className="flex flex-col gap-8">
              {hostel.rooms
                .filter((room) => assignments.some((a) => a.roomId === room.id))
                .map((room) => {
                  const roomAssignments = assignments.filter(
                    (a) => a.roomId === room.id
                  );
                  return (
                    <div
                      key={`consolidated-${room.id}`}
                      className="gap-6 flex flex-col items-start"
                    >
                      <h2 className="text-xl">
                        Habitación de {room.capacity} personas
                      </h2>
                      {(() => {
                        // Separate assignments into individuals and groups
                        const individualAssignments = [];
                        const groupAssignments = [];

                        roomAssignments.forEach((assignment) => {
                          const entityId =
                            assignment.entityId ||
                            assignment.groupId ||
                            assignment.individualId;
                          const entity = entitiesMap[entityId];

                          if (entity && entity.type === "individual") {
                            individualAssignments.push({ assignment, entity });
                          } else if (entity && entity.type === "group") {
                            groupAssignments.push({ assignment, entity });
                          }
                        });

                        // Render individuals first
                        return (
                          <div className="flex gap-8">
                            <div className="flex flex-col gap-4">
                              {/* Then render groups */}
                              {groupAssignments.map(
                                ({ assignment, entity }) => (
                                  <div key={`entity-${assignment.id}`}>
                                    {Array.isArray(entity.people) &&
                                      entity.people.length > 0 && (
                                        <div>
                                          {entity.people.map((person, idx) => (
                                            <div
                                              key={`person-${entity.id}-${idx}`}
                                              className="flex gap-4 text-sm"
                                            >
                                              {person.backpack ? (
                                                <Backpack className="text-gray-700 h-5 w-5" />
                                              ) : (
                                                <Backpack className="text-transparent h-5 w-5" />
                                              )}
                                              {person.name}{" "}
                                              {person.lastName || ""}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                )
                              )}
                            </div>
                            <div>
                              {individualAssignments.map(
                                ({ assignment, entity }) => (
                                  <div key={`entity-${assignment.id}`}>
                                    <div
                                      key={`individual-${assignment.id}`}
                                      className="flex gap-4 text-sm"
                                    >
                                      {entity.backpack ? (
                                        <Backpack className="text-gray-700 h-5 w-5" />
                                      ) : (
                                        <Backpack className="text-transparent h-5 w-5" />
                                      )}
                                      {entity.name} {entity.lastName || ""}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            {individualAssignments.length === 0 &&
                              groupAssignments.length === 0 && (
                                <div className="italic text-gray-500">
                                  Sin ocupantes
                                </div>
                              )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
