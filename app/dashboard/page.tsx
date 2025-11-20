"use client";

import { Shield, Activity, AlertTriangle, Server, Network, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-context";

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-xl">$ initializing security interface...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="text-green-400 font-mono h-full">
          {/* Header */}
          <header className="border-b border-green-500/30 p-4">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-xl font-bold text-green-400">[SECURITY-DASHBOARD] Overview</h1>
                  <p className="text-sm text-green-600">
                    root@{user?.email?.split("@")[0] || "user"} | clearance: admin | session: active
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Welcome, {user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email}
                </Badge>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto p-6">
            {/* Status Banner */}
            <div className="mb-8">
              <Card className="bg-gray-900 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-mono">SYSTEM STATUS: OPERATIONAL</span>
                    </div>
                    <div className="text-green-300 font-mono text-sm">
                      Last update: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Active Threats */}
              <Card className="bg-gray-900 border-green-500/30 hover:border-green-400/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-400">Active Threats</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">127</div>
                  <p className="text-xs text-green-600">+23 from last hour</p>
                </CardContent>
              </Card>

              {/* Protected Assets */}
              <Card className="bg-gray-900 border-green-500/30 hover:border-green-400/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-400">Protected Assets</CardTitle>
                  <Shield className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">1,247</div>
                  <p className="text-xs text-green-600">All systems secured</p>
                </CardContent>
              </Card>

              {/* Network Traffic */}
              <Card className="bg-gray-900 border-green-500/30 hover:border-green-400/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-400">Network Traffic</CardTitle>
                  <Activity className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">2.1M/s</div>
                  <p className="text-xs text-green-600">Packets processed</p>
                </CardContent>
              </Card>

              {/* System Uptime */}
              <Card className="bg-gray-900 border-green-500/30 hover:border-green-400/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-400">System Uptime</CardTitle>
                  <Server className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">99.97%</div>
                  <p className="text-xs text-green-600">365 days running</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400 font-mono">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start text-left bg-transparent border border-green-500/30 text-green-400 hover:bg-green-500/10">
                    <Eye className="h-4 w-4 mr-3" />
                    ./monitor --real-time
                  </Button>
                  <Button className="w-full justify-start text-left bg-transparent border border-green-500/30 text-green-400 hover:bg-green-500/10">
                    <AlertTriangle className="h-4 w-4 mr-3" />
                    ./alerts --view-active
                  </Button>
                  <Button className="w-full justify-start text-left bg-transparent border border-green-500/30 text-green-400 hover:bg-green-500/10">
                    <Network className="h-4 w-4 mr-3" />
                    ./network --analyze
                  </Button>
                  <Button className="w-full justify-start text-left bg-transparent border border-green-500/30 text-green-400 hover:bg-green-500/10">
                    <Settings className="h-4 w-4 mr-3" />
                    ./config --security-policies
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400 font-mono">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300">[14:23:01] DDoS attack blocked</span>
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30">CRITICAL</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300">[14:22:45] Firewall rules updated</span>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">INFO</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300">[14:22:32] Suspicious IP detected</span>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">WARNING</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300">[14:22:18] System scan completed</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">SUCCESS</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Terminal Output Section */}
            <div className="mt-8">
              <Card className="bg-gray-900 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400 font-mono">Live Terminal Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black rounded p-4 h-64 overflow-y-auto font-mono text-sm">
                    <div className="space-y-1">
                      <div className="text-green-400">$ sudo systemctl status edos-shield</div>
                      <div className="text-blue-400">● edos-shield.service - EDoS Detection System</div>
                      <div className="text-green-300">[INFO] All systems operational</div>
                      <div className="text-yellow-300">[WARN] High traffic detected from 192.168.1.100</div>
                      <div className="text-green-300">[INFO] ML model accuracy: 99.97%</div>
                      <div className="text-red-300">[ALERT] DDoS attempt blocked</div>
                      <div className="text-green-300">[INFO] Auto-mitigation successful</div>
                      <div className="text-blue-300">
                        [DEBUG] Processing {Math.floor(Math.random() * 1000) + 2000}k packets/sec
                      </div>
                      <div className="text-green-400 animate-pulse">█</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
