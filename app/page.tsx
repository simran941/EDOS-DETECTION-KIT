"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Terminal, Code, Activity, Lock, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/components/auth-context";

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [threatCount, setThreatCount] = useState(847329);
  const [terminalText, setTerminalText] = useState("");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      console.log("🏠 HomePage: User authenticated, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const terminalLines = [
    "$ sudo systemctl status edos-shield",
    "● edos-shield.service - EDoS Detection System",
    "   Loaded: loaded (/etc/systemd/system/edos-shield.service)",
    "   Active: active (running) since Wed 2024-11-06 14:23:01 UTC",
    '   Status: "Monitoring 1,247 endpoints"',
    "$ tail -f /var/log/edos-shield/threats.log",
    "[INFO] Blocked 847,329 attacks in last 24h",
    "[WARN] Suspicious traffic from 192.168.1.100",
    "[INFO] ML model accuracy: 99.97%",
  ];

  // Live threat counter
  useEffect(() => {
    const interval = setInterval(() => {
      setThreatCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Terminal typing animation
  useEffect(() => {
    if (currentLineIndex < terminalLines.length) {
      const currentLine = terminalLines[currentLineIndex];
      let charIndex = 0;

      const typeInterval = setInterval(() => {
        if (charIndex < currentLine.length) {
          setTerminalText((prev) => prev + currentLine[charIndex]);
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setTerminalText((prev) => prev + "\n");
            setCurrentLineIndex((prev) => prev + 1);
          }, 500);
        }
      }, 30);

      return () => clearInterval(typeInterval);
    }
  }, [currentLineIndex]);

  const handleAuthClick = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-xl">$ initializing security protocols...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      {/* Matrix-style background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 md:p-8 border-b border-green-500/20">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-green-400" />
          <span className="text-2xl font-bold text-green-400">[root@edos-shield ~]#</span>
        </div>
        <div className="flex space-x-4">
          <Button
            variant="ghost"
            className="text-green-400 hover:text-black hover:bg-green-400 border border-green-500/30 font-mono"
            onClick={() => handleAuthClick("login")}
          >
            ./login
          </Button>
          <Button
            className="bg-green-500 text-black hover:bg-green-400 font-mono font-bold"
            onClick={() => handleAuthClick("signup")}
          >
            ./register
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Left Column - Title */}
            <div className="space-y-8">
              <div>
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-green-300 border-green-500/30 px-4 py-2 mb-6 font-mono"
                >
                  [SYSTEM STATUS: ACTIVE]
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight text-green-400 mb-6">
                  EDoS Detection
                  <br />
                  <span className="text-white">& Response System</span>
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed font-mono">
                  Military-grade DDoS protection system with real-time threat detection, automated response protocols,
                  and comprehensive security monitoring. Built for security professionals who demand precision.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-green-500 text-black hover:bg-green-400 font-mono font-bold px-8 py-4 text-lg"
                  onClick={() => handleAuthClick("signup")}
                >
                  ./initialize --setup
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black font-mono px-8 py-4 text-lg"
                  onClick={() => handleAuthClick("login")}
                >
                  ./demo --live
                </Button>
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              <Card className="bg-gray-900 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-400 font-mono">[THREATS_BLOCKED]</span>
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30 font-mono">LIVE</Badge>
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">{threatCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400 font-mono">attacks neutralized today</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-400 font-mono">[RESPONSE_TIME]</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-mono">OPTIMAL</Badge>
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">&lt; 50ms</div>
                  <div className="text-sm text-gray-400 font-mono">average detection latency</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-400 font-mono">[ACCURACY_RATE]</span>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono">ML</Badge>
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">99.97%</div>
                  <div className="text-sm text-gray-400 font-mono">threat classification accuracy</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Modules */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-green-400 font-mono">[SYSTEM_MODULES]</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-gray-900 border-green-500/30 hover:border-green-500/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded flex items-center justify-center">
                      <Terminal className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white font-mono">./detect</h3>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs font-mono">
                        REAL-TIME
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm font-mono leading-relaxed">
                    Advanced ML algorithms analyze network patterns in real-time. Detects anomalies with 99.97% accuracy
                    at sub-50ms latency.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-green-500/30 hover:border-green-500/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center">
                      <Activity className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white font-mono">./visualize</h3>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs font-mono">3D</Badge>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm font-mono leading-relaxed">
                    Interactive threat visualization with geolocation mapping. Real-time attack vectors displayed on 3D
                    network topology.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-green-500/30 hover:border-green-500/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded flex items-center justify-center">
                      <Lock className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white font-mono">./mitigate</h3>
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs font-mono">AUTO</Badge>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm font-mono leading-relaxed">
                    Automated incident response with custom playbooks. Intelligent traffic filtering and threat
                    neutralization.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-green-400 font-mono">[PERFORMANCE_METRICS]</h2>

            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center space-y-3">
                  <div className="text-4xl font-bold text-green-400 font-mono">99.99%</div>
                  <div className="text-gray-300 font-mono text-sm uppercase tracking-wider">uptime_sla</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "99.99%" }}></div>
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <div className="text-4xl font-bold text-blue-400 font-mono">&lt;50ms</div>
                  <div className="text-gray-300 font-mono text-sm uppercase tracking-wider">detection_time</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <div className="text-4xl font-bold text-yellow-400 font-mono">2.1M</div>
                  <div className="text-gray-300 font-mono text-sm uppercase tracking-wider">packets_per_sec</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "88%" }}></div>
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <div className="text-4xl font-bold text-red-400 font-mono">24/7</div>
                  <div className="text-gray-300 font-mono text-sm uppercase tracking-wider">monitoring</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Window */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-8 text-green-400 font-mono">[LIVE_MONITORING]</h2>
            <div className="bg-gray-900 border border-green-500/30 rounded-lg overflow-hidden max-w-5xl mx-auto">
              {/* Terminal Header */}
              <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-green-500/30">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-green-400 text-sm ml-4">root@edos-shield: /var/log/security</span>
              </div>

              {/* Terminal Content */}
              <div className="p-6 h-80 overflow-hidden">
                <div className="space-y-1 text-sm">
                  <div className="text-green-400">$ sudo systemctl status edos-shield</div>
                  <div className="text-blue-400">● edos-shield.service - EDoS Detection System</div>
                  <div className="text-gray-300"> Loaded: loaded (/etc/systemd/system/edos-shield.service)</div>
                  <div className="text-green-400"> Active: active (running) since Wed 2024-11-06 14:23:01 UTC</div>
                  <div className="text-yellow-400"> Status: &quot;Monitoring 1,247 endpoints&quot;</div>
                  <div className="text-green-400 mt-3">$ tail -f /var/log/edos-shield/threats.log</div>
                  <div className="text-green-300">
                    [INFO] Blocked {threatCount.toLocaleString()} attacks in last 24h
                  </div>
                  <div className="text-yellow-300">[WARN] Suspicious traffic from 192.168.1.100</div>
                  <div className="text-green-300">[INFO] ML model accuracy: 99.97%</div>
                  <div className="text-red-300">[ALERT] DDoS attempt detected from botnet</div>
                  <div className="text-green-300">[INFO] Auto-mitigation activated</div>
                  <div className="text-blue-300">[DEBUG] Processing 2.1M packets/sec</div>
                  <div className="text-cyan-300">[INFO] Geolocation: Attack source traced to Eastern Europe</div>
                  <div className="text-purple-300">[INFO] Firewall rules updated automatically</div>
                  <div className="text-green-400 animate-pulse">█</div>
                </div>
              </div>
            </div>
          </div>

          {/* Command Line CTA */}
          <div className="text-center mb-20">
            <div className="bg-gray-900 border border-green-500/30 rounded-lg p-8 max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 font-mono ml-4">root@security-ops: /home/deploy</span>
                </div>

                <div className="text-left space-y-2 font-mono text-sm">
                  <div className="text-green-400">$ curl -sSL https://install.edos-shield.com/deploy | bash</div>
                  <div className="text-gray-400"># Initializing EDoS Shield deployment...</div>
                  <div className="text-blue-400"># Checking system requirements... ✓</div>
                  <div className="text-green-300"># Installing ML detection engine... ✓</div>
                  <div className="text-yellow-400"># Configuring threat database... ✓</div>
                  <div className="text-green-400"># Ready to protect your infrastructure</div>
                </div>

                <div className="pt-6 space-y-4">
                  <h3 className="text-2xl font-bold text-white font-mono">Ready to deploy enterprise security?</h3>
                  <p className="text-gray-300 font-mono">
                    Join 500+ security teams already protecting critical infrastructure
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button
                      size="lg"
                      className="bg-green-500 text-black hover:bg-green-400 font-mono font-bold px-8 py-4"
                      onClick={() => handleAuthClick("signup")}
                    >
                      $ ./deploy --production
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-green-500 text-green-400 hover:bg-green-500 hover:text-black font-mono px-8 py-4"
                      onClick={() => handleAuthClick("login")}
                    >
                      $ ./demo --interactive
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
