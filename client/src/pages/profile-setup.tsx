import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { upsertUserSchema, type UpsertUser, type User } from "@shared/schema";
import OTPVerification from "@/components/otp-verification";
import { userSession } from "@/lib/userSession";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Check, 
  X, 
  ArrowRight,
  UserCheck
} from "lucide-react";
import { z } from "zod";

const profileSetupSchema = upsertUserSchema.extend({
  confirmEmail: z.string().email("Please enter a valid email address"),
  countryCode: z.string().min(1, "Please select a country code")
}).refine((data) => data.email === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ["confirmEmail"],
});

type ProfileSetupData = z.infer<typeof profileSetupSchema>;

export default function ProfileSetup() {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Email Verification, 3: Phone Verification, 4: Complete
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPhone, setCurrentPhone] = useState("");

  const form = useForm<ProfileSetupData>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      confirmEmail: "",
      phoneNumber: "",
      emergencyMessage: "🚨 EMERGENCY ALERT 🚨\nI need immediate help! This is an automated SOS from Sakhi Suraksha app.\n\nLocation: [LIVE_LOCATION]\nTime: [TIMESTAMP]\nLive Stream: [STREAM_LINK]\n\nPlease contact me immediately or call emergency services.",
      countryCode: "+91"
    }
  });

  // Save profile data
  const saveProfileMutation = useMutation({
    mutationFn: async (data: UpsertUser) => {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Saved",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile.",
        variant: "destructive",
      });
    },
  });

  // Send email OTP
  const sendEmailOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email OTP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email OTP.",
        variant: "destructive",
      });
    },
  });

  // Send phone OTP
  const sendPhoneOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send phone OTP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "Check your phone for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send phone OTP.",
        variant: "destructive",
      });
    },
  });

  // Verify email OTP
  const verifyEmailOtpMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const response = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid OTP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsEmailVerified(true);
      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully.",
      });
      setStep(3); // Move to phone verification
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP.",
        variant: "destructive",
      });
    },
  });

  // Verify phone OTP
  const verifyPhoneOtpMutation = useMutation({
    mutationFn: async ({ phoneNumber, otp }: { phoneNumber: string; otp: string }) => {
      const response = await fetch("/api/auth/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid OTP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsPhoneVerified(true);
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully.",
      });
      setStep(4); // Move to completion
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP.",
        variant: "destructive",
      });
    },
  });

  // Load existing profile on component mount
  const { data: existingProfile } = useQuery<User>({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const userId = userSession.getUserId();
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true
  });

  // Update form with existing data if available
  useEffect(() => {
    if (existingProfile) {
      form.reset({
        firstName: existingProfile.firstName || "",
        lastName: existingProfile.lastName || "",
        email: existingProfile.email || "",
        confirmEmail: existingProfile.email || "",
        phoneNumber: existingProfile.phoneNumber?.replace(/^\+\d{1,3}/, '') || "",
        emergencyMessage: existingProfile.emergencyMessage || "🚨 EMERGENCY ALERT 🚨\nI need immediate help! This is an automated SOS from Sakhi Suraksha app.\n\nLocation: [LIVE_LOCATION]\nTime: [TIMESTAMP]\nLive Stream: [STREAM_LINK]\n\nPlease contact me immediately or call emergency services.",
        countryCode: "+91"
      });
      
      // If profile exists, mark as verified
      if (existingProfile.email) setIsEmailVerified(true);
      if (existingProfile.phoneNumber) setIsPhoneVerified(true);
      if (existingProfile.firstName && existingProfile.lastName) {
        setStep(4); // Go directly to completion if profile exists
      }
    }
  }, [existingProfile, form]);

  const handleBasicInfoSubmit = (data: ProfileSetupData) => {
    const userId = userSession.getUserId();
    
    // Save basic profile data with unique user ID
    const profileData: UpsertUser = {
      id: userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: selectedCountryCode + (data.phoneNumber || '').replace(/\D/g, ''),
      emergencyMessage: data.emergencyMessage
    };

    setCurrentEmail(data.email || '');
    setCurrentPhone(selectedCountryCode + (data.phoneNumber || '').replace(/\D/g, ''));
    
    saveProfileMutation.mutate(profileData);
    setStep(2); // Move to email verification
  };

  const handleEmailVerified = () => {
    setIsEmailVerified(true);
    setStep(3); // Move to phone verification
  };

  const handlePhoneVerified = () => {
    setIsPhoneVerified(true);
    setStep(4); // Move to completion
  };

  const renderStep1 = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleBasicInfoSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email address" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Email Address</FormLabel>
              <FormControl>
                <Input placeholder="Confirm your email address" type="email" {...field} />
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
                    placeholder="9876543210" 
                    {...field}
                    onChange={(e) => {
                      const cleanNumber = e.target.value.replace(/\D/g, '');
                      field.onChange(cleanNumber);
                    }}
                    className="flex-1"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Message Template</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Custom message sent during emergencies"
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={saveProfileMutation.isPending}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {saveProfileMutation.isPending ? "Saving..." : "Continue to Email Verification"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </Form>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Email Verification</h3>
        <p className="text-gray-600">
          Verify your email address to secure your account
        </p>
      </div>
      
      <OTPVerification
        identifier={currentEmail}
        type="email"
        onVerified={handleEmailVerified}
        onCancel={() => setStep(1)}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Phone Verification</h3>
        <p className="text-gray-600">
          Verify your phone number to secure your account
        </p>
      </div>
      
      <OTPVerification
        identifier={currentPhone}
        type="phone"
        onVerified={handlePhoneVerified}
        onCancel={() => setStep(2)}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <UserCheck className="w-16 h-16 mx-auto text-green-500" />
      <div>
        <h3 className="text-xl font-semibold mb-2">Profile Setup Complete!</h3>
        <p className="text-gray-600 mb-4">
          Your profile has been successfully verified and set up.
        </p>
        <div className="flex justify-center gap-4 mb-6">
          <Badge className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Email Verified
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Phone Verified
          </Badge>
        </div>
      </div>
      <Button
        onClick={() => window.location.href = '/'}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        Continue to Dashboard
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">Profile Setup</CardTitle>
            <p className="text-gray-600">Secure your account with verified contact information</p>
            
            {/* Progress Indicator */}
            <div className="flex justify-center space-x-2 mt-4">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-3 h-3 rounded-full ${
                    stepNumber <= step
                      ? 'bg-orange-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          
          <CardContent>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}