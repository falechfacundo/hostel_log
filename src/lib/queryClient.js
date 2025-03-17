import { QueryClient } from "@tanstack/react-query";

// Crear una instancia de QueryClient para usar en toda la aplicación
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos antes de considerar los datos obsoletos
      retry: 1, // Reintentar la consulta una vez si falla
    },
  },
});
