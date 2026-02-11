import { Button } from "@/components/ui/button";
import ResultCard from "@/components/ResultCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, ArrowLeft, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

interface AnswerResult {
  answer: string;
  isCorrect: boolean;
}

interface QuestionResult {
  id: number;
  text: string;
  imageUrl?: string;
  explanation: string;
  choices: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

interface ResultsData {
  questions: QuestionResult[];
  userAnswers: { [key: number]: AnswerResult };
  totalQuestions: number;
  timeSpent: number;
  quizTitle: string;
  score: number;
  correctAnswers: number;
}

export default function ResultsPage() {
  const [location] = useLocation();
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gushaka amakuru mu myirondoro ya URL
    const searchParams = new URLSearchParams(window.location.search);
    const dataParam = searchParams.get('data');
    
    if (dataParam) {
      try {
        const parsedData: ResultsData = JSON.parse(decodeURIComponent(dataParam));
        setResultsData(parsedData);
      } catch (error) {
        console.error("Ikosa mu gusobanura amakuru y'ibisubizo:", error);
      }
    }
    setLoading(false);
  }, []);

  // Gusoma igihe kivuye ku masogonda kugera ku minota
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${remainingSeconds} amasogonda`;
    }
    return `${minutes} ${minutes !== 1 ? 'iminota' : 'minota'} ${remainingSeconds > 0 ? `${remainingSeconds} amasogonda` : ''}`;
  };

  // Gufata inyandiko y'isubizo ryo kuri ibibazo
  const getCorrectAnswerText = (question: QuestionResult) => {
    const correctChoice = question.choices.find(choice => choice.isCorrect === true);
    return correctChoice ? correctChoice.text : "Ntawamenye";
  };

  // Gufata inyandiko y'isubizo ryawe
  const getUserAnswerText = (questionIndex: number) => {
    if (!resultsData?.userAnswers[questionIndex]) return "Ntacyasubijwe";
    
    const userAnswerId = resultsData.userAnswers[questionIndex].answer;
    const question = resultsData.questions[questionIndex];
    const selectedChoice = question.choices.find(choice => choice.id === userAnswerId);
    return selectedChoice ? selectedChoice.text : "Ntawamenye";
  };

  // Kugena amakuru y'ibisubizo by'ibibazo
  const getQuestionReview = () => {
    if (!resultsData) return [];
    
    return resultsData.questions.map((question, index) => {
      const userAnswer = resultsData.userAnswers[index];
      const isCorrect = userAnswer?.isCorrect === true;
      
      return {
        id: index + 1,
        text: question.text,
        yourAnswer: getUserAnswerText(index),
        correctAnswer: getCorrectAnswerText(question),
        isCorrect: isCorrect,
        explanation: question.explanation || "Nta nsobanuro ihari."
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ibisubizo byawe...</p>
        </div>
      </div>
    );
  }

  if (!resultsData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-bold text-destructive">Nta bisubizo bibonetse</h1>
            <p className="text-muted-foreground">
              ibisubizo ntabwo byashyizwemo neza.Tangira ikizamini.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/ibibazo">
                <Button className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Subira ku Bizamini
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Subira Ahabanza
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questionReview = getQuestionReview();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="space-y-8">
          {/* Umutwe */}
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-center">
              Ibisubizo by'Ikizamini: {resultsData.quizTitle}
            </h1>
            <p className="text-center text-muted-foreground">
              Warangije ibibazo {resultsData.totalQuestions} mu gihe cya {formatTime(resultsData.timeSpent)}
            </p>
          </div>

          {/* Ikarita y'igisubizo */}
          <ResultCard
            score={resultsData.correctAnswers}
            totalQuestions={resultsData.totalQuestions}
            percentage={resultsData.score}
            timeTaken={formatTime(resultsData.timeSpent)}
          />

          {/* Ibisobanuro by'ingano y'amafaranga */}
          <div className="bg-muted rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Ibisobanuro birambuye</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Wagikoze</p>
                <p className="text-2xl font-bold text-green-600">{resultsData.correctAnswers}</p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Wakishe</p>
                <p className="text-2xl font-bold text-red-600">
                  {resultsData.totalQuestions - resultsData.correctAnswers}
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Ibisubizo Byatanzwe</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.keys(resultsData.userAnswers || {}).length}/{resultsData.totalQuestions}
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Ingano y'Ibyavutse</p>
                <p className="text-2xl font-bold text-purple-600">
                  {resultsData.totalQuestions > 0 
                    ? Math.round((resultsData.correctAnswers / resultsData.totalQuestions) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Reba Ibisubizo Byawe */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Reba Ibisubizo Byawe</h3>
            <Accordion type="single" collapsible className="w-full">
              {questionReview.map((question) => (
                <AccordionItem key={question.id} value={`question-${question.id}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      {question.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className="font-medium">Ikibazo {question.id}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          {question.text.length > 50 ? `${question.text.substring(0, 50)}...` : question.text}
                        </span>
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        question.isCorrect 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {question.isCorrect ? "Wagikoze" : "Wakishe"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 pl-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg border ${
                          question.isCorrect 
                            ? "bg-green-50 border-green-200" 
                            : "bg-red-50 border-red-200"
                        }`}>
                          <p className="text-sm font-medium text-muted-foreground">Igisubizo Cyawe:</p>
                          <p className={question.isCorrect ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                            {question.yourAnswer}
                          </p>
                        </div>
                        {!question.isCorrect && (
                          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                            <p className="text-sm font-medium text-muted-foreground">Igisubizo Kuri:</p>
                            <p className="text-green-700 font-medium">{question.correctAnswer}</p>
                          </div>
                        )}
                      </div>
                      
                      {question.explanation && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-2">Igisobanuro:</p>
                          <p className="text-sm text-blue-700">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Utubuto tw'Imyitozo */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/ibibazo" className="flex-1">
              <Button className="w-full gap-2" data-testid="button-try-again">
                <ArrowLeft className="h-4 w-4" />
                Gerageza Ikindi Kizamini
              </Button>
            </Link>
            <Link href="/konte" className="flex-1">
              <Button variant="outline" className="w-full gap-2" data-testid="button-view-progress">
                Reba Iterambere
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                Subira Ahabanza
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}