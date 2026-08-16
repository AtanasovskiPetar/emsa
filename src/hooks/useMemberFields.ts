import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import type { MemberFieldDefinition } from "@/constants/types";
import { apiClient } from "@/lib/api-client";

export function useMemberFields() {
  return useQuery({
    queryKey: queryKeys.memberFields(),
    queryFn: () => apiClient.get<MemberFieldDefinition[]>(ApiRoutes.MEMBER_FIELDS),
    staleTime: Infinity,
  });
}
