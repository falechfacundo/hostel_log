"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { HostelPrintView } from "./hostel-print-view";

export function DownloadRoomButton({
  hostel,
  room,
  assignments,
  date,
  entities,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Crear un ID único y consistente para este elemento
  const printElementId = `print-single-${room.id}`;

  // Descargar la imagen
  const downloadAsImage = async () => {
    setIsGenerating(true);

    try {
      // Primero asegurémonos de que el componente de vista previa esté visible
      setShowPreview(true);

      // Pequeño delay para asegurarnos que el DOM se ha renderizado completamente
      await new Promise((resolve) => setTimeout(resolve, 200));

      const element = document.getElementById(printElementId);

      if (!element) {
        throw new Error(
          `No se encontró el elemento a convertir (ID: ${printElementId})`
        );
      }

      // Debug para ver qué elementos existen
      console.log(
        "Elementos disponibles por ID:",
        Object.fromEntries(
          [...document.querySelectorAll('[id^="print-"]')].map((el) => [
            el.id,
            el.tagName,
          ])
        )
      );

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: true, // Activar logging para depuración
        useCORS: true,
      });

      // Convertir canvas a URL
      const image = canvas.toDataURL("image/png");

      // Crear link de descarga con nombre de archivo formateado correctamente
      const link = document.createElement("a");
      const fileName = `${hostel.name}-${room.name}-${format(
        date,
        "yyyy-MM-dd"
      )}`;
      link.download = fileName.replace(/\s+/g, "-") + ".png";
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Error al generar imagen:", error);
      toast.error("Error al generar la imagen: " + error.message);
    } finally {
      // Ocultar la vista previa
      setShowPreview(false);
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={downloadAsImage}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        <span className="text-xs">
          {isGenerating ? "Generando..." : "Descargar"}
        </span>
      </Button>

      {/* Componente oculto que se usa para generar la imagen - usar ID específico */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            opacity: 1, // Hacerlo visible durante la depuración
            pointerEvents: "none",
          }}
        >
          <HostelPrintView
            hostel={hostel}
            room={room}
            assignments={assignments}
            date={date}
            entities={entities}
            id={printElementId} // Usar el mismo ID que buscamos arriba
          />
        </div>
      )}
    </>
  );
}
