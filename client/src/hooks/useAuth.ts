import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: 'always',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // If there's an error or user is null, consider as not authenticated but not loading
  const actuallyLoading = isLoading && !isError;

  return {
    user,
    isLoading: actuallyLoading,
    isAuthenticated: !!user,
  };
}
