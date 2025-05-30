
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CVUpload from "@/components/CVUpload";
import EducationForm, { Education } from "@/components/EducationForm";
import EmploymentForm, { Employment } from "@/components/EmploymentForm";
import ProjectsForm, { Project } from "@/components/ProjectsForm";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [educationEntries, setEducationEntries] = useState<Education[]>([]);
  const [employmentEntries, setEmploymentEntries] = useState<Employment[]>([]);
  const [projectEntries, setProjectEntries] = useState<Project[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    // Ikigai
    purposeQuestion1: "",
    purposeQuestion2: "",
    purposeQuestion3: "",
    // Profile info
    fullName: "",
    location: "",
    bio: "",
    portfolioUrl: "",
    cvUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    // Networking intent
    networkingIntent: "cofounder", // Default value
    // Availability & working style
    availability: "full-time", // Default value
    workingStyle: "remote", // Default value
    // Profile visibility
    profileVisibility: "public", // Default value
  });

  useEffect(() => {
    // Check if the user is authenticated
    if (!user) {
      toast.error("You need to sign in to complete your profile");
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleCVParsed = (parsedData: any) => {
    // Handle parsed CV data by populating form fields
    try {
      console.log("CV parsed data:", parsedData);
      
      // Set basic information
      if (parsedData.name) {
        setFormData(prev => ({ ...prev, fullName: parsedData.name }));
      }
      
      // Set contact info
      if (parsedData.email && !formData.fullName) {
        // Only set email if we don't already have it from auth
      }
      
      // Set skills from parsed CV
      if (parsedData.skills && Array.isArray(parsedData.skills)) {
        const parsedSkills = parsedData.skills
          .filter((skill: string | null) => skill && typeof skill === 'string')
          .map((skill: string) => skill.trim())
          .filter((skill: string) => skill.length > 0);
        
        // Add new skills without duplicates
        const uniqueSkills = [...new Set([...skills, ...parsedSkills])];
        setSkills(uniqueSkills);
      }
      
      // Set education entries
      if (parsedData.education && Array.isArray(parsedData.education)) {
        const parsedEducation = parsedData.education.map((edu: any, index: number) => ({
          id: `parsed-edu-${index}`,
          institution: edu.institution || "",
          degree: edu.degree || "",
          fieldOfStudy: edu.field || edu.fieldOfStudy || "",
          startDate: edu.startDate || "",
          endDate: edu.endDate || "",
          description: edu.description || ""
        }));
        
        setEducationEntries(parsedEducation);
      }
      
      // Set employment entries
      if (parsedData.experience || parsedData.employment) {
        const employmentList = parsedData.experience || parsedData.employment;
        if (Array.isArray(employmentList)) {
          const parsedEmployment = employmentList.map((emp: any, index: number) => ({
            id: `parsed-emp-${index}`,
            company: emp.company || emp.organization || "",
            position: emp.position || emp.title || emp.role || "",
            startDate: emp.startDate || "",
            endDate: emp.endDate || "",
            description: emp.description || "",
            current: emp.current || false
          }));
          
          setEmploymentEntries(parsedEmployment);
        }
      }
      
      // Set project entries
      if (parsedData.projects && Array.isArray(parsedData.projects)) {
        const parsedProjects = parsedData.projects.map((proj: any, index: number) => ({
          id: `parsed-proj-${index}`,
          title: proj.title || proj.name || "",
          description: proj.description || "",
          url: proj.url || proj.link || ""
        }));
        
        setProjectEntries(parsedProjects);
      }
      
      toast.success("Successfully extracted information from your CV");
    } catch (error) {
      console.error("Error processing parsed CV data:", error);
      toast.error("Could not process all the information from your CV");
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to complete your profile.");
      navigate("/auth");
      return;
    }
    
    // Validate required fields
    if (!formData.fullName) {
      toast.error("Please provide your full name");
      return;
    }

    // Validate education entries (required)
    if (educationEntries.length === 0) {
      toast.error("Please add at least one education entry");
      return;
    }

    // Validate employment entries (required)
    if (employmentEntries.length === 0) {
      toast.error("Please add at least one employment entry");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Save user profile information
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          user_id: user.id,
          full_name: formData.fullName,
          location: formData.location,
          bio: formData.bio,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (userError) throw userError;
      
      // Save ikigai responses
      const ikigaiPromises = [
        {
          question_id: 1,
          response_text: formData.purposeQuestion1,
          user_id: user.id
        },
        {
          question_id: 2,
          response_text: formData.purposeQuestion2,
          user_id: user.id
        },
        {
          question_id: 3,
          response_text: formData.purposeQuestion3,
          user_id: user.id
        }
      ].map(response => 
        supabase.from('ikigai_responses').upsert(response)
      );
      
      await Promise.all(ikigaiPromises);
      
      // Save portfolio URL if provided
      if (formData.portfolioUrl) {
        await supabase.from('portfolios').upsert({
          user_id: user.id,
          portfolio_url: formData.portfolioUrl,
          description: "User portfolio"
        });
      }
      
      // Save social profile links
      const socialProfiles = [];
      
      if (formData.linkedinUrl) {
        socialProfiles.push({
          user_id: user.id,
          platform: "linkedin",
          profile_url: formData.linkedinUrl
        });
      }
      
      if (formData.githubUrl) {
        socialProfiles.push({
          user_id: user.id,
          platform: "github",
          profile_url: formData.githubUrl
        });
      }
      
      if (socialProfiles.length > 0) {
        await supabase.from('social_profiles').upsert(socialProfiles);
      }
      
      // Save networking intent
      const { data: intentData } = await supabase
        .from('intents')
        .select('intent_id')
        .eq('intent_name', formData.networkingIntent)
        .maybeSingle();
      
      if (intentData) {
        await supabase.from('user_intents').upsert({
          user_id: user.id,
          intent_id: intentData.intent_id,
          details: `${formData.availability}, ${formData.workingStyle}`
        });
      }
      
      // Save skills
      for (const skillName of skills) {
        // First check if skill exists
        let { data: skillData } = await supabase
          .from('skills')
          .select('skill_id')
          .eq('skill_name', skillName)
          .maybeSingle();
        
        // If skill doesn't exist, create it
        if (!skillData) {
          const { data: newSkill, error } = await supabase
            .from('skills')
            .insert({ skill_name: skillName })
            .select('skill_id')
            .single();
          
          if (error) throw error;
          skillData = newSkill;
        }
        
        // Link skill to user
        if (skillData) {
          await supabase.from('user_skills').upsert({
            user_id: user.id,
            skill_id: skillData.skill_id
          });
        }
      }
      
      // Save education entries
      for (const education of educationEntries) {
        await supabase.from('user_education').insert({
          user_id: user.id,
          institution: education.institution,
          degree: education.degree,
          field_of_study: education.fieldOfStudy,
          start_date: education.startDate,
          end_date: education.endDate,
          description: education.description
        });
      }
      
      // Save employment entries
      for (const employment of employmentEntries) {
        await supabase.from('user_employment').insert({
          user_id: user.id,
          company: employment.company,
          position: employment.position,
          start_date: employment.startDate,
          end_date: employment.endDate,
          description: employment.description,
          current: employment.current || false
        });
      }
      
      // Save project entries (optional)
      for (const project of projectEntries) {
        await supabase.from('user_projects').insert({
          user_id: user.id,
          title: project.title,
          description: project.description,
          url: project.url,
          image_url: project.imageUrl
        });
      }
      
      // Save user consent for profile visibility
      await supabase.from('user_consent').upsert({
        user_id: user.id,
        consent_type: "profile_visibility",
        consent_given: true,
        privacy_policy_version: "1.0"
      });
      
      toast.success("Profile created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(`Error: ${error.message || "Something went wrong. Please try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate required fields for each step before proceeding
    if (currentStep === 1) {
      // No validation for Ikigai questions
    } else if (currentStep === 2) {
      if (!formData.fullName) {
        toast.error("Please provide your full name");
        return;
      }
    } else if (currentStep === 5) {
      // Validate education entries (required)
      if (educationEntries.length === 0) {
        toast.error("Please add at least one education entry");
        return;
      }
    } else if (currentStep === 6) {
      // Validate employment entries (required)
      if (employmentEntries.length === 0) {
        toast.error("Please add at least one employment entry");
        return;
      }
    }
    
    setCurrentStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Tell us about yourself so we can connect you with the right people.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* Progress indicator */}
          <div className="px-6 pt-6">
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                  <div key={step} className="text-xs">
                    Step {step}
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full gradient-bg transition-all duration-300"
                  style={{ width: `${(currentStep / 8) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-6 animate-fade-in">
            {/* Step 1: Ikigai Questions */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-xl font-semibold">Your Purpose</div>
                <p className="text-gray-600">
                  Help us understand what drives you, so we can find meaningful connections.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="purposeQuestion1">What do you love to do?</Label>
                    <Textarea
                      id="purposeQuestion1"
                      name="purposeQuestion1"
                      value={formData.purposeQuestion1}
                      onChange={handleChange}
                      placeholder="What activities or work energize you?"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="purposeQuestion2">What are you good at?</Label>
                    <Textarea
                      id="purposeQuestion2"
                      name="purposeQuestion2"
                      value={formData.purposeQuestion2}
                      onChange={handleChange}
                      placeholder="What skills or talents do you have?"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="purposeQuestion3">What does the world need that you can provide?</Label>
                    <Textarea
                      id="purposeQuestion3"
                      name="purposeQuestion3"
                      value={formData.purposeQuestion3}
                      onChange={handleChange}
                      placeholder="What problems are you passionate about solving?"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={nextStep}>Next Step</Button>
                </div>
              </div>
            )}

            {/* Step 2: CV Upload */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-xl font-semibold">Upload Your CV/Resume</div>
                <p className="text-gray-600">
                  Let's start by uploading your CV or resume. This will help us pre-fill many of the following sections for you.
                </p>

                {user && (
                  <CVUpload 
                    userId={user.id} 
                    onCVParsed={handleCVParsed}
                  />
                )}

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button onClick={nextStep}>Next Step</Button>
                </div>
              </div>
            )}

            {/* Step 3: Basic Profile Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-xl font-semibold">Basic Information</div>
                <p className="text-gray-600">
                  Tell us who you are and how people can find you online.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name*</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, Country"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself in a few sentences"
                    className="mt-1"
                  />
                </div>

                
                <div>
                  <Label htmlFor="portfolioUrl">Portfolio URL (optional)</Label>
                  <Input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    placeholder="https://yourportfolio.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn URL (optional)</Label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourusername"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="githubUrl">GitHub URL (optional)</Label>
                  <Input
                    id="githubUrl"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/yourusername"
                    className="mt-1"
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button onClick={nextStep}>Next Step</Button>
                </div>
              </div>
            )}

            
            {/* Step 4: Networking Intent */}
            {currentStep === 4 && (
              <div className="space-y-6">
                
                <div className="text-xl font-semibold">Networking Goals</div>
                <p className="text-gray-600">
                  What type of connections are you primarily looking to make?
                </p>

                <RadioGroup
                  value={formData.networkingIntent}
                  onValueChange={(value) => handleSelectChange("networkingIntent", value)}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="cofounder" id="cofounder" />
                    <Label htmlFor="cofounder" className="flex-1 cursor-pointer">
                      <span className="font-medium">Co-founder</span>
                      <p className="text-sm text-gray-500">
                        Looking for someone to build a business with
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="client" id="client" />
                    <Label htmlFor="client" className="flex-1 cursor-pointer">
                      <span className="font-medium">Client</span>
                      <p className="text-sm text-gray-500">
                        Looking for companies or individuals to provide services to
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="teammate" id="teammate" />
                    <Label htmlFor="teammate" className="flex-1 cursor-pointer">
                      <span className="font-medium">Teammate</span>
                      <p className="text-sm text-gray-500">
                        Looking for collaboration in existing teams or projects
                      </p>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button onClick={nextStep}>Next Step</Button>
                </div>
              </div>
            )}

            {/* Step 5: Education */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-xl font-semibold">Education*</div>
                <p className="text-gray-600">
                  Add your educational background to help us match you with relevant connections.
                </p>
                
                <EducationForm
                  educationEntries={educationEntries}
                  setEducationEntries={setEducationEntries}
                />
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button onClick={nextStep}>Next Step</Button>
                </div>
              </div>
            )}

            {/* Step 6: Employment */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-xl font-semibold">Employment History*</div>
                <p className="text-gray-600">
                  Add your work experience to showcase your professional background.
                </p>
                
                <EmploymentForm
                  employmentEntries={employmentEntries}
                  setEmploymentEntries={setEmploymentEntries}
                />
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button onClick={nextStep}>Next Step</Button>
                </div>
              </div>
            )}

            {/* Step 7: Projects (Optional) */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="text-xl font-semibold">Projects (Optional)</div>
                <p className="text-gray-600">
                  Add projects you've worked on to showcase your achievements.
                </p>
                
                <ProjectsForm
                  projectEntries={projectEntries}
                  setProjectEntries={setProjectEntries}
                />
                
                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                  <Button onClick={nextStep}>Next Step</Button>
                </div>
              </div>
            )}

            {/* Step 8: Skills & Availability */}
            {currentStep === 8 && (
              <div className="space-y-6">
                
                <div className="text-xl font-semibold">Your Skills</div>
                <p className="text-gray-600">
                  Add skills to help us match you with the right connections.
                </p>

                <div>
                  <Label htmlFor="skills">Add Skills</Label>
                  <div className="flex mt-1">
                    <Input
                      id="skills"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="e.g., React, Marketing, Project Management"
                      className="rounded-r-none"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddSkill}
                      className="rounded-l-none"
                      type="button"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Your Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.length === 0 ? (
                      <p className="text-sm text-gray-500">No skills added yet</p>
                    ) : (
                      skills.map((skill) => (
                        <Badge key={skill} className="flex items-center gap-1 py-1.5">
                          {skill}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveSkill(skill)}
                          />
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      value={formData.availability}
                      onValueChange={(value) => handleSelectChange("availability", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract/Project basis</SelectItem>
                        <SelectItem value="weekends">Weekends only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="workingStyle">Working Style</Label>
                    <Select
                      value={formData.workingStyle}
                      onValueChange={(value) => handleSelectChange("workingStyle", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select working style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote only</SelectItem>
                        <SelectItem value="office">In-office</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="profileVisibility">Profile Visibility</Label>
                    <Select
                      value={formData.profileVisibility}
                      onValueChange={(value) => handleSelectChange("profileVisibility", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select profile visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public (Anyone can see)</SelectItem>
                        <SelectItem value="connections">Connections only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Profile..." : "Complete Profile"}
                  </Button>
                  
                  <div className="mt-4 flex justify-center">
                    <Button variant="ghost" onClick={prevStep}>
                      Go Back
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
