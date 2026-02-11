import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, Clock, CheckCircle, Play, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, XCircle, HelpCircle, Trophy, BarChart3, RotateCcw, Brain, Zap, X, CheckCircle2, AlertCircle, AlertTriangle, Loader2, ClipboardList, Timer, Target } from "lucide-react";
import { Link, useRoute } from "wouter";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

// Types for our API responses
interface Section {
  id: string;
  title: string;
  sectionNumber: number;
}

interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  sections: Section[];
  image: string;
}

interface Lesson {
  id: string;
  title: string;
  lesssonNumber: number;
  lessonImage: string | null;
}

interface LessonData {
  success: boolean;
  sectionId: string;
  data: Lesson[];
}

// Quiz Types
interface QuizQuestion {
  image: string;
  _id: string;
  _owner: string;
  chapterId: string;
  _createdDate: string;
  choiceAnswer: number;
  _updatedDate: string;
  choice: string[];
  title: string;
  questionNumbers: number;
}

interface QuizResponse {
  success: boolean;
  chapterId: string;
  totalSets: number;
  totalQuestions: number;
  sets: QuizQuestion[][];
}

interface QuestionChoice {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface TransformedQuestion {
  id: string;
  text: string;
  choices: QuestionChoice[];
  correctAnswer: number;
  imageUrl?: string;
}

// Cache for chapters data
let chaptersCache: Chapter[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for lessons by section
const lessonsCache: Record<string, { data: any[], timestamp: number }> = {};

// Cache for quiz questions by chapter
const quizCache: Record<string, { data: TransformedQuestion[], timestamp: number }> = {};

// Skeleton Components
const LessonContentSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header Skeleton */}
    <div className="text-center md:text-left">
      <div className="h-8 bg-muted rounded w-3/4 mx-auto md:mx-0 mb-3"></div>
    </div>

    {/* Progress Bar Skeleton */}
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-muted rounded w-20"></div>
        <div className="h-4 bg-muted rounded w-16"></div>
      </div>
      <div className="w-full bg-muted rounded-full h-2"></div>
    </div>

    {/* Content Skeleton */}
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Text content skeleton */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="h-6 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-4/6"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
          {/* Image skeleton */}
          <div className="flex-shrink-0 md:w-48">
            <div className="w-full h-48 bg-muted rounded-lg"></div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Navigation Skeletons */}
    <div className="flex justify-between items-center gap-4">
      <div className="flex-1 h-10 bg-muted rounded"></div>
      <div className="w-12 h-6 bg-muted rounded"></div>
      <div className="flex-1 h-10 bg-muted rounded"></div>
    </div>
  </div>
);

