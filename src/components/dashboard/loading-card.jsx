import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function LoadingCard({
  title,
  icon: Icon,
  itemCount = 3,
  itemHeight = 16,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {Icon && <Icon className="h-5 w-5" />}
          <div className="flex items-center gap-2">
            {title}
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <Skeleton key={i} className={`h-${itemHeight} w-full rounded-lg`} />
        ))}
      </CardContent>
    </Card>
  );
}
