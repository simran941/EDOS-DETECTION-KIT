"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading, session } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're certain there's no authentication
    if (!loading && !user && !session && !hasRedirected) {
      console.log("🔐 AuthGuard: No user/session found, redirecting to home");
      setHasRedirected(true);
      router.push("/");
    } else if (user && session) {
      console.log("🔐 AuthGuard: User authenticated, allowing access");
    }
  }, [user, session, loading, router, hasRedirected]);

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
            <div className="text-xl">$ authenticating user...</div>
            <div className="text-sm text-green-600 mt-2">Please wait...</div>
          </div>
        </div>
      )
    );
  }

  // If no user and not loading, we should have redirected already
  if (!user || !session) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">$ redirecting to authentication...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
