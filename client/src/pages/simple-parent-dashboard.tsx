import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Clock, 
  Shield, 
  Heart,
  CheckCircle,
  Bell,
  User,
  Settings,
  Home
} from "lucide-react";

interface EmergencyAlert {
  id: number;
  userId: string;
  triggerType: string;
  latitude: number;
  longitude: number;
  address: string;
  status: 'active' | 'resolved' | 'responding';
  createdAt: string;
  resolvedAt?: string;
  childName?: string;
}

interface ChildProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastSeen: string;
  status: 'safe' | 'emergency' | 'offline';
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
    timestamp: string;
  };
}

export default function SimpleParentDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectionCode, setConnectionCode] = useState("");
  const [currentView, setCurrentView] = useState<'home' | 'children' | 'settings'>('home');

  // Fetch connected children
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["/api/parent/children"],
    refetchInterval: 30000,
  });

  // Fetch emergency alerts
  const { data: emergencyAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/parent/emergency-alerts"],
    refetchInterval: 5000,
  });

  const connectChildMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch("/api/parent/connect-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionCode: code }),
      });
      if (!response.ok) throw new Error("Failed to connect child");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Child Connected",
        description: "Successfully connected to child's account",
      });
      setConnectionCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/parent/children"] });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Please check the connection code and try again",
        variant: "destructive",
      });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/parent/emergency-alerts/${alertId}/resolve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to resolve alert");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Resolved",
        description: "Emergency alert has been marked as resolved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/emergency-alerts"] });
    },
  });

  useEffect(() => {
    const activeAlerts = (emergencyAlerts as EmergencyAlert[]).filter(alert => alert.status === 'active');
    if (activeAlerts.length > 0) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwfCjSU2/DJeSkGLoLO8tzPkRALdLvw/5tnGQo8ltfz67JMHAZVN6');
        audio.play().catch(() => {});
      } catch (error) {
        // Audio not supported
      }
    }
  }, [emergencyAlerts]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'responding': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderHomeView = () => (
    <div className="space-y-6">
      {/* Emergency Alerts */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-800">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Emergency Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="text-center py-4">Loading alerts...</div>
          ) : (emergencyAlerts as EmergencyAlert[]).length === 0 ? (
            <div className="text-center py-4 text-green-700">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              No active emergencies
            </div>
          ) : (
            <div className="space-y-3">
              {(emergencyAlerts as EmergencyAlert[]).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getAlertStatusColor(alert.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">{alert.triggerType}</span>
                      <Badge variant="outline">{alert.status}</Badge>
                    </div>
                    <span className="text-sm">{formatTime(alert.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-3 h-3" />
                    <span>{alert.address}</span>
                  </div>
                  {alert.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => resolveAlertMutation.mutate(alert.id)}
                      disabled={resolveAlertMutation.isPending}
                      className="mt-2"
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Children Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Connected Children ({(children as ChildProfile[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {childrenLoading ? (
            <div className="text-center py-4">Loading children...</div>
          ) : (children as ChildProfile[]).length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              No children connected yet
            </div>
          ) : (
            <div className="space-y-3">
              {(children as ChildProfile[]).map((child) => (
                <div key={child.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{child.name}</h4>
                      <p className="text-sm text-gray-600">{child.phone}</p>
                    </div>
                    <Badge className={getStatusColor(child.status)}>
                      {child.status}
                    </Badge>
                  </div>
                  {child.currentLocation && (
                    <div className="mt-2 text-sm text-gray-600">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {child.currentLocation.address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderChildrenView = () => (
    <div className="space-y-6">
      {/* Connect Child */}
      <Card>
        <CardHeader>
          <CardTitle>Connect New Child</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Enter connection code from child's app"
              value={connectionCode}
              onChange={(e) => setConnectionCode(e.target.value)}
            />
            <Button
              onClick={() => connectChildMutation.mutate(connectionCode)}
              disabled={!connectionCode || connectChildMutation.isPending}
              className="w-full"
            >
              {connectChildMutation.isPending ? "Connecting..." : "Connect Child"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Children Details */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Children</CardTitle>
        </CardHeader>
        <CardContent>
          {(children as ChildProfile[]).length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No children connected yet</p>
              <p className="text-sm">Use the connection code from your child's app</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(children as ChildProfile[]).map((child) => (
                <div key={child.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{child.name}</h3>
                    <Badge className={getStatusColor(child.status)}>
                      {child.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-2" />
                      {child.phone}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-2" />
                      Last seen: {formatTime(child.lastSeen)}
                    </div>
                    {child.currentLocation && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
                        {child.currentLocation.address}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSettingsView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parent Dashboard Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Notification Preferences</h4>
              <p className="text-sm text-gray-600">
                Emergency alerts are automatically enabled for immediate notifications
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">Connection Status</h4>
              <p className="text-sm text-gray-600">
                Connected to {(children as ChildProfile[]).length} child(ren)
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium mb-2">Support</h4>
              <p className="text-sm text-gray-600">
                For help or technical support, contact your child's safety app administrator
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Parent Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor your child's safety</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <Heart className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          <Button
            variant={currentView === 'home' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('home')}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            variant={currentView === 'children' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('children')}
            className="flex-1"
          >
            <User className="w-4 h-4 mr-2" />
            Children
          </Button>
          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('settings')}
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {currentView === 'home' && renderHomeView()}
        {currentView === 'children' && renderChildrenView()}
        {currentView === 'settings' && renderSettingsView()}
      </div>
    </div>
  );
}