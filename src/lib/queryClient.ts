import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 auth errors
        if (error?.status === 401 || error?.status === 403 || error?.name === "AuthError") {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
