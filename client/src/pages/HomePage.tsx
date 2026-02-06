import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Trophy,
  Users,
  TrendingUp,
  ArrowRight,
  Play,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Star,
  Target,
  Clock,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { lessonQuizzes } from "./QuizzesPage";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Types for API responses
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
  lessonNumber: number;
  lessonImage: string | null;
}

interface LessonData {
  success: boolean;
  sectionId: string;
  data: Lesson[];
}

interface Exam {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  questionCount: number;
  duration: number;
}

// Cache for chapters data
let chaptersCache: Chapter[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function HomePage() {
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<
    "quiz-list" | "exam-prep" | "exam"
  >("quiz-list");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [location, setLocation] = useLocation();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // 0-6
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [practiceProgress, setPracticeProgress] = useState(0);
  // Add state to your homepage component
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [upgradeMessage, setUpgradeMessage] = useState("");

  // User authentication state
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real data states
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [featuredModules, setFeaturedModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  
  // Exam state
  const [randomExam, setRandomExam] = useState<Exam | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);

  // Use refs to prevent re-fetching
  const hasFetchedRef = useRef(false);

  // Mock user progress data - will be replaced with real data from backend
  const [userProgress, setUserProgress] = useState({
    learningTime: 8 * 60 + 24, // 8h 24m in minutes
    lessonsCompleted: 12,
    totalLessons: 16,
    practiceTests: 85,
  });

  // Check if user is logged in on component mount
  useEffect(() => {
    checkUserAuth();
  }, []);

  // Fetch chapters when component mounts (only once)
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchChaptersAndModules();
      fetchRandomExam();
      hasFetchedRef.current = true;
    }
  }, []);

  const checkUserAuth = async () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error checking user auth:", error);
    }
  };


