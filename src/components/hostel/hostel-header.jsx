import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export function HostelHeader({ hostel, onDelete }) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="flex gap-8 items-center">
        <h3 className="text-xl font-semibold leading-6 p-0">{hostel.name}</h3>
      </div>
      <div className="flex space-x-2">
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(hostel.id)} // Pass the ID parameter to onDelete
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
