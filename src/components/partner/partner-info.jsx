import { Calendar, Users, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
// import { usePartnerStore } from "@/store/partnerStore";
import { useTravelerStore } from "@/store/travelerStore";

export function PartnerInfo() {
  // Get partner directly from store
  const partner = useTravelerStore((state) => state.selectedPartner);

  if (!partner) return null;

  // Formatear las fechas al formato español (día/mes/año)
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: es });
    } catch (error) {
      return dateString; // Si hay error, mostrar la fecha sin formato
    }
  };

  const startDate = formatDate(partner.start_date);
  const endDate = partner.end_date ? formatDate(partner.end_date) : null;

  return (
    <div className="flex items-center gap-6 text-sm text-gray-600 ">
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        <span>{partner.size || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>{partner.days || 5} días</span>
      </div>
      <div className="flex items-center gap-2">
        Llegada:
        <Calendar className="h-4 w-4" />
        <span>{startDate}</span>
      </div>
      {endDate && (
        <div className="flex items-center gap-2">
          Salida:
          <Calendar className="h-4 w-4" />
          <span>{endDate}</span>
        </div>
      )}
    </div>
  );
}
