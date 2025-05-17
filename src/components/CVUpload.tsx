
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CVUploadProps {
  userId: string;
  onCVParsed: (data: any) => void;
}

const CVUpload = ({ userId, onCVParsed }: CVUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsing, setParsing] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const uploadAndParseCV = async () => {
    if (!file || !userId) return;
    
    try {
      setUploading(true);
      setUploadProgress(10);
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload to Supabase storage
      setUploadProgress(30);
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      setUploadProgress(60);
      
      // Get the URL of the uploaded file
      const { data: urlData } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (!urlData?.signedUrl) {
        throw new Error('Failed to get file URL');
      }
      
      setUploadProgress(80);
      setUploading(false);
      setParsing(true);
      
      // Call the edge function to parse the CV
      const { data: parsedData, error: parseError } = await supabase.functions
        .invoke('cv-parser', {
          body: { fileUrl: urlData.signedUrl, fileName: file.name }
        });
      
      if (parseError) {
        throw parseError;
      }
      
      setUploadProgress(100);
      setParsing(false);
      
      // Call the callback with parsed data
      onCVParsed(parsedData);
      
      toast.success('CV uploaded and parsed successfully');
    } catch (error: any) {
      console.error('Error uploading or parsing CV:', error);
      toast.error(error.message || 'Failed to upload or parse your CV');
      setUploading(false);
      setParsing(false);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <Label htmlFor="cv-upload" className="mb-2">Upload your CV/Resume</Label>
        <p className="text-sm text-gray-500 mb-4">
          Upload your CV or resume (PDF or DOCX) to automatically fill in your details
        </p>
        
        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Input
              id="cv-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            <Label htmlFor="cv-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF or DOCX (max 5MB)</p>
              </div>
            </Label>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-gray-600 mr-2" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFile}
                disabled={uploading || parsing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {(uploading || parsing || uploadProgress > 0) && (
              <div className="mt-2">
                <Progress value={uploadProgress} className="h-1" />
                <p className="text-xs text-gray-500 mt-1">
                  {uploading ? 'Uploading...' : parsing ? 'Parsing document...' : uploadProgress === 100 ? 'Complete' : ''}
                </p>
              </div>
            )}
            
            {!uploading && !parsing && uploadProgress === 0 && (
              <Button
                onClick={uploadAndParseCV}
                size="sm"
                className="mt-2 w-full"
              >
                Upload and Parse
              </Button>
            )}
            
            {(uploading || parsing) && (
              <div className="flex justify-center mt-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CVUpload;