// Quiz Component - Now as a modal
const ChapterQuizModal = ({ 
  chapterId, 
  chapterNumber, 
  isOpen, 
  onClose 
}: { 
  chapterId: string; 
  chapterNumber: number;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [quizQuestions, setQuizQuestions] = useState<TransformedQuestion[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [noQuestionsAvailable, setNoQuestionsAvailable] = useState(false);
  
  const transformWixImage = (wixUrl: string | undefined | null) => {
    if (!wixUrl || !wixUrl.startsWith('wix:image')) return undefined;

    // Wix format: wix:image://v1/FILE_ID/FILE_NAME#originWidth=X&originHeight=Y
    // We need the FILE_ID (the part after v1/ and before the next /)
    const parts = wixUrl.split('/');
    if (parts.length < 4) return undefined;

    const fileId = parts[3]; 
    return `https://static.wixstatic.com/media/${fileId}`;
  };

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      // Check cache first
      const now = Date.now();
      const cachedQuiz = quizCache[chapterId];
      if (cachedQuiz && (now - cachedQuiz.timestamp) < CACHE_DURATION) {
        setQuizQuestions(cachedQuiz.data);
        setNoQuestionsAvailable(cachedQuiz.data.length === 0);
        return;
      }

      try {
        setLoadingQuiz(true);
        setNoQuestionsAvailable(false);
        const response = await fetch('https://dataapis.wixsite.com/kora/_functions/AllQuestionsbychapter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chapterId })
        });
        
        const data: QuizResponse = await response.json();
        
        if (data.success) {
          // Flatten all questions from all sets
          const allQuestions: QuizQuestion[] = data.sets.flat();
          
          if (allQuestions.length === 0) {
            setNoQuestionsAvailable(true);
            setQuizQuestions([]);
            return;
          }
          
          // Transform questions to our format
          const transformedQuestions: TransformedQuestion[] = allQuestions.map((q, index) => ({
            id: q._id,
            text: q.title,
            choices: q.choice.map((choiceText, idx) => ({
              id: String.fromCharCode(65 + idx), // A, B, C, D
              text: choiceText.trim(),
              isCorrect: (idx + 1) === q.choiceAnswer
            })),
            correctAnswer: q.choiceAnswer,
            imageUrl: transformWixImage(q.image),
          }));
          
          // Shuffle and take 10 random questions
          const shuffled = [...transformedQuestions]
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);
          
          // Update cache
          quizCache[chapterId] = {
            data: shuffled,
            timestamp: Date.now()
          };
          
          setQuizQuestions(shuffled);
          setNoQuestionsAvailable(shuffled.length === 0);
        } else {
          setNoQuestionsAvailable(true);
        }
      } catch (error) {
        console.error('Error fetching quiz questions:', error);
        setNoQuestionsAvailable(true);
      } finally {
        setLoadingQuiz(false);
      }
    };

    if (chapterId && isOpen) {
      fetchQuizQuestions();
    }
  }, [chapterId, isOpen]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers({});
    setScore(0);
  };

  const handleAnswerSelect = (choiceId: string) => {
    // Prevent re-selecting if already answered
    if (answers[currentQuestion]) return;
    
    const currentQ = quizQuestions[currentQuestion];
    const selectedChoice = currentQ.choices.find(c => c.id === choiceId);
    
    // Update selected answer
    setSelectedAnswer(choiceId);
    
    // Store answer
    const newAnswers = {
      ...answers,
      [currentQuestion]: choiceId
    };
    setAnswers(newAnswers);
    
    // Update score if correct
    if (selectedChoice?.isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      // Set the previously selected answer for this question if it exists
      setSelectedAnswer(answers[currentQuestion + 1] || null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
    }
  };

  const handleRetryQuiz = () => {
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers({});
    setScore(0);
  };

  const handleCloseQuiz = () => {
    onClose();
    // Reset quiz state
    setTimeout(() => {
      setQuizStarted(false);
      setQuizCompleted(false);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setAnswers({});
      setScore(0);
      setNoQuestionsAvailable(false);
    }, 300);
  };

  const currentQ = quizQuestions[currentQuestion];

  if (!isOpen) return null;

  // ===== NO QUESTIONS AVAILABLE UI =====
  if (noQuestionsAvailable) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleCloseQuiz} />
        <div className="relative bg-white dark:bg-zinc-900 w-full h-[90vh] sm:h-auto sm:max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-3xl flex items-center justify-center mb-6 rotate-3">
              <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-500" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mb-4">
              Nta Gerageza riboneka
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm text-sm sm:text-base">
              Nta bibazo by'igerageza kuri isomo rya {chapterNumber}. Komeza kwiga ayandi masomo.
            </p>
            
            <div className="w-full space-y-3 mt-8">
              <button
                onClick={handleCloseQuiz}
                className="w-full py-4 bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Garuka Inyuma
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== LOADING STATE =====
  if (loadingQuiz) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleCloseQuiz} />
        <div className="relative bg-white dark:bg-zinc-900 w-full h-[90vh] sm:h-auto sm:max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
              <Loader2 className="h-10 w-10 text-emerald-600 dark:text-emerald-500 animate-spin" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mb-4">
              Irebereza Ikizamini...
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm text-sm sm:text-base">
              Dukora isuzuma ibibazo byawe. Bihorereho gato.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleCloseQuiz} />
        <div className="relative bg-white dark:bg-zinc-900 w-full h-[90vh] sm:h-auto sm:max-w-xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
          <div className="p-6 sm:p-8 flex-1 flex flex-col items-center text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-4 sm:mb-6 rotate-3">
              <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mb-2">
              Isuzumanyigisho
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 sm:mb-8 max-w-xs text-sm sm:text-base">
              Isomo rya {chapterNumber}: Garagaza ubumenyi bwawe mu minota mike.
            </p>

           <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mb-6 sm:mb-10">
  {[
    { label: 'Ibibazo', val: '10', icon: <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" /> },
    { label: 'Iminota', val: '5', icon: <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" /> },
    { label: 'Gutsinda', val: '70%', icon: <Target className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" /> },
  ].map((stat, i) => (
    <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 p-2 sm:p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
      <div className="mb-1 sm:mb-2 p-1.5 sm:p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
        {stat.icon}
      </div>
      <div className="text-sm sm:text-lg font-bold text-zinc-800 dark:text-zinc-200">{stat.val}</div>
      <div className="text-[8px] sm:text-[10px] uppercase font-black text-zinc-400 tracking-wider">{stat.label}</div>
    </div>
  ))}
</div>

            <div className="w-full space-y-3 mt-auto sm:mt-0">
              <button
                onClick={handleStartQuiz}
                className="w-full py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                Tangira Ikizamini
              </button>
              <button onClick={handleCloseQuiz} className="w-full py-2 sm:py-3 text-zinc-400 font-semibold hover:text-zinc-600 transition-colors text-sm sm:text-base">
                Gufunga
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-0 sm:p-4">
        <div className="absolute inset-0 bg-transparent backdrop-blur-md" onClick={handleCloseQuiz} />
        <div className="relative bg-white dark:bg-zinc-900 w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          
          <div className="flex flex-col md:flex-row">
            
            {/* Left Side: Score Hero */}
            <div className={`md:w-5/12 p-6 sm:p-8 md:p-12 text-center flex flex-col items-center justify-center ${
              passed ? 'bg-emerald-600' : 'bg-orange-500'
            } text-white`}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-xl">
                {passed ? (
                  <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                ) : (
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">
                {passed ? 'Watsinze!' : 'Gerageza nanone'}
              </h2>
              <p className="text-white/80 font-medium mb-6 sm:mb-8 text-sm sm:text-base">
                {passed 
                  ? 'Urashoboye! Wageze ku ntego isabwa.' 
                  : 'Ukeneye gusubira mu masomo make.'}
              </p>
              <div className="text-6xl sm:text-7xl font-black tracking-tighter mb-2">
                {percentage}%
              </div>
              <div className="text-xs sm:text-sm uppercase font-bold tracking-widest opacity-70">
                Amanota yose
              </div>
            </div>

            {/* Right Side: Details & Actions */}
            <div className="flex-1 p-6 sm:p-8 md:p-12 bg-white dark:bg-zinc-900">
              <h3 className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">
                Incamake y'igerageza
              </h3>
              
              <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    </div>
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">Ibibazo watsinze</span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">{score}</span>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg">
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-500" />
                    </div>
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">Ibibazo utatsinze</span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                    {quizQuestions.length - score}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={handleRetryQuiz}
                  className="flex items-center justify-center gap-2 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-sm sm:text-base"
                >
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                  Subiramo
                </button>
                <button
                  onClick={handleCloseQuiz}
                  className="flex text-sm sm:text-sm items-center justify-center gap-2 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-zinc-900 dark:bg-emerald-600 text-white font-bold hover:opacity-90 transition-all shadow-lg"
                >
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  Garuka ku Isomo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN QUIZ INTERFACE ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative bg-white dark:bg-zinc-900 w-full h-full sm:h-[85vh] sm:max-w-6xl sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* 1. Header (Fixed) */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-emerald-600 text-white px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-black">
              {currentQuestion + 1} / {quizQuestions.length}
            </div>
            <h4 className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px] sm:max-w-none text-sm sm:text-base">
              Isomo rya {chapterNumber}
            </h4>
          </div>
          <button onClick={handleCloseQuiz} className="p-1.5 sm:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" />
          </button>
        </div>

        {/* 2. Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Side: Question & Answers */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar flex flex-col ${
            !currentQ.imageUrl ? "w-full items-center" : ""
          }`}>
            <div className={`w-full ${!currentQ.imageUrl ? "max-w-3xl" : "max-w-2xl"}`}>
              
              {/* Mobile Image (Only shows if imageUrl exists) */}
              {currentQ.imageUrl && (
                <div className="md:hidden mb-6">
                  <div className="relative w-full h-48 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <img 
                      src={currentQ.imageUrl} 
                      alt="Quiz Context"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                </div>
              )}

              {/* Question Text */}
              <h2 className={`font-bold text-zinc-800 dark:text-zinc-100 mb-6 lg:mb-8 leading-snug ${
                !currentQ.imageUrl ? "text-lg sm:text-xl lg:text-2xl text-center" : "text-xl sm:text-sm lg:text-xl"
              }`}>
                {currentQ.text}
              </h2>

              {/* Choices Grid */}
              <div className={`grid grid-cols-1 gap-2 sm:gap-3 ${!currentQ.imageUrl ? "max-w-2xl mx-auto w-full" : ""}`}>
                {currentQ.choices.map((choice) => {
                  const isSelected = selectedAnswer === choice.id;
                  const isAnswered = !!answers[currentQuestion];
                  const isCorrect = choice.isCorrect;

                  return (
                    <button
                      key={choice.id}
                      disabled={isAnswered}
                      onClick={() => handleAnswerSelect(choice.id)}
                      className={`group w-full p-3.5 sm:p-5 rounded-xl border-2 transition-all flex items-center gap-3 sm:gap-4 text-left active:scale-[0.99] ${
                        isSelected 
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                          : "border-zinc-100 dark:border-zinc-800"
                      } ${isAnswered && isCorrect ? "" : ""}`}
                    >
                      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold shrink-0 text-sm sm:text-sm ${
                        isSelected ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}>
                        {choice.id}
                      </div>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium text-sm sm:text-lg">
                        {choice.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Desktop Image (Only renders if imageUrl exists) */}
          {currentQ.imageUrl && (
            <div className="hidden md:flex md:w-5/12 bg-zinc-50 dark:bg-zinc-800/50  p-6 lg:p-8 border-l border-zinc-100 dark:border-zinc-800">
              <div className="relative w-full h-full max-h-[500px] bg-white dark:bg-zinc-900 rounded-3xl shadow-inner overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <img 
                  src={currentQ.imageUrl} 
                  alt="Quiz Context"
                  className="w-full h-full object-contain p-6"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Footer (Fixed) */}
        <div className="p-3 sm:p-4 lg:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-zinc-400 hover:text-zinc-600 disabled:opacity-0 transition-all text-sm sm:text-base"
          >
            Inyuma
          </button>

          <div className="flex gap-2 sm:gap-3 items-center">
            {/* Progress Indicator Dots for Desktop */}
            <div className="hidden sm:flex gap-1 mr-2 sm:mr-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`h-1.5 w-3 sm:w-4 rounded-full ${i <= currentQuestion ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
              ))}
            </div>

            <button
              onClick={handleNextQuestion}
              disabled={!answers[currentQuestion]} // Changed from !selectedAnswer
              className="px-6 sm:px-10 py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white rounded-xl sm:rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">
                {currentQuestion < quizQuestions.length - 1 ? "Kibazo Gikurikira" : "Reba Igisubizo"}
              </span>
              <span className="sm:hidden">
                {currentQuestion < quizQuestions.length - 1 ? "Gikurikira" : "Isubiza"}
              </span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LessonsPage() {
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  // Get section ID from URL parameters
  const [match, params] = useRoute("/inyigisho/:sectionId?");
  const urlSectionId = params?.sectionId;

  // Fetch chapters on component mount with caching
  useEffect(() => {
    const fetchChapters = async () => {
      // Check cache first
      const now = Date.now();
      if (chaptersCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        setChapters(chaptersCache);
        
        // If URL has a section ID, load that section
        if (urlSectionId) {
          handleSectionSelect(urlSectionId);
        }
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('https://dataapis.wixsite.com/kora/_functions/ChaptersWithSections');
        const data: Chapter[] = await response.json();
        
        // Update cache
        chaptersCache = data;
        cacheTimestamp = Date.now();
        
        setChapters(data);
        
        // If URL has a section ID, load that section
        if (urlSectionId) {
          handleSectionSelect(urlSectionId);
        }
      } catch (error) {
        console.error('Error fetching chapters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [urlSectionId]);

  // Fetch lessons for a specific section with caching
  const fetchLessonsBySection = async (sectionId: string) => {
    // Check cache first
    const now = Date.now();
    const cachedLesson = lessonsCache[sectionId];
    if (cachedLesson && (now - cachedLesson.timestamp) < CACHE_DURATION) {
      setLessons(cachedLesson.data);
      setSelectedSection(sectionId);
      setSelectedLessonIndex(0);
      return;
    }

    try {
      setLoadingLessons(true);
      const response = await fetch('https://dataapis.wixsite.com/kora/_functions/LessonsBySection/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sectionId })
      });
      
      const data: LessonData = await response.json();
      
      if (data.success) {
        // Transform API lessons to match your existing format
        const transformedLessons = data.data.map((lesson, index) => ({
          id: parseInt(lesson.id.replace(/\D/g, '').slice(0, 8) || `${index + 1}`),
          title: lesson.title.split('\n')[0],
          description: lesson.title.length > 100 ? lesson.title.substring(0, 100) + '...' : lesson.title,
          progress: "Birimo Gukora",
          lessonsCount: data.data.length,
          progressValue: Math.round(Math.min((index / data.data.length) * 100, 100)),
          imageUrl: lesson.lessonImage || "https://c8.alamy.com/comp/2GE268G/set-of-road-safety-signs-warning-road-transport-symbol-vector-collection-2GE268G.jpg",
          content: `
  <div class="flex flex-col md:flex-row gap-6 items-start">
    <div class="flex-1 min-w-0">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">${lesson.title.split('\n')[0]}</h2>
      <p class="text-gray-600 leading-relaxed">${lesson.title.replace(/\n/g, '<br/>')}</p>
    </div>
    ${lesson.lessonImage ? `
      <div class="flex-shrink-0 md:w-48">
        <img 
          src="${lesson.lessonImage}" 
          alt="${lesson.title.split('\n')[0]}" 
          class="rounded-lg w-full h-auto max-w-[200px] md:max-w-none"
          style="object-fit: cover;"
        />
      </div>
    ` : ''}
  </div>
          `
        }));

        // Update cache
        lessonsCache[sectionId] = {
          data: transformedLessons,
          timestamp: Date.now()
        };

        setLessons(transformedLessons);
        setSelectedSection(sectionId);
        setSelectedLessonIndex(0);
        
        // Find which chapter this section belongs to
        const chapter = chapters.find(ch => ch.sections.some(s => s.id === sectionId));
        if (chapter) {
          setSelectedChapter(chapter);
        }
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleSectionSelect = (sectionId: string) => {
    // Update URL to reflect selected section
    window.history.pushState(null, "", `/inyigisho/${sectionId}`);
    
    // Find and expand the chapter containing this section
    const chapter = chapters.find(ch => ch.sections.some(s => s.id === sectionId));
    if (chapter) {
      setExpandedChapters(prev => new Set(prev).add(chapter.id));
      setSelectedChapter(chapter);
    }
    
    fetchLessonsBySection(sectionId);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const expandAllChapters = () => {
    const allChapterIds = chapters.map(chapter => chapter.id);
    setExpandedChapters(new Set(allChapterIds));
  };

  const collapseAllChapters = () => {
    setExpandedChapters(new Set());
  };

  const handleQuizClick = () => {
    if (selectedChapter) {
      setShowQuizModal(true);
    }
  };

  const currentLesson = lessons[selectedLessonIndex];

  const handlePreviousLesson = () => {
    if (selectedLessonIndex > 0) {
      setSelectedLessonIndex(selectedLessonIndex - 1);
    }
  };

  const handleNextLesson = () => {
    if (selectedLessonIndex < lessons.length - 1) {
      setSelectedLessonIndex(selectedLessonIndex + 1);
    }
  };

  // Expandable Chapter Component for Desktop Sidebar
  const ChapterItem = ({ chapter }: { chapter: Chapter }) => {
    const isExpanded = expandedChapters.has(chapter.id);
    
    return (
      <div className="space-y-2">
        <Button
          variant="ghost"
          className="w-full bg-blue-50 justify-between h-auto p-3 hover:bg-accent"
          onClick={() => toggleChapter(chapter.id)}
        >
          <div className="flex items-start gap-3 text-left flex-1 min-w-0">
            {/* Image preview for chapter from backend */}
            <div className="flex-shrink-0">
              <img 
                src={chapter.image} 
                alt={chapter.title}
                className="w-12 h-12 object-cover rounded-lg"
              />
            </div>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-medium text-sm truncate">
                Isomo rya {chapter.chapterNumber}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {chapter.title}
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
          )}
        </Button>
        
        <div className="border-t-2 border-muted mx-3"></div>
        
        {isExpanded && (
          <div className="ml-4 space-y-1 border-l-2 border-muted pl-3">
            {chapter.sections.map((section) => (
              <Button
                key={section.id}
                variant={selectedSection === section.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto py-2 px-3 text-left min-w-0"
                onClick={() => handleSectionSelect(section.id)}
              >
                <div className="flex items-center gap-2 w-full min-w-0">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-xs font-medium truncate">
                      Igice {section.sectionNumber}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {section.title}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Mobile Section List Component
  const MobileSectionList = () => (
    <div className="space-y-4 pb-4">
      {/* Chapters and Sections */}
      <div className="space-y-4">
        {chapters.map((chapter) => (
          <Card key={chapter.id}>
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-between h-auto p-0 mb-3 hover:bg-transparent min-w-0"
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="flex items-start gap-3 text-left flex-1 min-w-0">
                  {/* Image preview for chapter from backend */}
                  <div className="flex-shrink-0">
                    <img 
                      src={chapter.image} 
                      alt={chapter.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="font-medium text-sm truncate">
                      Isomo rya {chapter.chapterNumber}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {chapter.title}
                    </div>
                  </div>
                </div>
                
                {expandedChapters.has(chapter.id) ? (
                  <ChevronUp className="h-5 w-5 flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="h-5 w-5 flex-shrink-0 ml-2" />
                )}
              </Button>
              
              <div className="border-t-2 border-muted mb-3"></div>
              
              {expandedChapters.has(chapter.id) && (
                <div className="space-y-2">
                  {chapter.sections.map((section) => (
                    <Button
                      key={section.id}
                      variant={selectedSection === section.id ? "secondary" : "outline"}
                      className="w-full justify-start h-auto py-3 text-left min-w-0"
                      onClick={() => handleSectionSelect(section.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="font-medium text-sm truncate">
                            Igice {section.sectionNumber}: {section.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            Kanda utangire kwiga
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loadingLessons && lessons.length === 0 && (
        <div className="text-center py-6">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Birimo gushakisha amayigisho...</p>
        </div>
      )}
    </div>
  );

  // Lesson Content Component with Quiz Button
  const LessonContent = () => {
    const hasPreviousLesson = selectedLessonIndex > 0;
    const hasNextLesson = selectedLessonIndex < lessons.length - 1;

    return (
      <div className="space-y-6">
        {/* Lesson Header with Quiz Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl text-primary font-bold mb-2">Ibisobanuro birambuye</h1>
            <p className="text-gray-600">
              Isomo rya {selectedChapter?.chapterNumber}: {selectedChapter?.title}
            </p>
          </div>
          
          {/* Quiz Button - Prominently placed */}
          <Button
            onClick={handleQuizClick}
            className="gap-2 bg-gradient-to-r from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 text-white font-semibold"
          >
            <Brain className="h-5 w-5" />
            Gerageza Ubumenyi Bwawe
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Iterambere</span>
            <span className="text-sm text-muted-foreground">
              {currentLesson.progressValue}% Byarakozwe
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentLesson.progressValue}%` }}
            />
          </div>
        </div>

        {/* Lesson Content with Fixed Height */}
        <Card className="overflow-hidden flex flex-col h-[500px] md:h-[450px]">
          <CardContent className="p-4 md:p-6 flex-1 overflow-y-auto">
            <div 
              className="prose prose-sm md:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: currentLesson.content }}
            />
          </CardContent>
        </Card>

        {/* Fixed Navigation - Stays at bottom */}
        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-10 md:flex-initial md:px-4"
            onClick={handlePreviousLesson}
            disabled={!hasPreviousLesson}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="md:hidden">Inyuma</span>
            <span className="hidden md:inline">Inyuma</span>
          </Button>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-12 justify-center">
            <span>{selectedLessonIndex + 1}</span>
            <span>/</span>
            <span>{lessons.length}</span>
          </div>
          
          <Button
            variant="outline"
            className="flex-1 gap-2 h-10 md:flex-initial md:px-4"
            onClick={handleNextLesson}
            disabled={!hasNextLesson}
          >
            <span className="md:hidden">Imbere</span>
            <span className="hidden md:inline">Imbere</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Loading state for initial chapters
  if (loading && chapters.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout
  const MobileLayout = () => (
    <div className="md:hidden">
      {selectedSection && lessons.length > 0 ? (
        <div className="space-y-6 pb-20">
          {/* Mobile Back Button */}
          <Button
            variant="ghost"
            className="gap-2 mb-4"
            onClick={() => {
              setSelectedSection(null);
              setLessons([]);
              setSelectedLessonIndex(0);
              setSelectedChapter(null);
              window.history.replaceState(null, "", "/inyigisho");
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Subira mu Bice
          </Button>

          {/* Lesson Content */}
          {loadingLessons ? (
            <LessonContentSkeleton />
          ) : (
            <LessonContent />
          )}
        </div>
      ) : (
        <MobileSectionList />
      )}
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <div className="hidden md:grid lg:grid-cols-4 gap-6">
      {/* Chapters and Sections Sidebar */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base truncate">Amasomo & Ibice</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {chapters.length} Amasomo araboneka
                </p>
              </div>
            </div>

            {/* Expand/Collapse All Buttons */}
            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAllChapters}
                className="flex-1 text-xs h-8"
              >
                Garagaza Byose
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAllChapters}
                className="flex-1 text-xs h-8"
              >
                Garagaza Bike
              </Button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {chapters.map((chapter) => (
                <ChapterItem key={chapter.id} chapter={chapter} />
              ))}
            </div>

            {/* Quiz Quick Access in Sidebar */}
            {selectedChapter && (
              <div className="mt-6 pt-4 border-t">
                <Button
                  onClick={handleQuizClick}
                  className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                >
                  <Brain className="h-4 w-4" />
                  Ikizamini cy'isomo
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Gerageza ubumenyi bwawe muri iri somo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-3">
        {selectedSection && lessons.length > 0 ? (
          <div className="space-y-6">
            {loadingLessons ? (
              <LessonContentSkeleton />
            ) : (
              <LessonContent />
            )}
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-12 text-center">
              <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hitamo Igice</h3>
              <p className="text-muted-foreground mb-6">
                Hitamo igice mu rutonde rw'ibitabo kugirango utangire kwiga
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar/>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <MobileLayout />
          <DesktopLayout />
        </div>
        
        {/* Quiz Modal */}
        {selectedChapter && showQuizModal && (
          <ChapterQuizModal
            chapterId={selectedChapter.id}
            chapterNumber={selectedChapter.chapterNumber}
            isOpen={showQuizModal}
            onClose={() => setShowQuizModal(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}