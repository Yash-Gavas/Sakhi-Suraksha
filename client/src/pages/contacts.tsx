import { Users, Plus, Phone, Edit3, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmergencyContact } from "@shared/schema";

export default function Contacts() {
  const { toast } = useToast();
  
  const { data: contacts = [], isLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts/1"] // Demo user ID
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await fetch(`/api/emergency-contacts/${contactId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete contact');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts/1"] });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Emergency Contacts</h1>
          </div>
          <Button size="sm" variant="secondary">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-white p-4 border-b">
        <div className="flex justify-between text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{contacts.length}</p>
            <p className="text-xs text-gray-500">Total Contacts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{contacts.filter(c => c.isActive).length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{contacts.filter(c => c.isPrimary).length}</p>
            <p className="text-xs text-gray-500">Primary</p>
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
              <Button>
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
                      <Button size="sm" variant="ghost" className="text-gray-600">
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
