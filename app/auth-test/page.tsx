"use client";

import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, User, Mail, Clock, Shield } from "lucide-react";

export default function AuthTestPage() {
  const { user, session, loading, signOut, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono animate-pulse">
          <Terminal className="h-8 w-8 animate-spin" />
          <p className="mt-2">$ loading auth state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Terminal className="h-8 w-8 text-green-400" />
            <h1 className="text-2xl font-mono text-green-400">root@edos-shield: ~/auth-test</h1>
          </div>
          <p className="text-green-600 font-mono"># Testing Supabase Authentication System</p>
        </div>

        <Card className="bg-gray-900 border-green-500/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-400 font-mono">
              <Shield className="h-5 w-5" />
              <span>Authentication Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge
                variant={isAuthenticated ? "default" : "destructive"}
                className={`font-mono ${
                  isAuthenticated
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-red-500/20 text-red-300 border-red-500/30"
                }`}
              >
                STATUS: {isAuthenticated ? "AUTHENTICATED" : "UNAUTHENTICATED"}
              </Badge>
            </div>

            {isAuthenticated && user && (
              <div className="space-y-3 p-4 bg-black/50 rounded border border-green-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-green-400" />
                      <span className="text-green-600 font-mono">USER_ID:</span>
                      <span className="text-white font-mono text-xs">{user.id}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-green-400" />
                      <span className="text-green-600 font-mono">EMAIL:</span>
                      <span className="text-white font-mono">{user.email}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-green-400" />
                      <span className="text-green-600 font-mono">NAME:</span>
                      <span className="text-white font-mono">
                        {user.user_metadata?.full_name || user.user_metadata?.display_name || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-green-400" />
                      <span className="text-green-600 font-mono">CREATED:</span>
                      <span className="text-white font-mono text-xs">{new Date(user.created_at).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Shield className="h-4 w-4 text-green-400" />
                      <span className="text-green-600 font-mono">PROVIDER:</span>
                      <span className="text-white font-mono">{user.app_metadata?.provider || "email"}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-green-400" />
                      <span className="text-green-600 font-mono">LAST_SIGN_IN:</span>
                      <span className="text-white font-mono text-xs">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={signOut}
                    variant="destructive"
                    className="w-full font-mono bg-red-600 hover:bg-red-500"
                  >
                    $ ./logout --force
                  </Button>

                  <div className="text-center">
                    <p className="text-green-600 font-mono text-xs"># Click logout to test session termination</p>
                  </div>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
                <p className="text-red-300 font-mono text-center"># No active session detected</p>
                <p className="text-red-400 font-mono text-center text-sm mt-2">
                  Please authenticate to access the system
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Details */}
        {session && (
          <Card className="bg-gray-900 border-green-500/30 text-white">
            <CardHeader>
              <CardTitle className="text-green-400 font-mono">Session Information</CardTitle>
              <CardDescription className="text-green-600 font-mono"># Raw session data from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-black p-4 rounded text-xs text-green-400 font-mono overflow-auto max-h-96">
                {JSON.stringify(session, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
