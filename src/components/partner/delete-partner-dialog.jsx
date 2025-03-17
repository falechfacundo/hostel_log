import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";

export function DeletePartnerDialog({
  open,
  onOpenChange,
  partner,
  onConfirmDelete,
  deleting,
}) {
  const handleOpenChange = (open) => {
    if (!deleting) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Eliminar Partner
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas eliminar el partner &quot;{partner?.name}
            &quot;? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-red-500 font-medium">
            ¡Advertencia! Se eliminarán todos los datos asociados a este
            partner:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
            <li>Todos los grupos asignados a este partner</li>
            <li>Todas las personas individuales vinculadas</li>
            <li>Todas las asignaciones de albergues</li>
          </ul>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Partner
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
