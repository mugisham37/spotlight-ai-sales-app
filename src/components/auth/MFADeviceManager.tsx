"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Smartphone, 
  Trash2, 
  Edit, 
  Plus, 
  Shield, 
  AlertTriangle,
  Calendar,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

interface MFADevice {
  id: string;
  name: string;
  type: "totp" | "backup_code";
  createdAt: Date;
  lastUsed?: Date;
  location?: string;
  isActive: boolean;
}

interface MFADeviceManagerProps {
  devices: MFADevice[];
  onDeviceUpdate?: (devices: MFADevice[]) => void;
}

export const MFADeviceManager: React.FC<MFADeviceManagerProps> = ({
  devices: initialDevices,
  onDeviceUpdate,
}) => {
  const [devices, setDevices] = useState<MFADevice[]>(initialDevices);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState<string | null>(null);
  const [showDeleteDevice, setShowDeleteDevice] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddDevice = async () => {
    if (!deviceName.trim()) {
      toast.error("Please enter a device name");
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would call an API to add a new TOTP device
      const newDevice: MFADevice = {
        id: crypto.randomUUID(),
        name: deviceName.trim(),
        type: "totp",
        createdAt: new Date(),
        isActive: true,
      };

      const updatedDevices = [...devices, newDevice];
      setDevices(updatedDevices);
      onDeviceUpdate?.(updatedDevices);
      
      setShowAddDevice(false);
      setDeviceName("");
      toast.success("Device added successfully");
    } catch (error) {
      toast.error("Failed to add device");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDevice = async (deviceId: string) => {
    if (!deviceName.trim()) {
      toast.error("Please enter a device name");
      return;
    }

    setIsLoading(true);
    try {
      const updatedDevices = devices.map(device =>
        device.id === deviceId
          ? { ...device, name: deviceName.trim() }
          : device
      );

      setDevices(updatedDevices);
      onDeviceUpdate?.(updatedDevices);
      
      setShowEditDevice(null);
      setDeviceName("");
      toast.success("Device updated successfully");
    } catch (error) {
      toast.error("Failed to update device");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    setIsLoading(true);
    try {
      const updatedDevices = devices.filter(device => device.id !== deviceId);
      setDevices(updatedDevices);
      onDeviceUpdate?.(updatedDevices);
      
      setShowDeleteDevice(null);
      toast.success("Device removed successfully");
    } catch (error) {
      toast.error("Failed to remove device");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDevice = async (deviceId: string) => {
    setIsLoading(true);
    try {
      const updatedDevices = devices.map(device =>
        device.id === deviceId
          ? { ...device, isActive: !device.isActive }
          : device
      );

      setDevices(updatedDevices);
      onDeviceUpdate?.(updatedDevices);
      
      const device = devices.find(d => d.id === deviceId);
      toast.success(`Device ${device?.isActive ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      toast.error("Failed to toggle device");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (device: MFADevice) => {
    setDeviceName(device.name);
    setShowEditDevice(device.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>MFA Devices</CardTitle>
            <CardDescription>
              Manage your multi-factor authentication devices
            </CardDescription>
          </div>
          <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New MFA Device</DialogTitle>
                <DialogDescription></DialogDescription>       Give your new authenticator device a recognizable name
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    placeholder="e.g., iPhone 15, Google Authenticator"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAddDevice}
                    disabled={isLoading || !deviceName.trim()}
                  >
                    {isLoading ? "Adding..." : "Add Device"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDevice(false);
                      setDeviceName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No MFA devices configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add an authenticator device to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{device.name}</p>
                      <Badge variant={device.isActive ? "default" : "secondary"}>
                        {device.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {device.type === "totp" && (
                        <Badge variant="outline">Authenticator</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Added {device.createdAt.toLocaleDateString()}</span>
                      </div>
                      {device.lastUsed && (
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3" />
                          <span>Last used {device.lastUsed.toLocaleDateString()}</span>
                        </div>
                      )}
                      {device.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{device.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleDevice(device.id)}
                    disabled={isLoading}
                  >
                    {device.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(device)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Dialog
                    open={showDeleteDevice === device.id}
                    onOpenChange={(open) => setShowDeleteDevice(open ? device.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          <span>Remove MFA Device</span>
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove "{device.name}"? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Make sure you have other MFA methods available before removing this device.
                        </AlertDescription>
                      </Alert>
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteDevice(device.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Removing..." : "Remove Device"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDevice(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Device Dialog */}
        <Dialog
          open={showEditDevice !== null}
          onOpenChange={(open) => {
            if (!open) {
              setShowEditDevice(null);
              setDeviceName("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Device Name</DialogTitle>
              <DialogDescription>
                Update the name for this MFA device
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-device-name">Device Name</Label>
                <Input
                  id="edit-device-name"
                  placeholder="Enter device name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => showEditDevice && handleEditDevice(showEditDevice)}
                  disabled={isLoading || !deviceName.trim()}
                >
                  {isLoading ? "Updating..." : "Update Device"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDevice(null);
                    setDeviceName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};