// Fetch random exam from endpoint using POST method
const fetchRandomExam = async () => {
  try {
    setLoadingExam(true);
    const response = await fetch('https://dataapis.wixsite.com/kora/_functions/randomSetsByPlans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add any required body data if needed by the API
      body: JSON.stringify({

      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log the response to understand the structure
    console.log('Exam API response:', data);
    
    // Handle different response structures
    if (data) {
      let examData;
      
      // Check if data is an array
      if (Array.isArray(data)) {
        examData = data[0];
      } 
      // Check if data has a results/items property
      else if (data.results && Array.isArray(data.results)) {
        examData = data.results[0];
      }
      else if (data.items && Array.isArray(data.items)) {
        examData = data.items[0];
      }
      // Check if data is already an object
      else if (typeof data === 'object' && data !== null) {
        examData = data;
      }
      
      if (examData) {
        setRandomExam({
          id: examData.id || examData._id || "1",
          title: examData.title || examData.name || "Ikizamini cy'isuzuma",
          description: examData.description || examData.desc || "Isuzuma ry'ibiganiro by'imodoka",
          difficulty: examData.difficulty || examData.level || "Medium",
          questionCount: examData.questionCount || examData.totalQuestions || examData.questions || 20,
          duration: examData.duration || examData.timeLimit || 30,
        });
      } else {
        // If no exam data found, use fallback
        setFallbackExam();
      }
    } else {
      setFallbackExam();
    }
  } catch (error) {
    console.error('Error fetching random exam:', error);
    setFallbackExam();
  } finally {
    setLoadingExam(false);
  }
};

// Helper function for fallback exam data
const setFallbackExam = () => {
  setRandomExam({
    id: "fallback-exam",
    title: "Ikizamini cy'isuzuma",
    description: "Isuzuma ry'ibiganiro by'imodoka",
    difficulty: "Medium",
    questionCount: 20,
    duration: 30,
  });
};

  // Fetch real chapters and create featured modules
  const fetchChaptersAndModules = async () => {
    const now = Date.now();
    if (chaptersCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      setChapters(chaptersCache);
      createFeaturedModules(chaptersCache);
      return;
    }

    try {
      setLoadingModules(true);
      const response = await fetch('https://dataapis.wixsite.com/kora/_functions/ChaptersWithSections');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Chapter[] = await response.json();
      
      chaptersCache = data;
      cacheTimestamp = Date.now();
      
      setChapters(data);
      createFeaturedModules(data);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      const fallbackModules = getFallbackModules();
      setFeaturedModules(fallbackModules);
    } finally {
      setLoadingModules(false);
    }
  };

  const createFeaturedModules = (chaptersData: Chapter[]) => {
    const modules = chaptersData.slice(0, 3).map((chapter, index) => {
      const icons = [Target, Zap, TrendingUp];
      const colors = [
        "from-blue-500 to-cyan-500",
        "from-green-500 to-emerald-500", 
        "from-orange-500 to-red-500"
      ];
      
      return {
        id: chapter.id,
        title: chapter.title,
        description: `Learn essential concepts from Chapter ${chapter.chapterNumber}`,
        level: `CHAPTER ${chapter.chapterNumber}`,
        progress: `${chapter.sections.length} sections`,
        imageUrl: chapter.image,
        lessonsCount: chapter.sections.length,
        progressValue: Math.round(Math.min((index / 3) * 100, 75)),
        icon: icons[index] || BookOpen,
        color: colors[index] || "from-blue-500 to-cyan-500",
        chapterNumber: chapter.chapterNumber
      };
    });
    
    setFeaturedModules(modules);
  };

  const getFallbackModules = () => [
    {
      id: "1",
      title: "Traffic Signs & Signals",
      description: "Master all essential road signs, signals, and markings for safe driving in Rwanda",
      level: "CHAPTER 1",
      progress: "Basic Road Signs",
      imageUrl: "https://c8.alamy.com/comp/2GE268G/set-of-road-safety-signs-warning-road-transport-symbol-vector-collection-2GE268G.jpg",
      lessonsCount: 45,
      progressValue: 75,
      icon: Target,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "2", 
      title: "Road Safety Rules",
      description: "Learn defensive driving techniques and emergency procedures",
      level: "CHAPTER 2",
      imageUrl: "https://c8.alamy.com/comp/2GE268G/set-of-road-safety-signs-warning-road-transport-symbol-vector-collection-2GE268G.jpg",
      progress: "Defensive Driving",
      lessonsCount: 32,
      progressValue: 40,
      icon: Zap,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "3",
      title: "Vehicle Control & Maneuvers", 
      description: "Master parking, turning, and vehicle handling skills",
      level: "CHAPTER 3",
      progress: "Basic Controls",
      imageUrl: "https://c8.alamy.com/comp/2GE268G/set-of-road-safety-signs-warning-road-transport-symbol-vector-collection-2GE268G.jpg",
      lessonsCount: 28,
      progressValue: 60,
      icon: TrendingUp,
      color: "from-orange-500 to-red-500",
    },
  ];

  const learningPaths = [
    {
      id: "1",
      title: "Beginner Driver Course",
      description: "Complete foundation course for new drivers starting from zero",
      levels: 8,
      duration: "4 weeks", 
      students: "2.4k",
      icon: BookOpen,
      imageUrl: chapters[0]?.image || "https://c8.alamy.com/comp/2GE268G/set-of-road-safety-signs-warning-road-transport-symbol-vector-collection-2GE268G.jpg",
    },
    {
      id: "2",
      title: "Advanced Driving Skills",
      description: "Master complex driving scenarios and defensive techniques", 
      levels: 6,
      duration: "3 weeks",
      students: "1.8k",
      icon: Trophy,
      imageUrl: chapters[1]?.image || "https://c8.alamy.com/comp/2GE268G/set-of-road-safety-signs-warning-road-transport-symbol-vector-collection-2GE268G.jpg",
    },
    {
      id: "3",
      title: "Rwanda Road Test Prep",
      description: "Specific preparation for Rwanda driving license examination",
      levels: 5,
      duration: "2 weeks",
      students: "3.2k", 
      icon: Users,
      imageUrl: chapters[2]?.image || "https://c8.alamy.com/comp/2GE268G/set-of-road-safety-signs-warning-road-transport-symbol-vector-collection-2GE268G.jpg",
    },
  ];

  const stats = [
    { title: "Active Learners", value: "12,847", icon: Users, change: "+12%" },
    { title: "Pass Rate", value: "94.2%", icon: Trophy, change: "+3.2%" },
    { title: "Practice Questions", value: "500+", icon: BookOpen, change: "Updated" },
    { title: "Avg. Completion", value: "86%", icon: TrendingUp, change: "+8%" },
  ];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Index: 0-6
const mobileWeekDays = ["S", "M", "T", "W", "T", "F", "S"]; // Index: 0-6

  const mobileModules = featuredModules.slice(0, 2).map(module => ({
    id: module.id,
    title: module.title,
    description: module.description,
    level: module.level,
    progress: module.progress,
    lessonsCount: module.lessonsCount,
    isPremium: false,
    imageUrl: module.imageUrl,
    progressValue: module.progressValue
  }));

  // Calendar functionality
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

// Modified startExam function for homepage
const startExam = () => {
  requireAuth(async () => {
    console.log("Starting exam...");
    
    try {
      // Get user ID
      const userData = localStorage.getItem("user");
      let userId = '';
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          userId = parsedUser?._id || '';
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
      
      // Call API
      const response = await fetch('https://dataapis.wixsite.com/kora/_functions/randomSetsByPlans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exam: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check user plan
      const userPlan = data.userPlan;
      const planName = userPlan?.planName?.toLowerCase() || '';
      const allowedPlans = ["classic", "unique"];
      
      if (!allowedPlans.includes(planName)) {
        // Show upgrade modal on homepage
        const currentPlan = userPlan?.planName || "Nta fatabuguzi";
        const message = `Iki kizamini cyemerewe ifatabuguzi rya Classic cyangwa Unique. Ubu ufite "${currentPlan}"`;
        
        setUpgradeMessage(message);
        setShowUpgradeModal(true);
        return;
      }
      
      // User has valid plan, save data and navigate
      const randomSetData = data.randomSet;
      const examQuestions = randomSetData?.questions || [];
      
      if (examQuestions.length === 0) {
        throw new Error("No questions received");
      }
      
      // Transform and save questions
      const transformedQuestions = examQuestions.map((q: any, index: number) => ({
        id: index + 1,
        text: q.title || `Question ${index + 1}`,
        imageUrl: q.image || undefined,
        explanation: "Iki kizamini gikorwa mugihe waba urangije kwiga no kwisuzuma neza",
        choices: (q.choice || []).map((choiceText: string, choiceIndex: number) => ({
          id: String.fromCharCode(65 + choiceIndex),
          text: choiceText || `Choice ${String.fromCharCode(65 + choiceIndex)}`,
          isCorrect: choiceIndex === (q.choiceAnswer || 0)
        }))
      }));
      
      const examData = {
        randomSet: {
          questions: examQuestions,
          title: randomSetData?.setNumber ? `Set ${randomSetData.setNumber}` : "Ikizamini cy'isuzuma",
          imageCount: randomSetData?.imageCount || 0,
          totalQuestions: randomSetData?.totalQuestions || examQuestions.length,
          setNumber: randomSetData?.setNumber,
          apiResponse: data
        },
        transformedQuestions: transformedQuestions,
        userPlan: userPlan
      };
      
      localStorage.setItem('exam-questions', JSON.stringify(examData));
      setLocation(`/ibibazo?exam=direct&source=homepage`);
      
    } catch (error) {
      console.error("Error:", error);
      alert("Ntibyakunze gukura ikizamini. Ongera ugerageze.");
    }
  }, "take practice exams");
};

  // Actions that require authentication
  const startQuiz = (quizId: string) => {
    requireAuth(() => {
      console.log("Starting quiz navigation");
      setLocation(`/ibibazo`);
    }, "take quizzes");
  };

  const startRandomExam = () => {
    requireAuth(() => {
      const randomQuiz = lessonQuizzes[Math.floor(Math.random() * lessonQuizzes.length)];
      setLocation(`/ibibazo`);
    }, "take practice exams");
  };

  const continueModule = (moduleId: string) => {
    requireAuth(() => {
      const chapter = chapters.find(ch => ch.id === moduleId);
      if (chapter && chapter.sections.length > 0) {
        setLocation(`/inyigisho`);
      } else {
        setLocation(`/inyigisho`);
      }
    }, "access lessons");
  };

  const exploreLearningPath = (pathId: string) => {
    requireAuth(() => {
      const path = learningPaths.find((p) => p.id === pathId);
      if (path) {
        setLocation("/inyigisho");
      }
    }, "explore learning paths");
  };

  const handleDaySelect = (dayIndex: number) => {
    requireAuth(() => {
      setSelectedDay(dayIndex);
      alert(`Loading content for ${weekDays[dayIndex]}...`);
    }, "track daily progress");
  };

  const handleCalendarDayClick = (day: number) => {
    requireAuth(() => {
      if (day) {
        const date = new Date(currentYear, currentMonth, day);
        alert(`Selected date: ${date.toDateString()}\nViewing study sessions for this date...`);
      }
    }, "use study calendar");
  };

  const viewAllLessons = () => {
    requireAuth(() => {
      setLocation("/inyigisho");
    }, "view all lessons");
  };

  const viewDetailedAnalytics = () => {
    requireAuth(() => {
      setLocation("/analytics");
    }, "view detailed analytics");
  };

  const getMonthName = (month: number) => {
    return new Date(currentYear, month).toLocaleString("default", {
      month: "long",
    });
  };

  const requireAuth = (action: () => void, featureName: string) => {
    if (!user) {
      alert(`Please login to ${featureName}`);
      handleLoginRedirect();
      return;
    }
    action();
  };

  const handleLoginRedirect = () => {
    setLocation("/login");
  };

  const handleSignupRedirect = () => {
    setLocation("/login?mode=signup");
  };

 // ... (keep all the imports and types above as they are)
// ... (keep all the state and useEffect hooks above as they are)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto">
        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="px-2 py-2">
            
            <section className="mb-8">
              <h2 className="text-gray-900 text-2xl font-bold mb-2 px-2"></h2>

              {/* Week Days - Mobile Only */}
              <div className="mb-6 px-1">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-gray-800">Daily Progress</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    Icyumweru {Math.ceil((selectedDay + 1) / 7)} • {Math.round(((selectedDay + 1) / 7) * 100)}%
                  </span>
                </div>

                <div className="relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden">
                  <div className="p-3">
                    <div className="grid grid-cols-7 gap-1">
                      {mobileWeekDays.map((day, index) => (
                        <button
                          key={day}
                          onClick={() => handleDaySelect(index)}
                          className={`
                            flex flex-col items-center justify-center gap-1 
                            py-2 rounded-lg transition-all duration-300
                            ${index === selectedDay && user
                              ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105 ring-1 ring-primary/30"
                              : "bg-white/90 text-gray-900 hover:bg-white hover:shadow-md"
                            }
                            ${!user ? "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-white/90" : ""}
                            min-h-[4rem]
                          `}
                          disabled={!user}
                        >
                          <div className={`
                            transition-transform duration-300
                            ${index === selectedDay && user
                              ? "text-white"
                              : "text-gray-700"
                            }
                          `}>
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                            </svg>
                          </div>

                          <span className={`
                            text-xs font-semibold transition-colors
                            ${index === selectedDay && user
                              ? "text-white"
                              : "text-gray-900"
                            }
                          `}>
                            {day}
                          </span>

                          <div className={`
                            w-1.5 h-1.5 rounded-full transition-colors
                            ${index === selectedDay && user
                              ? "bg-white/80"
                              : index < selectedDay && user
                              ? "bg-green-400"
                              : "bg-gray-400"
                            }
                          `} />
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-white/70 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${((selectedDay + 1) / 7) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-700 whitespace-nowrap">
                        {Math.round(((selectedDay + 1) / 7) * 100)}% complete
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-1">
                      {weekDays.map((fullDay, index) => (
                        <div
                          key={fullDay}
                          className="text-center text-[10px] text-gray-700 font-medium truncate"
                        >
                          {fullDay}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Practice Card */}
              <Card className="mb-6 mx-2 bg-green-100">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-800" />
                      <span className="text-xs font-semibold text-green-800">
                        Igerageza ry'uy'umunsi
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold leading-tight text-gray-900">
                      kora amagerageza wiyungure ubumenyi
                    </h3>
                    <Button
                      className="w-full gap-2 bg-green-600 hover:bg-green-700 h-10 text-sm text-white"
                      onClick={startRandomExam}
                    >
                      {practiceProgress > 0 && user
                        ? `gukurura... ${practiceProgress}%`
                        : user ? "Tangira Isuzuma" : "Injira ubone kwisuzuma"}
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="border-t border-gray-300 my-6 mx-2"></div>
              
              {/* New: Ikizamini cy'isuzuma Card - Mobile */}
              <Card className="mb-4 mx-2 bg-blue-100 text-gray-900">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-700" />
                      <span className="text-xs font-semibold text-blue-800">
                        Ikizamini cy'isuzuma
                      </span>
                    </div>
                    {loadingExam ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-blue-300 rounded animate-pulse"></div>
                        <div className="h-3 bg-blue-300 rounded animate-pulse w-3/4"></div>
                      </div>
                    ) : randomExam ? (
                      <>
                        <h3 className="text-sm font-semibold leading-tight text-gray-900">
                          {randomExam.title}
                        </h3>
                        <p className="text-xs text-gray-800 opacity-90">
                          {randomExam.description}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-2">
                          <div className="flex items-center gap-2 text-gray-800">
                            <BookOpen className="h-3 w-3" />
                            <span>{randomExam.questionCount} Questions</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-800">
                            <Clock className="h-3 w-3" />
                            <span>{randomExam.duration} min</span>
                          </div>
                        </div>
                      </>
                    ) : null}
                    
                    <Button
                      className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-semibold mt-3"
                      onClick={startExam}
                      disabled={loadingExam}
                    >
                      {loadingExam ? (
                        "Loading..."
                      ) : user ? (
                        <>
                          Tangira ikizamini
                          <Play className="h-3 w-3" />
                        </>
                      ) : (
                        "Injira ubone kwisuzuma"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Jump Back In Section */}
              <div className="mb-6 px-2">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Komeza Kwiga</h3>

                <div className="space-y-3 mb-4">
                  {loadingModules ? (
                    [1, 2].map((i) => (
                      <Card key={i} className="bg-green-100">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="h-4 bg-gray-400 rounded animate-pulse w-3/4 mb-1"></div>
                              <div className="h-3 bg-gray-400 rounded animate-pulse w-1/2 mb-1"></div>
                              <div className="h-3 bg-gray-400 rounded animate-pulse w-1/3"></div>
                            </div>
                            <div className="h-7 w-7 bg-gray-400 rounded-full animate-pulse"></div>
                          </div>
                          <div className="h-1 bg-gray-400 rounded animate-pulse mb-1"></div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="h-3 bg-gray-400 rounded animate-pulse w-16"></div>
                            <div className="h-3 bg-gray-400 rounded animate-pulse w-20"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    mobileModules.map((module) => (
                      <Card
                        key={module.id}
                        className="hover:shadow-md transition-shadow bg-green-100 cursor-pointer"
                        onClick={() => continueModule(module.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1 text-gray-900">
                                {module.title}
                              </h4>
                              <p className="text-xs text-gray-700 mb-1">
                                {module.level}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {module.progress}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex-shrink-0 ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                continueModule(module.id);
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                          <Progress value={module.progressValue} className="h-1 mb-1 bg-gray-300" />
                          <div className="flex justify-between items-center text-xs text-gray-700">
                            <span>{module.progressValue}% complete</span>
                            <span className="font-medium">{user ? "Continue" : "Login to Start"}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 h-10 text-sm text-gray-900"
                  onClick={viewAllLessons}
                >
                  Amasomo yose
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>

              {loadingModules ? (
                <div className="space-y-3 px-2">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-green-100">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gray-400 rounded-lg animate-pulse"></div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-400 rounded animate-pulse w-3/4"></div>
                            <div className="h-3 bg-gray-400 rounded animate-pulse w-1/2"></div>
                            <div className="h-3 bg-gray-400 rounded animate-pulse w-full"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 px-2">
                  {mobileModules.map((module) => (
                    <Card
                      key={module.id}
                      className="hover:shadow-md transition-shadow bg-green-100 cursor-pointer"
                      onClick={() => continueModule(module.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <img
                              src={module.imageUrl || "/placeholder-image.jpg"}
                              alt={module.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </div>

                          <div className="flex-1 space-y-2">
                            <h4 className="font-semibold text-sm text-gray-900">
                              {module.title}
                            </h4>
                            <p className="text-xs text-gray-700 leading-relaxed">
                              {module.description}
                            </p>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-700">
                                {module.lessonsCount} sections
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1 text-gray-900"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  continueModule(module.id);
                                }}
                              >
                                {user ? "Start" : "Login"}
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="py-6">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                     Ahabanza
                    </h2>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="h-4 w-4" />
                      <span>Ibyagezweho uyu munsi</span>
                    </div>
                  </div>
                  
                  {/* Week Navigation */}
                  <Card className="mb-2 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex gap-3">
                        {weekDays.map((day, index) => (
                          <button
                            key={day}
                            onClick={() => handleDaySelect(index)}
                            className={`flex-1 flex flex-col items-center gap-2 py-1 rounded-xl transition-all duration-300 group ${
                              index === selectedDay && user
                                ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20"
                                : "bg-white/90 text-gray-900 hover:bg-white hover:shadow-md hover:scale-102"
                            } ${!user ? "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-white/90" : ""}`}
                            disabled={!user}
                          >
                            <div
                              className={`transition-transform duration-300 group-hover:scale-110 ${
                                index === selectedDay && user
                                  ? "text-white"
                                  : "text-gray-700 group-hover:text-primary/80"
                              }`}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                              </svg>
                            </div>

                            <span
                              className={`text-sm font-semibold transition-colors ${
                                index === selectedDay && user
                                  ? "text-white"
                                  : "text-gray-900 group-hover:text-gray-900"
                              }`}
                            >
                              {day}
                            </span>

                            <div
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                index === selectedDay && user
                                  ? "bg-white/80"
                                  : index < selectedDay && user
                                  ? "bg-green-500"
                                  : "bg-gray-400 group-hover:bg-gray-500"
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 bg-white/70 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${((selectedDay + 1) / 7) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                          Icyumweru {Math.ceil((selectedDay + 1) / 7)} •{" "}
                          {Math.round(((selectedDay + 1) / 7) * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                
                  {/* Quick Practice Card */}
                  <Card className="bg-green-100 text-gray-900 mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-green-800" />
                            <span className="text-xs font-semibold text-green-800">
                              Igerageza ry'uy'umunsi
                            </span>
                          </div>
                          <h3 className="text-xs font-bold leading-tight text-gray-900">
                            Kora amagerageza wiyungure ubumenyi
                          </h3>
                        </div>
                        <div className="bg-white/80 p-3 rounded-2xl">
                          <Star className="h-6 w-6 text-yellow-500" />
                        </div>
                      </div>
                      <Button
                        className="w-full mt-2 bg-green-600 text-white hover:bg-green-700 h-10 text-sm font-semibold shadow-lg"
                        onClick={startRandomExam}
                        disabled={practiceProgress > 0 && practiceProgress < 100 && user}
                      >
                        {practiceProgress > 0 && user ? (
                          <>
                            <Progress
                              value={practiceProgress}
                              className="w-20 h-2 mr-2 bg-white/30"
                            />
                            {practiceProgress}% Complete
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            {user ? "Tangira Isuzuma" : "Injira Wisuzume"}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* New: Ikizamini cy'isuzuma Card - Desktop */}
                  <Card className="mb-4 bg-blue-100 text-gray-900 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white/80">
                              <Target className="h-5 w-5 text-blue-700" />
                            </div>
                            <div>
                              {loadingExam ? (
                                <div className="space-y-2 mt-2">
                                  <div className="h-5 bg-blue-300 rounded animate-pulse w-48"></div>
                                  <div className="h-4 bg-blue-300 rounded animate-pulse w-64"></div>
                                </div>
                              ) : randomExam ? (
                                <>
                                  <h3 className="text-xl font-bold mt-1 text-gray-900">
                                    {randomExam.title}
                                  </h3>
                                  <p className="text-sm text-gray-800 max-w-xl">
                                    {randomExam.description}
                                  </p>
                                </>
                              ) : null}
                            </div>
                          </div>
                          
                          {randomExam && (
                            <div className="flex items-center gap-6 text-sm justify-between">
                              <div className="flex items-center gap-2 text-gray-800">
                                <BookOpen className="h-4 w-4" />
                                <span>Ibibazo {randomExam.questionCount}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-800">
                                <Clock className="h-4 w-4" />
                                <span>iminota {randomExam.duration}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        className="w-full mt-6 h-12 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={startExam}
                        disabled={loadingExam}
                      >
                        {loadingExam ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading Exam...
                          </div>
                        ) : user ? (
                          <> <Play className="h-4 w-4 ml-2" />
                            Tangira ikizamini
                          </>
                        ) : (
                          "Injira ubone kwisuzuma"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </section>

                {/* Continue Learning */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Komeza Kwiga
                    </h2>
                    <Button
                      variant="ghost"
                      className="gap-2 text-gray-700 hover:text-gray-900"
                      onClick={viewAllLessons}
                    >
                      Reba byose
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {loadingModules ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="bg-white">
                          <CardContent className="p-6">
                            <div className="animate-pulse">
                              <div className="flex items-start justify-between mb-4">
                                <div className="space-y-3 flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-400 rounded-xl"></div>
                                    <div className="space-y-2">
                                      <div className="h-4 bg-gray-400 rounded w-32"></div>
                                      <div className="h-3 bg-gray-400 rounded w-20"></div>
                                    </div>
                                  </div>
                                  <div className="h-3 bg-gray-400 rounded w-3/4"></div>
                                </div>
                                <div className="w-9 h-9 bg-gray-400 rounded-full"></div>
                              </div>
                              <div className="space-y-3">
                                <div className="h-2 bg-gray-400 rounded w-full"></div>
                                <div className="h-2 bg-gray-400 rounded w-2/3"></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {featuredModules.map((module) => {
                        const Icon = module.icon;
                        return (
                          <Card
                            key={module.id}
                            className="group hover:shadow-xl transition-all duration-300 bg-white cursor-pointer"
                            onClick={() => continueModule(module.id)}
                          >
                            <CardContent className="p-0">
                              <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`p-2 rounded-xl bg-gradient-to-r ${module.color}`}
                                      >
                                        <Icon className="h-5 w-5 text-white" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-gray-900">
                                          {module.title}
                                        </h3>
                                        <p className="text-xs text-gray-700">
                                          {module.level}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {module.description}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white shadow-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      continueModule(module.id);
                                    }}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-gray-900">
                                      {module.progress}
                                    </span>
                                    <span className="text-gray-700">
                                      {module.progressValue}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={module.progressValue}
                                    className="h-2 bg-gray-300"
                                  />
                                  <div className="flex justify-between items-center text-xs text-gray-700">
                                    <span>{module.lessonsCount} sections</span>
                                    <span className="font-medium">{user ? "Continue learning" : "Login to start"}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Learning Paths */}
                <section>
                  <h2 className="text-3xl w-full font-bold mb-6 text-gray-900">
                    Amasomo
                  </h2>
                  {loadingModules ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="bg-white h-full">
                          <CardContent className="p-0 h-full">
                            <div className="h-32 bg-gray-400 animate-pulse"></div>
                            <div className="p-4 space-y-3">
                              <div className="h-4 bg-gray-400 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-400 rounded animate-pulse w-3/4"></div>
                              <div className="h-9 bg-gray-400 rounded animate-pulse mt-4"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {chapters.slice(0, 3).map((chapter, index) => {
                        const icons = [BookOpen, Trophy, Users];
                        const Icon = icons[index] || BookOpen;
                        
                        return (
                          <Card
                            key={chapter.id}
                            className="group hover:shadow-xl transition-all duration-300 bg-white overflow-hidden cursor-pointer h-full flex flex-col"
                            onClick={() => continueModule(chapter.id)}
                          >
                            <CardContent className="p-0 flex flex-col h-full">
                              <div className="h-32 relative overflow-hidden flex-shrink-0">
                                <img
                                  src={chapter.image || "/placeholder-path.jpg"}
                                  alt={chapter.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20"></div>
                                <div className="absolute top-3 left-3 p-2 rounded-xl bg-white/80 backdrop-blur-sm">
                                  <Icon className="h-4 w-4 text-gray-900" />
                                </div>
                                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-primary text-white text-xs font-medium">
                                  Chapter {chapter.chapterNumber}
                                </div>
                              </div>

                              <div className="p-4 flex-1 flex flex-col">
                                <div className="flex-1 space-y-2 mb-4">
                                  <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">
                                    {chapter.title}
                                  </h3>
                                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                                    Tangira kwiga isomo {chapter.title}
                                  </p>
                                </div>
                                <Button
                                  className="w-full bg-primary hover:bg-primary/90 h-9 text-sm font-semibold text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    continueModule(chapter.id);
                                  }}
                                >
                                  {user ? "Start" : "Get Started"}
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column - Calendar & Progress */}
              <div className="space-y-12">
                {/* Study Calendar */}
                <section>
                  <Card className="bg-white shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Kalendari
                          </h3>
                          <p className="text-sm text-gray-700">
                            Genzura uko wize
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-700"
                          onClick={handlePrevMonth}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold text-gray-900">
                          {getMonthName(currentMonth)} {currentYear}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-700"
                          onClick={handleNextMonth}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-3">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (day) => (
                            <div
                              key={day}
                              className="text-center text-xs font-semibold text-gray-700 py-2"
                            >
                              {day.charAt(0)}
                            </div>
                          )
                        )}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().map((day, index) => (
                          <button
                            key={index}
                            onClick={() => day && handleCalendarDayClick(day)}
                            className={`h-8 rounded-lg text-xs font-medium transition-all ${
                              day === new Date().getDate() &&
                              currentMonth === new Date().getMonth() &&
                              currentYear === new Date().getFullYear()
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                                : day &&
                                  day <= new Date().getDate() &&
                                  currentMonth === new Date().getMonth() &&
                                  currentYear === new Date().getFullYear()
                                ? "bg-green-600 text-white shadow-md shadow-green-500/25"
                                : "text-gray-900 hover:bg-gray-100 hover:scale-105"
                            } ${!day ? "invisible" : ""} ${!user ? "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-transparent" : ""}`}
                            disabled={!user}
                          >
                            {day}
                          </button>
                        ))}
                      </div>

                      <div className="mt-6 space-y-3 pt-4 border-t border-gray-300">
                        <div className="flex items-center gap-3 text-xs">
                          <div className="w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
                          <span className="text-gray-700">
                            Izarangiye
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div>
                          <span className="text-gray-700">
                            Isomo ry'uy'umunsi
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Weekly Progress */}
                <section>
                  <Card className="bg-blue-50 text-gray-900 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 text-gray-900">Weekly Progress</h3>
                      {user ? (
                        <>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">
                                Icyo cyo kwiga
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {Math.floor(userProgress.learningTime / 60)}h{" "}
                                {userProgress.learningTime % 60}m
                              </span>
                            </div>
                            <Progress
                              value={(userProgress.learningTime / (10 * 60)) * 100}
                              className="h-2 bg-blue-200"
                            />

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">
                                Amasomo warangije
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {userProgress.lessonsCompleted}/
                                {userProgress.totalLessons}
                              </span>
                            </div>
                            <Progress
                              value={
                                (userProgress.lessonsCompleted /
                                  userProgress.totalLessons) *
                                100
                              }
                              className="h-2 bg-blue-200"
                            />

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">
                                Practice Tests
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {userProgress.practiceTests}% Avg.
                              </span>
                            </div>
                            <Progress
                              value={userProgress.practiceTests}
                              className="h-2 bg-blue-200"
                            />
                          </div>

                          <Button
                            variant="outline"
                            className="w-full mt-6 bg-blue-100 hover:bg-blue-200 text-gray-900 h-10"
                            onClick={viewDetailedAnalytics}
                          >
                            Reba byose
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-700 mb-4">
                            Injira utangire gukora amasuzuma
                          </p>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleLoginRedirect}
                          >
                            Injira ukurikirane uko wiga
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
          
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setShowUpgradeModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
              Ntago Wemerewe
            </h3>
            <p className="text-gray-800 text-center text-sm mb-6">
              {upgradeMessage}
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 rounded-xl text-gray-700"
              >
                Gufunga
              </Button>
              <Button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setLocation("/subscribe");
                }}
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
              >
                Gura Classic
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}