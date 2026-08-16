import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import type { OrganizationPublic } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

export function usePillarLabels() {
  const { data: org } = useQuery({
    queryKey: queryKeys.organization(),
    queryFn: () => apiClient.get<OrganizationPublic>(ApiRoutes.ORGANIZATION),
    staleTime: Infinity,
  });

  const singular = org?.pillarLabel || "Pillar";
  const plural = `${singular}s`;

  return {
    singular,
    plural,
    singularLower: singular.toLowerCase(),
    pluralLower: plural.toLowerCase(),
  };
}
