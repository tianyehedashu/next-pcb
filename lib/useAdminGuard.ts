import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";

export function useAdminGuard() {
  const { fetchUser, isAdmin } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      await fetchUser();
      const currentUser = useUserStore.getState().user;
      if (!currentUser) {
        setError("Please login as admin.");
        setLoading(false);
        return;
      }
      if (!isAdmin()) {
        setError("You are not authorized to view this page.");
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
  }, []);

  return { loading, error, isAdmin: isAdmin() };
} 