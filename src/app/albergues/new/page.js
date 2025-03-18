"use client";

import { NavMenu } from "@/components/Nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHostels } from "@/hooks/useHostels";
import { toast } from "sonner";

export default function NewHostel() {
  const router = useRouter();
  const { addHostel } = useHostels();

  const [formData, setFormData] = useState({
    name: "",
    capacity: 0, // Add capacity field with default value
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    // Validate capacity is a positive number
    const capacity = parseInt(formData.capacity);
    if (isNaN(capacity) || capacity < 1) {
      toast.error("La capacidad debe ser un número positivo");
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure capacity is sent as a number, not string
      await addHostel({
        ...formData,
        capacity: capacity,
      });
      router.push("/albergues");
    } catch (error) {
      toast.error("Error al crear el albergue");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="p-8">
        <h1 className="text-4xl font-bold text-fuchsia-pink-900 mb-8">
          Nuevo Albergue
        </h1>

        <Card className="max-w-2xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Albergue</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Add capacity input */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad (plazas)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/albergues")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-fuchsia-pink-500 hover:bg-fuchsia-pink-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creando..." : "Crear Albergue"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
