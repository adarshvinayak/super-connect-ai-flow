
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { trackActivity } from '@/integrations/supabase/client';
import { toast } from "sonner";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile, updateSkills, updateIntents, uploadAndParseResume } = useUserProfile();
  
  // Form state
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Basic info state
  const [formData, setFormData] = useState({
    fullName: "",
    role: "",
    location: "",
    bio: "",
    skills: [] as string[],
    currentSkill: "",
    intents: [] as string[],
    education: [] as any[],
    employment: [] as any[]
  });

  // Education and Employment state
  const [currentEducation, setCurrentEducation] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: ""
  });
  
  const [currentEmployment, setCurrentEmployment] = useState({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    current: false,
    description: ""
  });

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (formData.currentSkill.trim() && !formData.skills.includes(formData.currentSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, formData.currentSkill.trim()],
        currentSkill: ""
      });
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const handleIntentChange = (intent: string) => {
    if (formData.intents.includes(intent)) {
      setFormData({
        ...formData,
        intents: formData.intents.filter(i => i !== intent)
      });
    } else {
      setFormData({
        ...formData,
        intents: [...formData.intents, intent]
      });
    }
  };

  // Education handlers
  const handleEducationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentEducation(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEducation = () => {
    if (currentEducation.institution) {
      setFormData({
        ...formData,
        education: [...formData.education, { ...currentEducation, id: Date.now().toString() }]
      });
      setCurrentEducation({
        institution: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: ""
      });
    }
  };

  const handleRemoveEducation = (id: string) => {
    setFormData({
      ...formData,
      education: formData.education.filter(edu => edu.id !== id)
    });
  };

  // Employment handlers
  const handleEmploymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentEmployment(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrentEmploymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentEmployment(prev => ({ ...prev, current: e.target.checked }));
  };

  const handleAddEmployment = () => {
    if (currentEmployment.company && currentEmployment.position) {
      setFormData({
        ...formData,
        employment: [...formData.employment, { ...currentEmployment, id: Date.now().toString() }]
      });
      setCurrentEmployment({
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        current: false,
        description: ""
      });
    }
  };

  const handleRemoveEmployment = (id: string) => {
    setFormData({
      ...formData,
      employment: formData.employment.filter(emp => emp.id !== id)
    });
  };
  
  // Resume upload and parsing
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploading(true);
    
    try {
      const resumeData = await uploadAndParseResume(file);
      
      if (resumeData) {
        // Update form data with parsed resume info
        setFormData(prev => ({
          ...prev,
          fullName: resumeData.name || prev.fullName,
          role: resumeData.skills?.[0] || prev.role,
          skills: resumeData.skills || prev.skills,
          education: resumeData.education?.map((edu: any, index: number) => ({
            id: `parsed-edu-${index}`,
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: edu.startDate,
            endDate: edu.endDate
          })) || prev.education,
          employment: resumeData.employment?.map((emp: any, index: number) => ({
            id: `parsed-emp-${index}`,
            company: emp.company,
            position: emp.position,
            startDate: emp.startDate,
            endDate: emp.endDate || (emp.current ? "" : ""),
            current: emp.current || false,
            description: emp.description || ""
          })) || prev.employment
        }));
        
        toast.success("Resume parsed successfully!");
      }
    } catch (error) {
      console.error("Resume parsing error:", error);
      toast.error("Failed to parse resume");
    } finally {
      setIsUploading(false);
    }
  };

  // Submit handler
  const handleComplete = async () => {
    if (!user) {
      toast.error("You must be signed in to complete onboarding");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update profile basics
      await updateProfile({
        fullName: formData.fullName,
        role: formData.role,
        location: formData.location,
        bio: formData.bio
      });
      
      // Update skills
      await updateSkills(formData.skills);
      
      // Update intents
      await updateIntents(formData.intents);
      
      // Add education entries
      for (const edu of formData.education) {
        await updateEducation(user.id, {
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.fieldOfStudy,
          start_date: edu.startDate,
          end_date: edu.endDate
        });
      }
      
      // Add employment entries
      for (const emp of formData.employment) {
        await updateEmployment(user.id, {
          company: emp.company,
          position: emp.position,
          start_date: emp.startDate,
          end_date: emp.current ? null : emp.endDate,
          current: emp.current,
          description: emp.description
        });
      }
      
      // Track completion activity
      await trackActivity(user.id, 'onboarding_complete', 'Completed user onboarding');
      
      toast.success("Profile setup complete!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error during onboarding:", error);
      toast.error("Failed to complete profile setup");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper to update education and employment in Supabase
  const updateEducation = async (userId: string, education: any) => {
    try {
      const { error } = await supabase
        .from('user_education')
        .insert({
          user_id: userId,
          ...education
        });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error adding education:", error);
      throw error;
    }
  };
  
  const updateEmployment = async (userId: string, employment: any) => {
    try {
      const { error } = await supabase
        .from('user_employment')
        .insert({
          user_id: userId,
          ...employment
        });
      
      if (error) throw error;
    } catch (error) {
      console.error("Error adding employment:", error);
      throw error;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Tabs defaultValue={String(step)} onValueChange={(val) => setStep(parseInt(val))}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">Let's set up your professional profile to connect with others</p>
        </div>
        
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="1">Basic Info</TabsTrigger>
          <TabsTrigger value="2">Experience</TabsTrigger>
          <TabsTrigger value="3">Networking Intents</TabsTrigger>
        </TabsList>
        
        {/* Step 1: Basic Info */}
        <TabsContent value="1">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Start by providing some basic details about yourself</CardDescription>
              
              {/* Resume Upload */}
              <div className="mt-4">
                <Label>Upload Resume (Optional)</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Upload your resume to automatically fill in your profile information
                </p>
                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="resume-upload"
                    className="flex items-center gap-2 px-4 py-2 border rounded cursor-pointer hover:bg-gray-50"
                  >
                    <Upload size={16} />
                    <span>Upload Resume</span>
                    <Input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleResumeUpload}
                      disabled={isUploading}
                    />
                  </Label>
                  {isUploading && (
                    <div className="flex items-center text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Parsing resume...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Professional Role</Label>
                <Input
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="e.g. Software Developer, Product Manager"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself and your professional background"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <div className="flex">
                  <Input
                    id="currentSkill"
                    name="currentSkill"
                    value={formData.currentSkill}
                    onChange={handleInputChange}
                    placeholder="Add skills (e.g. React, Project Management)"
                    className="rounded-r-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddSkill}
                    className="rounded-l-none"
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {formData.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    </Badge>
                  ))}
                  {formData.skills.length === 0 && (
                    <p className="text-sm text-gray-500">No skills added yet</p>
                  )}
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button onClick={() => setStep(2)}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Step 2: Education & Employment */}
        <TabsContent value="2">
          <Card>
            <CardHeader>
              <CardTitle>Education & Experience</CardTitle>
              <CardDescription>Tell us about your educational background and work experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Education Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Education</h3>
                
                <div className="space-y-4 mb-6">
                  {formData.education.map((edu) => (
                    <div key={edu.id} className="border rounded-md p-4 relative">
                      <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        onClick={() => handleRemoveEducation(edu.id)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      
                      <h4 className="font-medium">{edu.institution}</h4>
                      {edu.degree && (
                        <p className="text-sm">
                          {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                        </p>
                      )}
                      {(edu.startDate || edu.endDate) && (
                        <p className="text-sm text-gray-500 mt-1">
                          {edu.startDate} - {edu.endDate || 'Present'}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {formData.education.length === 0 && (
                    <p className="text-gray-500 text-sm">No education entries added yet</p>
                  )}
                </div>
                
                <div className="border rounded-md p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Add Education</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="institution">Institution</Label>
                      <Input
                        id="institution"
                        name="institution"
                        value={currentEducation.institution}
                        onChange={handleEducationChange}
                        placeholder="University/School Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="degree">Degree</Label>
                      <Input
                        id="degree"
                        name="degree"
                        value={currentEducation.degree}
                        onChange={handleEducationChange}
                        placeholder="e.g. Bachelor's"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1">
                      <Label htmlFor="fieldOfStudy">Field of Study</Label>
                      <Input
                        id="fieldOfStudy"
                        name="fieldOfStudy"
                        value={currentEducation.fieldOfStudy}
                        onChange={handleEducationChange}
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="month"
                        value={currentEducation.startDate}
                        onChange={handleEducationChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="month"
                        value={currentEducation.endDate}
                        onChange={handleEducationChange}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleAddEducation}
                    disabled={!currentEducation.institution}
                  >
                    Add Education
                  </Button>
                </div>
              </div>
              
              {/* Employment Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Employment</h3>
                
                <div className="space-y-4 mb-6">
                  {formData.employment.map((emp) => (
                    <div key={emp.id} className="border rounded-md p-4 relative">
                      <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        onClick={() => handleRemoveEmployment(emp.id)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      
                      <h4 className="font-medium">{emp.position}</h4>
                      <p className="text-sm">{emp.company}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {emp.startDate} - {emp.current ? 'Present' : emp.endDate}
                      </p>
                      {emp.description && (
                        <p className="text-sm mt-2">{emp.description}</p>
                      )}
                    </div>
                  ))}
                  
                  {formData.employment.length === 0 && (
                    <p className="text-gray-500 text-sm">No employment entries added yet</p>
                  )}
                </div>
                
                <div className="border rounded-md p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Add Employment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        value={currentEmployment.company}
                        onChange={handleEmploymentChange}
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        name="position"
                        value={currentEmployment.position}
                        onChange={handleEmploymentChange}
                        placeholder="e.g. Senior Developer"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="month"
                        value={currentEmployment.startDate}
                        onChange={handleEmploymentChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="month"
                        value={currentEmployment.endDate}
                        onChange={handleEmploymentChange}
                        disabled={currentEmployment.current}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        id="current"
                        name="current"
                        type="checkbox"
                        checked={currentEmployment.current}
                        onChange={handleCurrentEmploymentChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="current" className="ml-2">
                        I currently work here
                      </Label>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={currentEmployment.description}
                      onChange={handleEmploymentChange}
                      placeholder="Brief description of your role and responsibilities"
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleAddEmployment}
                    disabled={!currentEmployment.company || !currentEmployment.position}
                  >
                    Add Employment
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Step 3: Networking Intents */}
        <TabsContent value="3">
          <Card>
            <CardHeader>
              <CardTitle>Networking Intentions</CardTitle>
              <CardDescription>What are you looking for from your professional network?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Select all that apply:</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { value: "cofounder", label: "Co-founder", description: "Finding a co-founder for a new venture" },
                    { value: "mentor", label: "Mentor", description: "Looking for mentorship and guidance" },
                    { value: "mentee", label: "Mentee", description: "Offering mentorship to others" },
                    { value: "investors", label: "Investors", description: "Looking for funding or investment" },
                    { value: "client", label: "Client", description: "Looking for clients for your services" },
                    { value: "service provider", label: "Service Provider", description: "Offering professional services" },
                    { value: "teammate", label: "Teammate", description: "Looking to join a team or hire team members" },
                    { value: "general networking", label: "General Networking", description: "Building professional connections" }
                  ].map((intent) => (
                    <div
                      key={intent.value}
                      className={`border rounded-md p-4 cursor-pointer transition-colors ${
                        formData.intents.includes(intent.value) 
                          ? "border-blue-500 bg-blue-50" 
                          : "hover:border-gray-400"
                      }`}
                      onClick={() => handleIntentChange(intent.value)}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          formData.intents.includes(intent.value) 
                            ? "bg-blue-500" 
                            : "bg-gray-200"
                        }`}></div>
                        <div>
                          <h4 className="font-medium">{intent.label}</h4>
                          <p className="text-sm text-gray-500">{intent.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={isSubmitting || !formData.fullName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Import Supabase for direct database access
import { supabase } from "@/integrations/supabase/client";

export default OnboardingPage;
