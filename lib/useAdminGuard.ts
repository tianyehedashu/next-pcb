import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/userStore";

export function useAdminGuard() {
  const user = useUserStore(state => state.user);
  const isAdmin = useUserStore(state => state.isAdmin);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    if (!user) {
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
  }, [user, isAdmin]);

  return { loading, error, isAdmin: isAdmin() };
} 