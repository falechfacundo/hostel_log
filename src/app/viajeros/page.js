"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Users, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useTravelers } from "@/hooks/useTravelers";
// Removemos la importación de PartnerSelector ya que estará en el Nav
// import { PartnerSelector } from "@/components/partner-selector/partner-selector";
import { BulkGroupImport } from "@/components/travelers/bulk-group-import";
import { GroupsList } from "@/components/travelers/GroupsList";
import { IndividualsList } from "@/components/travelers/IndividualsList";
import { NewGroupForm } from "@/components/travelers/NewGroupForm";
import { NewIndividualForm } from "@/components/travelers/NewIndividualForm";

import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { usePartnerStore } from "@/store/partnerStore";

export default function Viajeros() {
  const [openDialog, setOpenDialog] = useState({
    group: false,
    individual: false,
    partner: false,
  });
  const [newPartner, setNewPartner] = useState({
    name: "",
    size: "",
    days: "5",
  });

  // Estado para tracking manual de viajeros filtrados
  const [filteredTravelersStatus, setFilteredTravelersStatus] = useState({
    groups: {},
    individuals: {},
  });

  // Use our Zustand store for selectedPartner, groups, and individuals
  const {
    selectedPartner,
    groups: storeGroups,
    individuals: storeIndividuals,
  } = usePartnerStore();

  // Usar el hook combinado que maneja tanto partners como travelers, pasando la fecha seleccionada
  const {
    // Partners data
    partners,
    isLoadingPartners,
    addPartner,

    // Operations
    addGroup,
    deleteGroup,
    addPersonToGroup,
    removePersonFromGroup,
    addIndividual,
    removeIndividual,
    updatePerson,

    // Status
    isLoading,
    error: combinedError,
    refetchPartners,
  } = useTravelers();

  // Keep track of renders to detect excessive re-rendering
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  // Memoize heavy computations to prevent unnecessary recalculations
  // Use data from store as the primary source
  const filteredGroups = useMemo(() => {
    return storeGroups || [];
  }, [storeGroups]);

  const filteredIndividuals = useMemo(() => {
    return storeIndividuals || [];
  }, [storeIndividuals]);

  // Simplify partner determination - use the hook's value directly
  const partnerToDisplay = selectedPartner;

  // Manejador para cambio de fecha - Este ahora se pasará al PartnerSelector
  const handleDateChange = (e) => {
    const newDateString = e.target.value;
    const newDate = new Date(newDateString + "T00:00:00");

    if (isNaN(newDate.getTime())) {
      toast.error("Fecha inválida");
      return;
    }

    // Limpiar el estado de viajeros filtrados
    setFilteredTravelersStatus({
      groups: {},
      individuals: {},
    });

    // Actualizar la fecha (esto activará el efecto que recarga los datos)
    setSelectedDate(newDate);
  };

  // Memoize handler functions to prevent unnecessary re-renders
  const handleAddGroup = useCallback(
    async (groupData) => {
      try {
        // Count all people across all existing groups belonging to this partner
        const totalPeopleInGroups = storeGroups
          .filter((g) => g.partner_id === selectedPartner?.id)
          .reduce((total, g) => total + (g.people?.length || 0), 0);

        // Count all existing individuals belonging to this partner
        const totalIndividuals = storeIndividuals
          ? storeIndividuals.filter((i) => i.partner_id === selectedPartner?.id)
              .length
          : 0;

        // Total existing people count (groups + individuals)
        const totalPeopleWithPartner = totalPeopleInGroups + totalIndividuals;

        // Number of people in the new group
        const newGroupSize = groupData.people?.length || 0;

        const partnerSizeLimit = selectedPartner?.size || 0;

        // Check if adding this group would exceed the partner's total capacity
        if (totalPeopleWithPartner + newGroupSize > partnerSizeLimit) {
          toast.error(
            `No se puede añadir este grupo. El socio tiene ${totalPeopleWithPartner} personas de un límite de ${partnerSizeLimit}, y este grupo añadiría ${newGroupSize} más.`
          );
          return;
        }

        await addGroup({
          ...groupData,
          partnerId: selectedPartner?.id,
        });

        // Close dialog
        setOpenDialog((prev) => ({ ...prev, group: false }));
      } catch (error) {
        console.error("Error detallado:", error);
      }
    },
    [
      addGroup,
      selectedPartner?.id,
      selectedPartner?.size,
      storeGroups,
      storeIndividuals,
    ]
  );

  const handleAddIndividual = useCallback(
    async (individualData) => {
      try {
        // Count all people across all groups belonging to this partner
        const totalPeopleInGroups = storeGroups
          .filter((g) => g.partner_id === selectedPartner?.id)
          .reduce((total, g) => total + (g.people?.length || 0), 0);

        // Count all individuals belonging to this partner
        const totalIndividuals = storeIndividuals
          ? storeIndividuals.filter((i) => i.partner_id === selectedPartner?.id)
              .length
          : 0;

        // Total people count (groups + individuals)
        const totalPeopleWithPartner = totalPeopleInGroups + totalIndividuals;

        const partnerSizeLimit = selectedPartner?.size || 0;

        // Check if adding another person would exceed the partner's total capacity
        if (totalPeopleWithPartner >= partnerSizeLimit) {
          toast.error(
            `No se pueden agregar más personas. El socio ya tiene ${totalPeopleWithPartner} personas asignadas de un límite de ${partnerSizeLimit}.`
          );
          return false;
        }

        await addIndividual({
          ...individualData,
          partnerId: selectedPartner?.id,
        });
        return true;
      } catch (error) {
        console.error("Error adding individual:", error);
        return false;
      }
    },
    [
      addIndividual,
      selectedPartner?.id,
      selectedPartner?.size,
      storeGroups,
      storeIndividuals,
    ]
  );

  const handleDeleteGroup = useCallback(
    (groupId) => {
      deleteGroup(groupId);
    },
    [deleteGroup]
  );

  const handleAddMember = (groupId, personData) => {
    addPersonToGroup({
      groupId,
      personData,
    });
  };

  const handleRemoveMember = (groupId, personId) => {
    removePersonFromGroup({ groupId, personId });
  };

  const handleRemoveIndividual = (id) => {
    removeIndividual(id);
  };

  // Add a console log to debug the loading state
  useEffect(() => {
    if (isLoading) {
      // console.log("Viajeros: Loading state is true");
      // console.log("Loading states:", {
      //   isLoadingPartners,
      //   individualsLoading: !storeIndividuals.length, // Changed from individuals
      //   groupsLoading: !storeGroups.length, // Changed from groups
      // });
    }
  }, [isLoading, isLoadingPartners, storeIndividuals, storeGroups]); // Updated dependency array

  // Cuando renderizamos la UI, ya no incluimos el PartnerSelector
  if (!partnerToDisplay) {
    return (
      <ProtectedRoute>
        <div>
          {/* Eliminamos el PartnerSelector de aquí */}
          <div className="p-8 flex flex-col items-center justify-center h-[60vh]">
            <Briefcase className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-medium text-gray-700 text-center">
              No hay grupo seleccionado
            </h2>
            <p className="text-gray-500 mt-2 mb-8 text-center">
              {partners.length > 0
                ? "Selecciona un grupo desde la barra superior o crea uno nuevo"
                : "No hay partners disponibles para esta fecha. Crea un grupo para comenzar"}
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  // Only show loading state if we're actually loading AND don't have data yet
  else if (isLoading && !storeIndividuals.length && !storeGroups.length) {
    return (
      <ProtectedRoute>
        <div>
          {/* Eliminamos el PartnerSelector de aquí también */}
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2">Cargando datos...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div>
        {/* Eliminamos el PartnerSelector de aquí */}

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-primary">
              Gestión de Viajeros
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {/* Botón para agregar grupo - Mejorado con estilo más prominente */}
                <Dialog
                  open={openDialog.group}
                  onOpenChange={(open) =>
                    setOpenDialog((prev) => ({ ...prev, group: open }))
                  }
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <Users className="h-4 w-4" />
                      <span>Añadir Grupo</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        Añadir grupo a {selectedPartner?.name || "partner"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <NewGroupForm
                        onAddGroup={handleAddGroup}
                        partnerId={selectedPartner?.id}
                        partnerName={selectedPartner?.name}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Botón para agregar persona individual */}
                <Dialog
                  open={openDialog.individual}
                  onOpenChange={(open) =>
                    setOpenDialog((prev) => ({ ...prev, individual: open }))
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <User className="h-4 w-4" />
                      <span>Añadir Personas</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Añadir personas a {selectedPartner?.name || "partner"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <NewIndividualForm
                        onAddIndividual={handleAddIndividual}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Componente existente para importar desde texto */}
                <BulkGroupImport />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Panel de personas individuales con los datos filtrados por fecha */}
            <div>
              <IndividualsList
                individuals={filteredIndividuals}
                isLoading={isLoading}
                onRemoveIndividual={removeIndividual}
              />
            </div>

            {/* Panel de grupos con los datos filtrados por fecha */}
            <div className="md:col-span-2">
              <GroupsList
                isLoading={isLoading}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
