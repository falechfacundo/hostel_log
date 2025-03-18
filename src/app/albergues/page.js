"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useState, useEffect } from "react";
import { useDateStore } from "@/store/date-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building, Info } from "lucide-react";
import { useHostels } from "@/hooks/useHostels";
import { HostelCard } from "@/components/hostel/hostel-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HostelAssignment } from "@/components/hostel/HostelAssignment";
import { usePartnerStore } from "@/store/partnerStore";

export default function Albergues() {
  const [activeHostelId, setActiveHostelId] = useState(null);
  const selectedDate = useDateStore((state) => state.selectedDate);
  const selectedPartner = usePartnerStore((state) => state.selectedPartner);

  const { hostels = [], isLoading: isLoadingHostels } = useHostels();

  // Show loading state
  if (isLoadingHostels) {
    return (
      <div className="flex h-full">
        <div className="p-8 flex-1 flex justify-center">Cargando datos...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-full">
        <div className="flex-1 p-8 overflow-auto flex flex-col gap-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-fuchsia-pink-900">
              Albergues
            </h1>

            <Button className="bg-fuchsia-pink-500 hover:bg-fuchsia-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              <a href="/albergues/new">Nuevo Albergue</a>
            </Button>
          </div>

          {selectedPartner ? (
            <>
              <HostelAssignment />
            </>
          ) : (
            <div className="p-8 bg-muted/20 rounded-lg flex flex-col items-center justify-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-medium text-gray-700">
                No hay grupo seleccionado
              </h2>
              <p className="text-gray-500 mt-2">
                Selecciona o crea un grupo para asignar albergues
              </p>
            </div>
          )}
          <h2 className="text-2xl font-semibold mb-4">Todos los Albergues</h2>
          {hostels.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={<Building className="w-12 h-12 text-gray-400" />}
                title="No hay albergues disponibles"
                description="Comienza creando tu primer albergue para gestionar habitaciones y asignaciones."
                action={
                  <Button
                    asChild
                    className="bg-fuchsia-pink-500 hover:bg-fuchsia-pink-600"
                  >
                    <a href="/albergues/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Albergue
                    </a>
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostels.map((hostel) => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  activeHostelId={activeHostelId}
                  setActiveHostelId={setActiveHostelId}
                  date={selectedDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
