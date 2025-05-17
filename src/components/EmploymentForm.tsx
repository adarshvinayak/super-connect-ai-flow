
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";

export interface Employment {
  id?: string;
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  current?: boolean;
}

interface EmploymentFormProps {
  employmentEntries: Employment[];
  setEmploymentEntries: React.Dispatch<React.SetStateAction<Employment[]>>;
}

const EmploymentForm = ({ employmentEntries, setEmploymentEntries }: EmploymentFormProps) => {
  const [showForm, setShowForm] = useState(false);
  const [currentEmployment, setCurrentEmployment] = useState<Employment>({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    description: "",
    current: false
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentEmployment({ ...currentEmployment, [name]: value });
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setCurrentEmployment({ 
      ...currentEmployment, 
      current: checked,
      // Clear end date if current position
      ...(checked && { endDate: "" })
    });
  };
  
  const handleAddEmployment = () => {
    if (!currentEmployment.company.trim() || !currentEmployment.position.trim()) {
      return; // Company and position are required
    }
    
    setEmploymentEntries([...employmentEntries, { ...currentEmployment, id: Date.now().toString() }]);
    setCurrentEmployment({
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false
    });
    setShowForm(false);
  };
  
  const handleRemoveEmployment = (index: number) => {
    const updatedEntries = [...employmentEntries];
    updatedEntries.splice(index, 1);
    setEmploymentEntries(updatedEntries);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Employment History</h3>
      </div>
      
      {employmentEntries.length > 0 && (
        <div className="space-y-3">
          {employmentEntries.map((entry, index) => (
            <Card key={entry.id || index} className="p-4 relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0"
                onClick={() => handleRemoveEmployment(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="pr-8">
                <h4 className="font-medium">{entry.position}</h4>
                <p className="text-sm">{entry.company}</p>
                
                <div className="flex text-sm text-gray-500 mt-1">
                  {entry.startDate && (
                    <span>{new Date(entry.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                  )}
                  <span className="mx-1">-</span>
                  {entry.current ? (
                    <span>Present</span>
                  ) : entry.endDate ? (
                    <span>{new Date(entry.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                  ) : (
                    <span>Present</span>
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
              <Label htmlFor="company">Company*</Label>
              <Input
                id="company"
                name="company"
                value={currentEmployment.company}
                onChange={handleInputChange}
                placeholder="Company Name"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="position">Position*</Label>
              <Input
                id="position"
                name="position"
                value={currentEmployment.position}
                onChange={handleInputChange}
                placeholder="Job Title"
                className="mt-1"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="current-position"
              checked={currentEmployment.current}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="current-position">I currently work here</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={currentEmployment.startDate}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            
            {!currentEmployment.current && (
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={currentEmployment.endDate}
                  onChange={handleInputChange}
                  className="mt-1"
                  disabled={currentEmployment.current}
                />
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={currentEmployment.description}
              onChange={handleInputChange}
              placeholder="Describe your responsibilities and achievements"
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployment}>
              Add Employment
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
          Add Employment
        </Button>
      )}
    </div>
  );
};

export default EmploymentForm;
