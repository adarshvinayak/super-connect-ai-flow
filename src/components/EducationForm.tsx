
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

export interface Education {
  id?: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface EducationFormProps {
  educationEntries: Education[];
  setEducationEntries: React.Dispatch<React.SetStateAction<Education[]>>;
}

const EducationForm = ({ educationEntries, setEducationEntries }: EducationFormProps) => {
  const [showForm, setShowForm] = useState(false);
  const [currentEducation, setCurrentEducation] = useState<Education>({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    description: ""
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentEducation({ ...currentEducation, [name]: value });
  };
  
  const handleAddEducation = () => {
    if (!currentEducation.institution.trim()) {
      return; // Institution is required
    }
    
    setEducationEntries([...educationEntries, { ...currentEducation, id: Date.now().toString() }]);
    setCurrentEducation({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      description: ""
    });
    setShowForm(false);
  };
  
  const handleRemoveEducation = (index: number) => {
    const updatedEntries = [...educationEntries];
    updatedEntries.splice(index, 1);
    setEducationEntries(updatedEntries);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Education</h3>
      </div>
      
      {educationEntries.length > 0 && (
        <div className="space-y-3">
          {educationEntries.map((entry, index) => (
            <Card key={entry.id || index} className="p-4 relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0"
                onClick={() => handleRemoveEducation(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="pr-8">
                <h4 className="font-medium">{entry.institution}</h4>
                {entry.degree && <p className="text-sm">{entry.degree}</p>}
                {entry.fieldOfStudy && <p className="text-sm text-gray-500">{entry.fieldOfStudy}</p>}
                
                <div className="flex text-sm text-gray-500 mt-1">
                  {entry.startDate && (
                    <span>{new Date(entry.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                  )}
                  {entry.startDate && entry.endDate && <span className="mx-1">-</span>}
                  {entry.endDate && (
                    <span>{new Date(entry.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                  )}
                </div>
                
                {entry.description && <p className="text-sm mt-2">{entry.description}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {showForm ? (
        <div className="border rounded-md p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="institution">Institution*</Label>
              <Input
                id="institution"
                name="institution"
                value={currentEducation.institution}
                onChange={handleInputChange}
                placeholder="University or School Name"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="degree">Degree</Label>
              <Input
                id="degree"
                name="degree"
                value={currentEducation.degree}
                onChange={handleInputChange}
                placeholder="e.g., Bachelor's, Master's"
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="fieldOfStudy">Field of Study</Label>
            <Input
              id="fieldOfStudy"
              name="fieldOfStudy"
              value={currentEducation.fieldOfStudy}
              onChange={handleInputChange}
              placeholder="e.g., Computer Science, Business"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={currentEducation.startDate}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={currentEducation.endDate}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={currentEducation.description}
              onChange={handleInputChange}
              placeholder="Describe your studies, achievements, etc."
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEducation}>
              Add Education
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      )}
    </div>
  );
};

export default EducationForm;
