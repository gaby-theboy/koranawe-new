import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, HelpCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [questionsFile, setQuestionsFile] = useState<File | null>(null);
  const [lessonsFile, setLessonsFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleQuestionsUpload = () => {
    if (questionsFile) {
      toast({
        title: "Questions Imported",
        description: `Successfully imported questions from ${questionsFile.name}`,
      });
      setQuestionsFile(null);
    }
  };

  const handleLessonsUpload = () => {
    if (lessonsFile) {
      toast({
        title: "Lessons Imported",
        description: `Successfully imported lessons from ${lessonsFile.name}`,
      });
      setLessonsFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage content and import data</p>
        </div>

        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="questions" className="gap-2" data-testid="tab-questions">
              <HelpCircle className="h-4 w-4" />
              Import Questions
            </TabsTrigger>
            <TabsTrigger value="lessons" className="gap-2" data-testid="tab-lessons">
              <BookOpen className="h-4 w-4" />
              Import Lessons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Import Questions from CSV</h2>
                <p className="text-muted-foreground">
                  Upload a CSV file containing quiz questions
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">
                      {questionsFile ? questionsFile.name : "Choose a CSV file"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or drag and drop it here
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setQuestionsFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="questions-upload"
                    data-testid="input-questions-file"
                  />
                  <label htmlFor="questions-upload">
                    <Button variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Select File
                      </span>
                    </Button>
                  </label>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm">CSV Format:</h3>
                  <code className="text-xs block bg-background p-3 rounded">
                    question_text, choice_1, choice_2, choice_3, choice_4, correct_choice, explanation, image_url
                  </code>
                </div>

                <Button 
                  onClick={handleQuestionsUpload} 
                  disabled={!questionsFile}
                  className="w-full"
                  size="lg"
                  data-testid="button-upload-questions"
                >
                  Import Questions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-bold">Import Lessons from CSV</h2>
                <p className="text-muted-foreground">
                  Upload a CSV file containing lesson content
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">
                      {lessonsFile ? lessonsFile.name : "Choose a CSV file"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or drag and drop it here
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setLessonsFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="lessons-upload"
                    data-testid="input-lessons-file"
                  />
                  <label htmlFor="lessons-upload">
                    <Button variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Select File
                      </span>
                    </Button>
                  </label>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm">CSV Format:</h3>
                  <code className="text-xs block bg-background p-3 rounded">
                    module_id, lesson_title, lesson_content, is_premium, thumbnail_url
                  </code>
                </div>

                <Button 
                  onClick={handleLessonsUpload} 
                  disabled={!lessonsFile}
                  className="w-full"
                  size="lg"
                  data-testid="button-upload-lessons"
                >
                  Import Lessons
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
