import { Users, Plus, Phone, Edit3, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmergencyContactSchema, type EmergencyContact, type InsertEmergencyContact } from "@shared/schema";
import { useState } from "react";

export default function Contacts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  
  const { data: contacts = [], isLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
    enabled: !!user
  });

  const form = useForm<InsertEmergencyContact>({
    resolver: zodResolver(insertEmergencyContactSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      relationship: "",
      isActive: true,
      isPrimary: false
    }
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: InsertEmergencyContact) => {
      console.log('Making API request with data:', data);
      const response = await fetch("/api/emergency-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      console.log('API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to create contact: ${errorText}`);
      }
      const result = await response.json();
      console.log('API success response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Contact created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({
        title: "Contact Added",
        description: "Emergency contact has been added successfully.",
      });
      handleDialogClose();
    },
    onError: (error) => {
      console.error('Create contact error:', error);
      toast({
        title: "Error",
        description: `Failed to add contact: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEmergencyContact> }) => {
      const response = await fetch(`/api/emergency-contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({
        title: "Contact Updated",
        description: "Emergency contact has been updated successfully.",
      });
      handleDialogClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await fetch(`/api/emergency-contacts/${contactId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete contact');
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({
        title: "Contact Deleted",
        description: "Emergency contact has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    }
  });

  const callContact = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingContact(contact);
    form.reset({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship || "",
      isActive: contact.isActive || false,
      isPrimary: contact.isPrimary || false
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertEmergencyContact) => {
    console.log('Form submitted with data:', data);
    
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, data });
    } else {
      createContactMutation.mutate(data);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
    setSelectedCountryCode("+91");
    form.reset({
      name: "",
      phoneNumber: "",
      relationship: "",
      isActive: true,
      isPrimary: false
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Emergency Contacts</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? "Edit Contact" : "Add Emergency Contact"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <div className="flex gap-2">
                          <Select 
                            value={selectedCountryCode} 
                            onValueChange={setSelectedCountryCode}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+1">🇺🇸 +1</SelectItem>
                              <SelectItem value="+91">🇮🇳 +91</SelectItem>
                              <SelectItem value="+44">🇬🇧 +44</SelectItem>
                              <SelectItem value="+86">🇨🇳 +86</SelectItem>
                              <SelectItem value="+81">🇯🇵 +81</SelectItem>
                              <SelectItem value="+49">🇩🇪 +49</SelectItem>
                              <SelectItem value="+33">🇫🇷 +33</SelectItem>
                              <SelectItem value="+61">🇦🇺 +61</SelectItem>
                              <SelectItem value="+55">🇧🇷 +55</SelectItem>
                              <SelectItem value="+7">🇷🇺 +7</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormControl>
                            <Input 
                              placeholder="1234567890" 
                              className="flex-1"
                              onChange={(e) => {
                                // Remove any non-numeric characters and combine with country code
                                const cleanNumber = e.target.value.replace(/\D/g, '');
                                const fullNumber = cleanNumber ? selectedCountryCode + cleanNumber : '';
                                field.onChange(fullNumber);
                              }}
                              value={field.value ? field.value.replace(selectedCountryCode, '') : ''}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="colleague">Colleague</SelectItem>
                            <SelectItem value="neighbor">Neighbor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Active</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isPrimary"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Primary</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleDialogClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createContactMutation.isPending || updateContactMutation.isPending}
                      className="flex-1"
                    >
                      {editingContact ? "Update" : "Add"} Contact
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-card border-b p-4">
        <div className="flex justify-between text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{contacts.length}</p>
            <p className="text-xs text-muted-foreground">Total Contacts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{contacts.filter(c => c.isActive).length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{contacts.filter(c => c.isPrimary).length}</p>
            <p className="text-xs text-muted-foreground">Primary</p>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <main className="p-4 pb-24">
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Emergency Contacts</h3>
              <p className="text-gray-500 mb-4">Add trusted contacts to receive emergency alerts</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <Card key={contact.id} className="border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-800">{contact.name}</h3>
                          {contact.isPrimary && (
                            <Badge variant="default" className="bg-orange-100 text-orange-800 text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{contact.phoneNumber}</p>
                        {contact.relationship && (
                          <p className="text-xs text-gray-400">{contact.relationship}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => callContact(contact.phoneNumber)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-gray-600"
                        onClick={() => openEditDialog(contact)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => deleteContactMutation.mutate(contact.id)}
                        disabled={deleteContactMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Emergency Protocol Info */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-800">Emergency Protocol</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-3">
              When you trigger an SOS alert, all active contacts will receive:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Emergency SMS with your location</li>
              <li>• Live location sharing link</li>
              <li>• Push notification (if app installed)</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
