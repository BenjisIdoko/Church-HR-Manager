import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, loginUser, logoutUser } from "../utils/api";
import { User } from "../types/models";

export function useAuth() {
  const queryClient = useQueryClient();

  const cachedUser = (() => {
    try {
      const saved = localStorage.getItem("church_hr_user");
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  })();

  const {
    data: user = cachedUser,
    isLoading: loadingSession,
    error,
    refetch: refreshSession,
  } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const u = await getCurrentUser();
        if (u) {
          localStorage.setItem("church_hr_user", JSON.stringify(u));
        } else {
          localStorage.removeItem("church_hr_user");
        }
        return u;
      } catch (err) {
        localStorage.removeItem("church_hr_user");
        return null;
      }
    },
    staleTime: 1000 * 60 * 15,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { identifier: string; password: string }) => {
      return await loginUser(credentials.identifier, credentials.password);
    },
    onSuccess: (loggedUser: User) => {
      if (loggedUser) {
        localStorage.setItem("church_hr_user", JSON.stringify(loggedUser));
        queryClient.setQueryData(["auth", "me"], loggedUser);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logoutUser();
    },
    onSuccess: () => {
      localStorage.removeItem("church_hr_user");
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
    },
  });

  return {
    user: user ?? null,
    loadingSession,
    error,
    refreshSession,
    login: (identifier: string, password: string) =>
      loginMutation.mutateAsync({ identifier, password }),
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
  };
}
