import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";

export function EditHostelForm({ hostel, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: hostel.name,
    capacity: hostel.capacity || 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    // Parse capacity as number
    if (name === "capacity") {
      parsedValue = parseInt(value, 10) || 0;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Editar Albergue</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre del albergue"
            required
          />
        </div>

        <div>
          <Label htmlFor="capacity">Capacidad total</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="0"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="Capacidad total"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Guardar
        </Button>
      </div>
    </form>
  );
}
