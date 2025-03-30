"use client";

import { useState, useRef, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { toast } from "sonner";
import { Plus, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useTravelerStore } from "@/store/travelerStore";
import { useDateStore } from "@/store/date-store";

// Import components
import { NewGroupForm } from "@/components/travelers/NewGroupForm";
import { NewIndividualForm } from "@/components/travelers/NewIndividualForm";
import { IndividualsList } from "@/components/travelers/IndividualsList";
import { GroupsList } from "@/components/travelers/GroupsList";

import Link from "next/link";

export default function Viajeros() {
  // Dialog state
  const [openDialog, setOpenDialog] = useState({
    group: false,
    individual: false,
  });

  // Use individual selectors to avoid reference equality issues
  // Get state from partnerStore
  const selectedPartner = useTravelerStore((state) => state.selectedPartner);
  const groups = useTravelerStore((state) => state.groups);
  const individuals = useTravelerStore((state) => state.individuals);
  const totalPersons = useTravelerStore((state) => state.totalPersons);
  const maxPersons = useTravelerStore((state) => state.maxPersons);

  // Get state from dateStore
  const selectedDate = useDateStore((state) => state.selectedDate);

  // Get state from travelerStore - use individual selectors
  const isLoading = useTravelerStore((state) => state.isLoading);
  const createGroup = useTravelerStore((state) => state.createGroup);
  const deleteGroup = useTravelerStore((state) => state.deleteGroup);
  const createIndividual = useTravelerStore((state) => state.createIndividual);
  const deleteIndividual = useTravelerStore((state) => state.deleteIndividual);
  const updatePerson = useTravelerStore((state) => state.updatePerson);
  const addPersonToGroup = useTravelerStore((state) => state.addPersonToGroup);
  const removePersonFromGroup = useTravelerStore(
    (state) => state.removePersonFromGroup
  );

  // Group handling functions
  const handleAddGroup = useCallback(
    async (groupData) => {
      try {
        // Add partner ID to group data
        const groupWithPartner = {
          ...groupData,
          partnerId: selectedPartner?.id,
        };

        await createGroup(groupWithPartner);

        // Close dialog after successful creation
        setOpenDialog((prev) => ({ ...prev, group: false }));
      } catch (error) {
        toast.error(`Error al crear grupo: ${error.message}`);
      }
    },
    [createGroup, selectedPartner?.id]
  );

  const handleAddIndividual = useCallback(
    async (individualData) => {
      try {
        // Add partner ID to individual data
        const individualWithPartner = {
          ...individualData,
          partnerId: selectedPartner?.id,
        };

        await createIndividual(individualWithPartner);

        // Close dialog after successful creation
        setOpenDialog((prev) => ({ ...prev, individual: false }));
      } catch (error) {
        toast.error(`Error al crear persona: ${error.message}`);
      }
    },
    [createIndividual, selectedPartner?.id]
  );

  const handleDeleteGroup = useCallback(
    (groupId) => {
      deleteGroup(groupId);
    },
    [deleteGroup]
  );

  const handleAddMember = useCallback(
    (groupId, personData) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) {
        toast.error("Grupo no encontrado");
        return;
      }

      addPersonToGroup({
        groupId,
        personData: {
          ...personData,
          partnerId: selectedPartner?.id,
        },
      });
    },
    [addPersonToGroup, groups, selectedPartner?.id]
  );

  const handleRemoveIndividual = useCallback(
    (id) => {
      deleteIndividual(id);
    },
    [deleteIndividual]
  );

  // Show empty state if no partner selected
  if (!selectedPartner) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-full p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">
              No hay grupo seleccionado
            </h2>
            <p className="text-muted-foreground mb-4">
              Selecciona o crea un grupo para gestionar viajeros
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-primary">
              Gestión de Viajeros
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Dialog
                  open={openDialog.group}
                  onOpenChange={(open) =>
                    setOpenDialog((prev) => ({ ...prev, group: open }))
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={
                        totalPersons == maxPersons - 1 ||
                        totalPersons == maxPersons ||
                        !selectedPartner
                      }
                    >
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
                      disabled={totalPersons == maxPersons || !selectedPartner}
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

                <Button
                  disabled={totalPersons == maxPersons || !selectedPartner}
                  asChild
                >
                  <Link href="/viajeros/new">Importar Viajeros</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <IndividualsList
                individuals={individuals}
                isLoading={isLoading}
                onRemoveIndividual={handleRemoveIndividual}
              />
            </div>

            <div className="md:col-span-2">
              <GroupsList
                groups={groups}
                isLoading={isLoading}
                onDeleteGroup={handleDeleteGroup}
                onAddMember={handleAddMember}
                onUpdatePerson={updatePerson}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
