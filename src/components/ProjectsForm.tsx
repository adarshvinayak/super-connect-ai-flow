
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

export interface Project {
  id?: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
}

interface ProjectsFormProps {
  projectEntries: Project[];
  setProjectEntries: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectsForm = ({ projectEntries, setProjectEntries }: ProjectsFormProps) => {
  const [showForm, setShowForm] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project>({
    title: "",
    description: "",
    url: "",
    imageUrl: ""
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentProject({ ...currentProject, [name]: value });
  };
  
  const handleAddProject = () => {
    if (!currentProject.title.trim()) {
      return; // Title is required
    }
    
    setProjectEntries([...projectEntries, { ...currentProject, id: Date.now().toString() }]);
    setCurrentProject({
      title: "",
      description: "",
      url: "",
      imageUrl: ""
    });
    setShowForm(false);
  };
  
  const handleRemoveProject = (index: number) => {
    const updatedEntries = [...projectEntries];
    updatedEntries.splice(index, 1);
    setProjectEntries(updatedEntries);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Projects</h3>
      </div>
      
      {projectEntries.length > 0 && (
        <div className="space-y-3">
          {projectEntries.map((project, index) => (
            <Card key={project.id || index} className="p-4 relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-8 w-8 p-0"
                onClick={() => handleRemoveProject(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="pr-8">
                <h4 className="font-medium">{project.title}</h4>
                {project.description && <p className="text-sm mt-1">{project.description}</p>}
                {project.url && (
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-supernet-blue hover:underline mt-1 block"
                  >
                    {project.url}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {showForm ? (
        <div className="border rounded-md p-4 space-y-4">
          <div>
            <Label htmlFor="title">Project Title*</Label>
            <Input
              id="title"
              name="title"
              value={currentProject.title}
              onChange={handleInputChange}
              placeholder="Project Name"
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={currentProject.description}
              onChange={handleInputChange}
              placeholder="Describe your project"
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="url">Project URL</Label>
            <Input
              id="url"
              name="url"
              value={currentProject.url}
              onChange={handleInputChange}
              placeholder="https://"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={currentProject.imageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProject}>
              Add Project
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
          Add Project
        </Button>
      )}
    </div>
  );
};

export default ProjectsForm;
