import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Settings, Bell, Languages, MessageCircle, Info, Users, LogOut, User, Crown, History, CreditCard, FileText, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useLocation } from "wouter";

interface UserPlan {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  planName: string;
}

interface UserPlanResponse {
  userPlans: UserPlan[];
  userActivePlan: UserPlan | null;
}

// Cache for user data
let userDataCache: any = null;
let userPlanCache: UserPlan | null = null;
let userPlansHistoryCache: UserPlan[] = [];
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function AccountPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("Kinyarwanda");
  const [activeSection, setActiveSection] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [userPlansHistory, setUserPlansHistory] = useState<UserPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [, setLocation] = useLocation();
  const hasFetchedRef = useRef(false);

  // Updated function to read user from localStorage with caching
  const readUserFromLocalStorage = () => {
    try {
      const now = Date.now();
      // Check cache first
      if (userDataCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached user data');
        return userDataCache;
      }
      
      if (typeof window === "undefined") return {};
      
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const userDataResult = {
          id: parsedUser._id || undefined,
          loginEmail: parsedUser.loginEmail || undefined,
          phone: parsedUser.phoneNumber || undefined,
          phoneCountryCode: parsedUser.phoneCountryCode || undefined,
          firstName: parsedUser.firstName || undefined,
          lastName: parsedUser.lastName || undefined,
          owner: parsedUser._owner || undefined,
          createdDate: parsedUser._createdDate || undefined,
          updatedDate: parsedUser._updatedDate || undefined,
          lastLogin: parsedUser.lastLogin || undefined,
          ...parsedUser
        };
        
        // Update cache
        userDataCache = userDataResult;
        cacheTimestamp = Date.now();
        
        return userDataResult;
      }
      
      const guestData = {
        id: localStorage.getItem("id") || undefined,
        loginEmail: localStorage.getItem("loginEmail") || undefined,
        phone: localStorage.getItem("phone") || localStorage.getItem("phoneNumber") || undefined,
      };
      
      // Update cache for guest
      userDataCache = guestData;
      cacheTimestamp = Date.now();
      
      return guestData;
    } catch (error) {
      console.error("Error reading user data:", error);
      return {};
    }
  };

  // Fetch user plan data with caching
  const fetchUserPlan = async (userId: string) => {
    if (!userId) {
      setUserPlan(null);
      setUserPlansHistory([]);
      return;
    }
    
    // Check cache first
    const now = Date.now();
    if (userPlanCache && userPlansHistoryCache.length > 0 && (now - (cacheTimestamp || 0)) < CACHE_DURATION) {
      console.log('Using cached user plan data');
      setUserPlan(userPlanCache);
      setUserPlansHistory(userPlansHistoryCache);
      return;
    }

    try {
      const response = await fetch("https://dataapis.wixsite.com/kora/_functions/getUserPlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data: UserPlanResponse = await response.json();
        setUserPlan(data.userActivePlan);
        setUserPlansHistory(data.userPlans || []);
        
        // Update cache
        userPlanCache = data.userActivePlan;
        userPlansHistoryCache = data.userPlans || [];
      } else {
        console.error("Failed to fetch user plan");
        setUserPlan(null);
        setUserPlansHistory([]);
        userPlanCache = null;
        userPlansHistoryCache = [];
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
      setUserPlan(null);
      setUserPlansHistory([]);
      userPlanCache = null;
      userPlansHistoryCache = [];
    }
  };

  // Load user data and plan from localStorage on component mount - ONLY ONCE
  useEffect(() => {
    const loadUserData = async () => {
      // Prevent multiple fetches
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        const userData = readUserFromLocalStorage();
        
        if (userData && Object.keys(userData).length > 0) {
          setUser(userData);
          setIsGuest(userData.isGuest || false);
          
          // Fetch user plan if user exists - only once on load
          const userId = userData.id || userData._id;
          if (userId) {
            await fetchUserPlan(userId);
          }
        } else {
          setIsGuest(true);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setIsGuest(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleLogout = () => {
    if (confirm("Ushaka kumara?")) {
      // Clear caches
      userDataCache = null;
      userPlanCache = null;
      userPlansHistoryCache = [];
      cacheTimestamp = null;
      
      localStorage.removeItem("user");
      setLocation("/");
      window.location.reload();
    }
  };

  const handleLoginRedirect = () => {
    setLocation("/login");
  };

  const handleSignupRedirect = () => {
    setLocation("/login?mode=signup");
  };

  // Get user level based on plan data
  const getUserLevel = () => {
    if (isGuest) return "Umushyitsi";
    if (!userPlan) return "Ubuntu";
    return userPlan.planName || "Ubuntu";
  };

  // Get plan status
  const getPlanStatus = () => {
    if (!userPlan) return "Ntacyakorwa";
    return userPlan.status === "ACTIVE" ? "Active" : "Canceled";
  };

  // Get plan end date
  const getPlanEndDate = () => {
    if (!userPlan || !userPlan.endDate) return "---";
    return userPlan.endDate;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    return dateString;
  };

  const menuItems = [
    {
      title: "Imyirondoro",
      value: "",
      hasArrow: true,
      type: "profileInfo",
      icon: User,
    },
    {
      title: "Ifatabuguzi",
      value: getUserLevel(),
      hasArrow: true,
      type: "subscription",
      icon: CreditCard,
    },
    {
      title: "Ifatabuguzi Ryanjye",
      value: userPlansHistory.length > 0 ? `${userPlansHistory.length} ifatabuguzi` : "Nta fatabuguzi rihari",
      hasArrow: true,
      type: "planHistory",
      icon: History,
    },
    {
      title: "Whatsapp",
      value: "",
      hasArrow: true,
      type: "whatsapp",
      icon: MessageCircle,
    },
    {
      title: "Ibyerekeye Kora",
      value: "",
      hasArrow: true,
      type: "about",
      icon: Info,
    },
  ];

  const handleLanguageSelect = () => {
    setLanguage(current => current === "Icyongereza" ? "Kinyarwanda" : "Icyongereza");
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = "+250792356500";
    const message = "Mwaramutse! Ndashaka kuvugana na Kora.";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleInviteFriends = () => {
    const shareText = "Reba Kora! Ni byiza cyane kugirango wige kandi ukore.";
    
    if (navigator.share) {
      navigator.share({
        title: 'Invitare kuri Kora',
        text: shareText,
        url: window.location.href,
      })
      .catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => alert('Injiza umubare wakoporoye!'))
        .catch(() => alert(shareText));
    }
  };

  const handleMenuItemClick = (type: string) => {
    switch (type) {
      case "profileInfo":
        if (isGuest) {
          alert("Imiterere: Umushyitsi\nEmail: guest@example.com\nTelefone: ---");
        } else {
          alert(`Amazina: ${getFullName()}\nEmail: ${getEmail()}\nTelefone: ${getPhoneNumber()}\nKontiyashyizweho: ${getAccountCreatedDate()}`);
        }
        break;
      case "subscription":
        setLocation("/subscribe");
        break;
      case "planHistory":
        setActiveSection("planHistory");
        break;
      case "language":
        handleLanguageSelect();
        break;
      case "whatsapp":
        handleWhatsAppClick();
        break;
      case "about":
        setActiveSection("about");
        break;
      default:
        break;
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (isGuest) return "M";
    if (!user) return "K";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "K";
  };

  // Get full name
  const getFullName = () => {
    if (isGuest) return "Umushyitsi";
    if (!user) return "Konte";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.loginEmail || "Kontiya";
  };

  // Get email
  const getEmail = () => {
    if (isGuest) return "umushyitsi@example.com";
    return user?.loginEmail || "---";
  };

  // Get phone number
  const getPhoneNumber = () => {
    if (isGuest) return "---";
    return user?.phone || user?.phoneNumber || "---";
  };

  // Get account creation date
  const getAccountCreatedDate = () => {
    if (isGuest) return "---";
    if (!user?.createdDate && !user?._createdDate) return "---";
    
    try {
      const date = new Date(user.createdDate || user._createdDate);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return user.createdDate || user._createdDate || "---";
    }
  };

  // Get last login date
  const getLastLoginDate = () => {
    if (isGuest) return "---";
    if (!user?.lastLogin) return "---";
    
    try {
      const date = new Date(user.lastLogin);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return user.lastLogin || "---";
    }
  };

  // Get badge color based on plan
  const getPlanBadgeColor = () => {
    const level = getUserLevel();
    if (level === "Ubuntu" || level === "Umushyitsi") return "bg-gray-100 text-gray-700";
    if (level.includes("Basic")) return "bg-blue-100 text-blue-700";
    if (level.includes("Premium") || level.includes("Pro")) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  // Show only minimal loading for plan data if needed
  const isPlanLoading = !userPlan && user && !isGuest && !userPlanCache;

  // Content for different sections
  const renderContent = () => {
    if (isGuest) {
      return (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Uburyo bwa Mushiitsi</h2>
          <p className="text-gray-600 mb-6">Injira kugirango ugere kuri buri kintu kandi uhunze amajya</p>
          
          {/* Subscription teaser for guest users */}
          <Card className="max-w-md mx-auto mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Hindura ugure urwego rwa Premium</h3>
              <p className="text-gray-600 text-sm mb-4">
                Kubona uburyo bwa Premium, HD streaming, no kubona byose utarabona ibyo bituguza
              </p>
              <div className="flex gap-2 justify-center">
                <span className="text-2xl font-bold text-green-600">500 FRW</span>
                <span className="text-gray-500 self-end">/ icyumweru</span>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={handleLoginRedirect}>
              Injira
            </Button>
            <Button variant="outline" onClick={handleSignupRedirect}>
              Kora Konti
            </Button>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nta Konti yabonetse</h2>
          <p className="text-gray-600 mb-4"> injira kugirango urebe imyirondoro yawe</p>
          <Button onClick={handleLoginRedirect}>
            Injira
          </Button>
        </div>
      );
    }

    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Imyirondoro</h2>
            
            {/* Subscription Status Card */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{getUserLevel()}</h3>
                    <p className="text-gray-600">
                      {isPlanLoading ? (
                        <span className="inline-flex items-center gap-2">
                          Free Plan
                        </span>
                      ) : (
                        <>
                          Izarangira: {getPlanEndDate()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getPlanBadgeColor()}>
                      {isPlanLoading ? "Free plan" : getPlanStatus()}
                    </Badge>
                    <Button 
                      onClick={() => setLocation("/subscribe")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {userPlan ? "Gucunga" : "Hindura ugure"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium">Amazina</span>
                    <span className="text-gray-600">{getFullName()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium">Email</span>
                    <span className="text-gray-600">{getEmail()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium">Numero ya Telefone</span>
                    <span className="text-gray-600">{getPhoneNumber()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium">Konti Yashyizweho</span>
                    <span className="text-gray-600">{getAccountCreatedDate()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium">Ubusanzwe winjiye</span>
                    <span className="text-gray-600">{getLastLoginDate()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900"> Konti Yanjye</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => item.type !== "notification" && handleMenuItemClick(item.type)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 bg-green-100 rounded-lg">
                            <Icon className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-900 font-medium block text-lg">
                              {item.title}
                            </span>
                            {item.type === "language" && (
                              <span className="text-gray-500">
                                Ibucyo: {language}
                              </span>
                            )}
                            {item.type === "subscription" && (
                              <span className="text-gray-500">
                                {getUserLevel()}
                              </span>
                            )}
                            {item.type === "planHistory" && (
                              <span className="text-gray-500">
                                {isPlanLoading ? "Ifatabuguzi Ryanjye" : item.value}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {item.type === "notification" && (
                            <Switch
                              checked={notificationsEnabled}
                              onCheckedChange={setNotificationsEnabled}
                            />
                          )}
                          
                          {item.hasArrow && (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "planHistory":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Ifatabuguzi Ryanje</h2>
              <Button 
                variant="outline" 
                onClick={() => setActiveSection("settings")}
                className="text-sm"
              >
                Subira inyuma
              </Button>
            </div>

            <Card className="bg-green-100 text-black">
              <CardContent className="p-6">
                {/* Active Plan */}
                {userPlan && (
                  <div className="mx-auto mb-8">
                    <div className="flex justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {userPlan.planName}
                      </h3>
                      <div
                        className={`text-xs px-3 py-1 rounded-3xl font-medium ${
                          userPlan.status === "ACTIVE"
                            ? "bg-green-600 text-black"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {userPlan.status === "ACTIVE" ? "Active" : "Canceled"}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-2 mb-6">
                      <div className="flex justify-between">
                        <span>Ryatangiye</span>
                        <span className="text-gray-600">
                          {formatDate(userPlan.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rizarangira</span>
                        <span className="text-gray-600">
                          {formatDate(userPlan.endDate)}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full bg-green-700 text-black border-black text-sm font-medium py-3 hover:bg-gray-600 transition"
                      onClick={() => setLocation("/subscribe")}
                    >
                      Gucunga Ifatabuguzi
                    </Button>

                    <div className="border-t-2 border-green-600 mt-8"></div>
                  </div>
                )}

                {/* Plan History */}
                <div className="mt-6">
                  <div className="space-y-8">
                    {userPlansHistory && userPlansHistory.length > 0 ? (
                      userPlansHistory
                        .filter((plan) => plan.id !== userPlan?.id)
                        .map((plan) => (
                          <div key={plan.id} className="mx-auto">
                            <div className="flex justify-between mb-4">
                              <h3 className="text-base font-semibold">
                                {plan.planName}
                              </h3>
                              <div
                                className={`text-xs px-3 py-1 rounded-3xl font-medium ${
                                  plan.status === "ACTIVE"
                                    ? "bg-green-600 text-black"
                                    : plan.status === "EXPIRED" 
                                    ? "bg-red-500 text-white"
                                    : "bg-red-600 text-white"
                                }`}
                              >
                                {plan.status === "ACTIVE" ? "Active" : "Canceled"}
                              </div>
                            </div>

                            <div className="text-sm text-gray-600 space-y-2 mb-6">
                              <div className="flex justify-between">
                                <span>Ryatangiye</span>
                                <span className="text-gray-600">
                                  {formatDate(plan.startDate)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Rizarangira</span>
                                <span className="text-gray-600">
                                  {formatDate(plan.endDate)}
                                </span>
                              </div>
                            </div>

                            <div className="border-t-2 border-green-600 mt-6"></div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Nta fatabuguzi ryabonetse</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Ifatabuguzi rigaragara hano
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={() => setLocation("/subscribe")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Hindura ugure Ifatabuguzi
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveSection("settings")}
                className="flex-1"
              >
                Subira inyuma
              </Button>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Ibyerekeye Kora</h2>
              <Button 
                variant="outline" 
                onClick={() => setActiveSection("settings")}
                className="text-sm"
              >
                Subira inyuma
              </Button>
            </div>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-6 text-gray-800">
                  <h3 className="text-lg font-bold text-gray-900">
                    Amategeko n' Amabwiriza (Terms and Conditions)
                  </h3>
                  
                  <p className="text-sm">
                    Izi Terms and Conditions zigenga uburyo ukoresha porogaramu KORANAWE. 
                    Ukoresheje iyi porogaramu, uba wemeye kubahiriza amategeko n'amabwiriza akurikira.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">1. UKO POROGARAMU IKORESHWA</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>KORANAWE ikwigisha amategeko y'umuhanda, ikaguha ibizamini byigana ibyemewe n'ibyapa.</li>
                        <li>Ibisubizo biri muri porogaramu bishingiye ku makuru rusange ashyirwaho n' inzego zibishinzwe mu gihugu.</li>
                        <li>Ukoresha porogaramu ku nyungu zawe bwite gusa, kandi ntugomba kuyikoresha mu buryo bushobora kuyangiza cyangwa kwangiza abandi.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">2. UBUBASHA N' UBRENGANZIRA (INTELLECTUAL PROPERTY)</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Ibiri muri porogaramu byose (ibibazo, ibisubizo, icon, design, interface) bigenewe KORANAWE.</li>
                        <li>Ntibyemewe kubyigana, kubikwirakwiza cyangwa kubikoresha mu nyungu z'ubucuruzi utabiherewe uburenganzira.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">3. AMAKURU Y'UKORESHA (USER DATA)</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>koranawe ishobora gukusanya amakuru make ajyanye n'imikoreshereze yawe (nko kureba aho utsinze n'aho utsindwa) kugirango tugufashe gutera imbere.</li>
                        <li>Nta makuru yihariye ajyanye n'ukumenyekana (personal data) twakira tudahawe uburenganzira.</li>
                        <li>Amakuru yose agirwa ibanga kandi ntatangwa ahandi.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">4. IBISUBIZO N' UBURYO BW'INYIGISHO</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>KORANAWE itanga amakuru agenewe kwigisha no gutegura ibizamini.</li>
                        <li>Nubwo dukorana nawe uko dushoboye ngo ibisubizo bibe bihuye n'ibyo inzego zibishinzwe zitanga, ntitwemeza ko buri gihe 100% byose ari ku rwego rumwe n'igihe nyacyo bitewe n'amavugurura mashya.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">5. AMAVUGURURA KURI POROGARAMU</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>KORANAWE ishobora kuvugurura porogaramu igihe icyo ari cyo cyose (ibibazo bishya, ibyapa bishya, gazeti nshya, n'ibindi).</li>
                        <li>Ukoresha porogaramu yemera ko aya mavugurura ashobora guhindura uburyo bw'imyigire cyangwa interface.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">6. UBURENGANZIRA BW'UKORESHA</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Ukoresha KORANAWE mu buryo butemewe n'amategeko cyangwa bushobora guteza ikibazo ku bandi, bizatuma uburenganzira bwo gukoresha porogaramu buhagarikwa.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">7. KWANGA MU GIHE HAGIZE IKIBAZO (DISCLAIMER)</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>koranawe ntishobora kubazwa ibiyivuyeho kubera amakosa y'umukoresha, cyangwa imikorere mibi y'ikindi gikoresho ukoresha (telefoni, internet, storage, n'ibindi).</li>
                        <li>Ibyemezo bya nyuma by'ibizamini bigengwa gusa n' inzego za Leta zibishinzwe.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">8. KUVUGURURA TERMS AND CONDITIONS</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Aya mabwiriza ashobora kuvugururwa igihe icyo ari cyo cyose.</li>
                        <li>Komeza ugenzure igihe cy'amavugurura igihe ushaka gukoresha porogaramu.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">9. UBURYO BWO KUDUHAMAGARA</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Ku bibazo, ibitekerezo cyangwa ibindi bisobanuro: tuganiriza kuri WhatsApp: +250 792 356 500</li>
                        <li>Email: support@koranawe.com</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-300">
                    <p className="text-sm italic text-gray-600">
                      Ushaka kuba umwe mu bantu batanga ibikorwa bya KORANAWE? 
                      <a href="https://wa.me/250792356500" className="text-green-600 hover:underline ml-1">
                        Twandikire
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={() => setActiveSection("settings")}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Subira inyuma
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Murakaza neza ku Igenamigambi</h2>
            <p className="text-gray-600">Hitamo ahakurikira kugirango utangire</p>
          </div>
        );
    }
  };

  // Show initial loading state only if we have no cached data
  const showInitialLoading = isLoading && !userDataCache;

  if (showInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar/>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">loading</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Green Overlay Section */}
        <div className={`${isGuest ? "bg-gray-600" : "bg-green-600"} text-white pt-8 pb-16 px-6 relative`}>
          <div className="absolute inset-0 opacity-10">
            <div className={`w-full h-full bg-gradient-to-r ${
              isGuest 
                ? "from-gray-700 via-gray-500 to-gray-400" 
                : "from-green-700 via-green-500 to-green-400"
            }`}></div>
          </div>
          
          <div className="relative z-10 max-w-md mx-auto">
            {/* Profile Card on Background */}
            <Card className={`${
              isGuest 
                ? "bg-white/10 backdrop-blur-sm border-white/20" 
                : "bg-white/10 backdrop-blur-sm border-white/20"
            } shadow-lg`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className={`h-16 w-16 border-2 ${
                    isGuest ? "border-gray-300" : "border-white"
                  }`}>
                    <AvatarFallback className={`${
                      isGuest 
                        ? "bg-gray-300 text-gray-600" 
                        : "bg-white text-green-600"
                    } font-semibold text-lg`}>
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-white font-semibold text-lg mb-1">
                      {getFullName()}
                    </h2>
                    <Badge className={`${getPlanBadgeColor()} border-0 px-3 py-1 font-semibold`}>
                      {isPlanLoading ? "Free Plan" : getUserLevel()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-md mx-auto px-6 -mt-8 relative z-20">
          {/* Guest Mode Notice */}
          {isGuest && (
            <Card className="shadow-lg border-0 mb-4 bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-yellow-800 font-medium text-sm">
                      Urikiri mu buryo bw'umushyitsi
                    </p>
                    <p className="text-yellow-700 text-xs">
                      Injira kugirango ugere kuri buri kintu kandi uhunze amajya
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Card - Only show when not in planHistory or about section on mobile */}
          {activeSection !== "planHistory" && activeSection !== "about" ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-0">
                {/* Settings Header */}
                <div className="flex items-center gap-3 p-6 border-b border-gray-100">
                  <Settings className={`h-5 w-5 ${isGuest ? "text-gray-600" : "text-green-600"}`} />
                  <h3 className="text-lg font-semibold text-gray-900">Igenamigambi</h3>
                </div>

                {/* Menu Items - INCLUDING PROFILE INFORMATION */}
                <div className="divide-y divide-gray-100">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => item.type !== "notification" && handleMenuItemClick(item.type)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            isGuest ? "bg-gray-50" : "bg-green-50"
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              isGuest ? "text-gray-600" : "text-green-600"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-900 font-medium block">
                              {item.title}
                            </span>
                            {item.type === "language" && (
                              <span className="text-gray-500 text-sm">
                                {language}
                              </span>
                            )}
                            {item.type === "subscription" && (
                              <span className="text-gray-500 text-sm">
                                {isPlanLoading ? "Free Plan" : getUserLevel()}
                              </span>
                            )}
                            {item.type === "planHistory" && (
                              <span className="text-gray-500 text-sm">
                                {isPlanLoading ? "---" : item.value}
                              </span>
                            )}
                            {item.type === "profileInfo" && (
                              <span className="text-gray-500 text-sm">
                                Reba hano
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.type === "notification" && (
                            <Switch
                              checked={notificationsEnabled}
                              onCheckedChange={setNotificationsEnabled}
                            />
                          )}
                          
                          {item.hasArrow && (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : activeSection === "planHistory" ? (
            // Plan History Content for Mobile
            <div className="space-y-6">
              <Card className="bg-green-100 text-black">
                <CardContent className="p-6">
                   
              <div className="flex items-center gap-4 mb-2 ">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("settings")}
                  className="p-2"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </Button>
                <h2 className="text-xl font-bold text-gray-900">Ifatabuguzi Ryanjye</h2>
              </div>

                  {/* Active Plan */}
                  {userPlan && (
                    <div className="mx-auto mb-8">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-base font-semibold">
                          {userPlan.planName}
                        </h3>
                        <div
                          className={`text-xs px-3 py-1 rounded-3xl font-medium ${
                            userPlan.status === "ACTIVE"
                              ? "bg-green-600 text-black"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {userPlan.status === "ACTIVE" ? "Active" : "Canceled"}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 space-y-2 mb-6">
                        <div className="flex justify-between">
                          <span>Itangiriro</span>
                          <span className="text-gray-600">
                            {formatDate(userPlan.startDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Iherezo</span>
                          <span className="text-gray-600">
                            {formatDate(userPlan.endDate)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full bg-green-500 text-white border-gray-600 text-sm font-medium py-3 hover:bg-gray-600 transition"
                        onClick={() => setLocation("/subscribe")}
                      >
                        Gucunga Ifatabuguzi
                      </Button>

                      <div className="border-t-2 border-green-600 mt-8"></div>
                    </div>
                  )}

                  {/* Plan History */}
                  <div className="mt-6">
                    <div className="space-y-6">
                      {userPlansHistory && userPlansHistory.length > 0 ? (
                        userPlansHistory
                          .filter((plan) => plan.id !== userPlan?.id)
                          .map((plan) => (
                            <div key={plan.id} className="mx-auto">
                              <div className="flex justify-between mb-3">
                                <h3 className="text-sm font-semibold text-black">
                                  {plan.planName}
                                </h3>
                                <div
                                  className={`text-xs px-2 py-1 rounded-3xl font-medium ${
                                    plan.status === "ACTIVE"
                                      ? "bg-green-600 text-black"
                                      : plan.status === "EXPIRED" 
                                      ? "bg-red-500 text-white"
                                      : "bg-red-600 text-black"
                                  }`}
                                >
                                  {plan.status === "ACTIVE" ? "Active" : "Canceled"}
                                </div>
                              </div>

                              <div className="text-xs text-gray-600 space-y-1 mb-4">
                                <div className="flex justify-between">
                                  <span>Ryatangiye</span>
                                  <span className="text-gray-600">
                                    {formatDate(plan.startDate)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Rizarangira</span>
                                  <span className="text-gray-600">
                                    {formatDate(plan.endDate)}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t-2 border-green-600 mt-4"></div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-6">
                          <History className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">Nta mateka yabonetse</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => setLocation("/subscribe")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Hindura ugure
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveSection("settings")}
                  className="flex-1 text-sm"
                >
                  Subira inyuma
                </Button>
              </div>
            </div>
          ) : (
            // About Content for Mobile
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("settings")}
                  className="p-2"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </Button>
                <h2 className="text-xl font-bold text-gray-900">Ibyerekeye Kora</h2>
              </div>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-4">
                  <div className="space-y-4 text-gray-800">
                    <h3 className="text-lg font-bold text-gray-900">
                      Amategeko n' Amabwiriza
                    </h3>
                    
                    <p className="text-xs">
                      Izi Terms and Conditions zigenga uburyo ukoresha porogaramu KORANAWE. 
                      Ukoresheje iyi porogaramu, uba wemeye kubahiriza amategeko n'amabwiriza akurikira.
                    </p>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">1. UKO POROGARAMU IKORESHWA</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>KORANAWE ikwigisha amategeko y'umuhanda, ikaguha ibizamini byigana ibyemewe n'ibyapa.</li>
                          <li>Ibisubizo biri muri porogaramu bishingiye ku makuru rusange ashyirwaho n' inzego zibishinzwe mu gihugu.</li>
                          <li>Ukoresha porogaramu ku nyungu zawe bwite gusa, kandi ntugomba kuyikoresha mu buryo bushobora kuyangiza cyangwa kwangiza abandi.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">2. UBUBASHA N' UBRENGANZIRA</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>Ibiri muri porogaramu byose bigenewe KORANAWE.</li>
                          <li>Ntibyemewe kubyigana, kubikwirakwiza cyangwa kubikoresha mu nyungu z'ubucuruzi.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">3. AMAKURU Y'UKORESHA</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>koranawe ishobora gukusanya amakuru make ajyanye n'imikoreshereze yawe.</li>
                          <li>Nta makuru yihariye ajyanye n'ukumenyekana twakira.</li>
                          <li>Amakuru yose agirwa ibanga kandi ntatangwa ahandi.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">4. IBISUBIZO N' UBURYO BW'INYIGISHO</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>KORANAWE itanga amakuru agenewe kwigisha no gutegura ibizamini.</li>
                          <li>Ntitwemeza ko buri gihe 100% byose ari ku rwego rumwe n'igihe nyacyo.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">5. AMAVUGURURA KURI POROGARAMU</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>KORANAWE ishobora kuvugurura porogaramu igihe icyo ari cyo cyose.</li>
                          <li>Ukoresha porogaramu yemera ko aya mavugurura ashobora guhindura uburyo bw'imyigire.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">6. UBURENGANZIRA BW'UKORESHA</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>Ukoresha KORANAWE mu buryo butemewe, bizatuma uburenganzira bwo gukoresha porogaramu buhagarikwa.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">7. KWANGA MU GIHE HAGIZE IKIBAZO</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>koranawe ntishobora kubazwa ibiyivuyeho kubera amakosa y'umukoresha.</li>
                          <li>Ibyemezo bya nyuma by'ibizamini bigengwa gusa n' inzego za Leta zibishinzwe.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">8. KUVUGURURA TERMS AND CONDITIONS</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>Aya mabwiriza ashobora kuvugururwa igihe icyo ari cyo cyose.</li>
                          <li>Komeza ugenzure igihe cy'amavugurura.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">9. UBURYO BWO KUDUHAMAGARA</h4>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          <li>Ku bibazo, ibitekerezo cyangwa ibindi bisobanuro: WhatsApp: +250 792 356 500</li>
                          <li>Email: support@koranawe.com</li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-300">
                      <p className="text-xs italic text-gray-600">
                        Ushaka kuba umwe mu bantu batanga ibikorwa bya KORANAWE? 
                        <a href="https://wa.me/250792356500" className="text-green-600 hover:underline ml-1">
                          Twandikire
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                onClick={() => setActiveSection("settings")}
                className="w-full text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Subira inyuma
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            {isGuest ? (
              <>
                <Button 
                  className="w-full h-12 font-medium shadow-sm"
                  onClick={handleLoginRedirect}
                >
                  <User className="h-4 w-4 mr-2" />
                  Injira mu Konti
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-12 text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm font-medium"
                  onClick={handleSignupRedirect}
                >
                  Kora Konti Nshya
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                className="w-full h-12 text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm font-medium"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sohoka  {/* CHANGED FROM "Sohoka" TO "Injira" */}
              </Button>
            )}
          </div>

          {/* Version */}
          <div className="text-center mt-8 pb-8">
            <p className="text-gray-500 text-sm">
              Kora • version
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Sidebar + Content */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="col-span-4">
              <Card className={`shadow-lg border-0 sticky top-8 bg-gradient-to-b ${
                isGuest
                  ? "from-gray-700 via-gray-500 to-gray-400"
                  : "from-green-700 via-green-500 to-green-400"
              }`}>
                <CardContent className="p-6">
                  {/* Profile Section */}
                  <div className="text-center mb-8">
                    <Avatar className={`h-24 w-24 border-4 mx-auto mb-4 ${
                      isGuest ? "border-gray-400" : "border-green-500"
                    }`}>
                      <AvatarFallback className={`${
                        isGuest 
                          ? "bg-gray-300 text-gray-600" 
                          : "bg-white text-green-500"
                      } font-semibold text-xl`}>
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {getFullName()}
                    </h2>
                    <Badge className={`${getPlanBadgeColor()} border-0 px-3 py-1 font-semibold`}>
                      {isPlanLoading ? "Free Plan" : getUserLevel()}
                    </Badge>
                  </div>

                  {/* Guest Notice */}
                  {isGuest && (
                    <div className="bg-white/20 rounded-lg p-3 mb-4">
                      <p className="text-white text-sm text-center">
                        Injira kugirango ugere kuri buri kintu
                      </p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="space-y-2">
                    <Button
                      variant={activeSection === "profile" ? "default" : "ghost"}
                      className="w-full justify-start h-12"
                      onClick={() => setActiveSection("profile")}
                    >
                      <Users className="h-4 w-4 mr-3" />
                      Imyirondoro
                    </Button>
                    
                    <Button
                      variant={activeSection === "settings" ? "default" : "ghost"}
                      className="w-full justify-start h-12"
                      onClick={() => setActiveSection("settings")}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Konti Yange
                    </Button>

                    <Button
                      variant={activeSection === "planHistory" ? "default" : "ghost"}
                      className="w-full justify-start h-12"
                      onClick={() => setActiveSection("planHistory")}
                    >
                      <History className="h-4 w-4 mr-3" />
                      Ifatabuguzi Ryanjye
                    </Button>

                    <Button
                      variant={activeSection === "about" ? "default" : "ghost"}
                      className="w-full justify-start h-12"
                      onClick={() => setActiveSection("about")}
                    >
                      <Info className="h-4 w-4 mr-3" />
                      Ibyerekeye Kora
                    </Button>

                    {/* Subscription Button */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12 text-black hover:bg-white/10"
                      onClick={() => setLocation("/subscribe")}
                    >
                      <CreditCard className="h-4 w-4 mr-3" />
                      {isPlanLoading ? "Gura Ifatabuguzi" : (userPlan ? "Gura Ifatabuguzi ryisumbuyeho" : "Gura Ifatabuguzi")}
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-2">
                    {isGuest ? (
                      <>
                        <Button 
                          className="w-full justify-start h-12 bg-white text-gray-700 hover:bg-gray-100"
                          onClick={handleLoginRedirect}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Injira
                        </Button>
                        <Button 
                          variant="ghost"
                          className="w-full justify-start h-12 text-white hover:bg-white/10"
                          onClick={handleSignupRedirect}
                        >
                          Kora Konti
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-12 text-white hover:bg-white/10"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sohoka  {/* CHANGED FROM "Sohoka" TO "Injira" */}
                      </Button>
                    )}
                  </div>

                  {/* Version */}
                  <div className="text-center mt-6 pt-6 border-t border-white/20">
                    <p className="text-gray-300 text-sm">
                      Kora • version
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Area */}
            <div className="col-span-8">
              <Card className="shadow-lg border-0 min-h-[600px]">
                <CardContent className="p-8">
                  {renderContent()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}