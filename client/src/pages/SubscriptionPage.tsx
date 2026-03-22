// components/SubscriptionPage.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Crown,
  Check,
  X,
  Loader2,
  ChevronRight,
  X as XIcon,
} from "lucide-react";
import { FaCreditCard } from "react-icons/fa";
import ProtectedRoute from "@/components/ProtectedRoute";

// Types
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency?: string;
  period: string;
  description: string;
  features: { name: string; included: boolean }[];
}

interface DurationPlan {
  id: string;
  name: string;
  price: number;
  periodNumber: number;
  periodName: string;
  planName: string;
  priceInFull: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  image: string;
}

type Step = "plans" | "payment-method" | "duration" | "confirmation";

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isInOtpPhase, setIsInOtpPhase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment states
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "failed"
  >("pending");
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<
    string | null
  >(null);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [localPaymentError, setLocalPaymentError] = useState<string | null>(
    null,
  );
  const [paymentTransactionId, setPaymentTransactionId] = useState<
    string | null
  >(null);
const [socket, setSocket] = useState<WebSocket | null>(null);
  // WebSocket ref
  const socketRef = useRef<WebSocket | null>(null);

  // Mobile overlay states
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [showDurationOverlay, setShowDurationOverlay] = useState(false);
  const [showConfirmationOverlay, setShowConfirmationOverlay] = useState(false);
  const [tempSelectedPaymentMethod, setTempSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [tempSelectedDuration, setTempSelectedDuration] = useState<
    string | null
  >(null);

  // Mock data - replace with your actual data
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "e9d493c2-52a8-4ce8-8ec6-b8090e3c8ca6",
      name: "Basic Pack",
      price: 500,
      currency: "RWF",
      period: "/ Icyumweru",
      description: "Iki nibyiza ubabona mugishe muganze iri fatabuguzi",
      features: [
        { name: "Ibizamini 3", included: true },
        { name: "Amasomo Yose", included: true },
        { name: "Ikizamini Cy'isuzuma", included: false },
        { name: "Kureba Video", included: false },
      ],
    },
    {
      id: "9be70c72-4b62-4048-afe3-227d0487cd3b",
      name: "Classic Pack",
      price: 1000,
      currency: "RWF",
      period: "/ Icyumweru",
      description: "Iki nibyiza ubabona mugishe muganze iri fatabuguzi",
      features: [
        { name: "Ibizamini Byose", included: true },
        { name: "Amasomo Yose", included: true },
        { name: "Ikizamini Cy'isuzuma", included: true },
        { name: "Kureba Video", included: false },
      ],
    },
    {
      id: "bc47ed44-b96a-4135-bdce-9a5a3c84a417",
      name: "Unique + Pack",
      price: 1500,
      currency: "RWF",
      period: "/ Icyumweru",
      description: "Iki nibyiza ubabona mugishe muganze iri fatabuguzi",
      features: [
        { name: "Ibizamini Byose", included: true },
        { name: "Amasomo Yose", included: true },
        { name: "Ikizamini Cy'isuzuma", included: true },
        { name: "Kureba Video", included: true },
      ],
    },
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: "mtn-rw",
      name: "MTN | Airtel Rwanda",
      description: "Choose to pay with MTN | Airtel Rwanda",
      image: "https://flagcdn.com/w320/rw.png",
    },
    {
      id: "visa",
      name: "VISA & MasterCard",
      description: "Choose to Pay with VISA & MasterCard",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png",
    },
    {
      id: "mtn-ug",
      name: "MTN | Airtel Uganda",
      description: "Choose to pay with MTN | Airtel Uganda",
      image: "https://flagcdn.com/w320/ug.png",
    },
    {
      id: "mpesa-ke",
      name: "MPESA Kenya",
      description: "Choose to pay with MPESA Kenya",
      image: "https://flagcdn.com/w320/ke.png",
    },
    {
      id: "mtn-zm",
      name: "MTN | AIRTEL | ZANTEL Zambia",
      description: "Choose to pay with MTN | AIRTEL | ZANTEL Zambia",
      image: "https://flagcdn.com/w320/zm.png",
    },
    {
      id: "lumicash",
      name: "LUMICASH || Ecocash Burundi",
      description: "Choose to pay with LUMICASH || Ecocash Burundi",
      image: "https://flagcdn.com/w320/bi.png",
    },
    {
      id: "airtel-drc",
      name: "AIRTEL | VODACOM ORANGE | DRC 2",
      description: "Choose to pay with AIRTEL | VODACOM ORANGE | DRC 2",
      image: "https://flagcdn.com/w320/cd.png",
    },
    {
      id: "vodacom-orange",
      name: "AIRTEL | VODACOM ORANGE | DRC franc",
      description: "Choose to pay with AIRTEL | VODACOM ORANGE | DRC Franc",
      image: "https://flagcdn.com/w320/cd.png",
    },
    {
      id: "mpesa-tz",
      name: "MPESA Tanzania",
      description: "Choose to pay with MPESA Tanzania",
      image: "https://flagcdn.com/w320/tz.png",
    },
    {
      id: "mtn-orange",
      name: "MTN | ORANGE",
      description: "Choose to pay with MTN | ORANGE",
      image: "https://flagcdn.com/w320/cm.png",
    },
  ];

  // Duration plans calculation
  const calculateDurationPlans = (plan: SubscriptionPlan) => {
    const weeks: DurationPlan[] = Array.from({ length: 3 }, (_, i) => {
      const weekCount = i + 1;
      const total = weekCount * plan.price;
      return {
        id: `week-${weekCount}`,
        name: `I${weekCount > 1 ? "b" : "c"}yumweru ${weekCount}`,
        price: total,
        periodNumber: weekCount,
        periodName: "Week",
        planName: plan.name,
        priceInFull: `${total.toLocaleString()} ${plan.currency || "RWF"}`,
      };
    });

    const months: DurationPlan[] = Array.from({ length: 12 }, (_, i) => {
      const monthCount = i + 1;
      const baseMonthPrice = plan.price * 4;
      const totalPrice = monthCount * baseMonthPrice;

      return {
        id: `month-${monthCount}`,
        name: `${monthCount > 1 ? "Am" : "Ukw"}ezi ${monthCount}`,
        price: totalPrice,
        periodNumber: monthCount,
        periodName: "Month",
        planName: plan.name,
        priceInFull: `${totalPrice.toLocaleString()} ${plan.currency || "RWF"}`,
      };
    });

    return { weeks, months };
  };

  const [durationPlans, setDurationPlans] = useState<{
    weeks: DurationPlan[];
    months: DurationPlan[];
  }>({ weeks: [], months: [] });

  useEffect(() => {
    if (selectedPlan) {
      const plan = subscriptionPlans.find((p) => p.id === selectedPlan);
      if (plan) {
        setDurationPlans(calculateDurationPlans(plan));
      }
    }
  }, [selectedPlan]);

  // Calculate withdrawal fee (4% of the final price)
  const calculateWithdrawalFee = (baseAmount: number) => {
    return Math.round(baseAmount * 0.04);
  };

  // Calculate total amount with fee
  const calculateTotalWithFee = (baseAmount: number) => {
    const fee = calculateWithdrawalFee(baseAmount);
    return baseAmount + fee;
  };

  // Mobile overlay management
  useEffect(() => {
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      setShowPaymentOverlay(currentStep === "payment-method");
      setShowDurationOverlay(currentStep === "duration");
      setShowConfirmationOverlay(currentStep === "confirmation");
    } else {
      setShowPaymentOverlay(false);
      setShowDurationOverlay(false);
      setShowConfirmationOverlay(false);
    }
  }, [currentStep]);

  // When overlays open, initialize temp selections
  useEffect(() => {
    if (showPaymentOverlay) {
      setTempSelectedPaymentMethod(selectedPaymentMethod);
    }
    if (showDurationOverlay) {
      setTempSelectedDuration(selectedDuration);
    }
  }, [
    showPaymentOverlay,
    showDurationOverlay,
    selectedPaymentMethod,
    selectedDuration,
  ]);

  // Helper function to read user data
  const readUserFromLocalStorage = () => {
    try {
      if (typeof window === "undefined") return {};

      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        return {
          id: parsedUser._id || undefined,
          loginEmail: parsedUser.loginEmail || undefined,
          phone: parsedUser.phoneNumber || undefined,
          phoneCountryCode: parsedUser.phoneCountryCode || undefined,
          firstName: parsedUser.firstName || undefined,
          lastName: parsedUser.lastName || undefined,
          owner: parsedUser._owner || undefined,
          createdDate: parsedUser._createdDate || undefined,
          updatedDate: parsedUser._updatedDate || undefined,
          ...parsedUser,
        };
      }

      return {
        id: localStorage.getItem("id") || undefined,
        loginEmail: localStorage.getItem("loginEmail") || undefined,
        phone:
          localStorage.getItem("phone") ||
          localStorage.getItem("phoneNumber") ||
          undefined,
      };
    } catch (error) {
      console.error("Error reading user data:", error);
      return {};
    }
  };

  // Reset payment states
  const resetPaymentStates = () => {
    setPaymentStatusMessage(null);
    setPaymentStatus("pending");
    setIsPaymentCompleted(false);
    setError(null);
    setIsInOtpPhase(false);
    setOtp("");
    setLocalPaymentError(null);
    setHasSubscribed(false);
    setIsWebSocketConnected(false);
    setPaymentTransactionId(null);
  };

     // Initialize WebSocket connection
  const initializeWebSocket = (userId: string) => {
    resetPaymentStates();
    
        const API_KEY = "zqhSEQ.i8sg_g:a0GCvG7NcM_7S_lEEQqkfK7OmLVAz_HXWmZLh7DxP5k";
    const wsUrl = `wss://realtime.ably.io/?key=${API_KEY}&v=1.2&format=json&heartbeats=true&echo=false`;

    try {
      const newSocket = new WebSocket(wsUrl);
      setSocket(newSocket);

      newSocket.onopen = () => {
        console.log("WebSocket connected");
        setIsWebSocketConnected(true);
        
        // Subscribe to user's channel
        const subscribeMessage = {
          action: 10,
          channel: userId,
        };
        
        newSocket.send(JSON.stringify(subscribeMessage));
        setHasSubscribed(true);
        setPaymentStatusMessage("Gutangira kugenzura ubwishyu...");
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);

          // Only handle messages of type '15' (message publish)
          if (data.action === 15 && Array.isArray(data.messages) && data.messages.length > 0) {
            const msg = data.messages[0];

            // Parse the JSON string inside msg.data
            let parsedData;
            try {
              parsedData = JSON.parse(msg.data);
            } catch {
              parsedData = {};
            }

            // Handle success
            if (msg.name === "success") {
              const successMessage = parsedData.kin || parsedData.eng || "Ubwishyu Bwakiriwe!";
              console.log("Payment success:", successMessage);
              
              // Update UI state
              setPaymentStatusMessage(successMessage);
              setPaymentStatus('success');
              setIsPaymentCompleted(true);
              setLocalPaymentError(null);
              
              // Close WebSocket connection after success
              setTimeout(() => {
                if (newSocket) newSocket.close();
              }, 3000);
            }

            // Handle failure
            else if (msg.name === "failed") {
              const failMessage = parsedData.kin || parsedData.eng || "Kwishyura Byanze";
              console.log("Payment failed:", failMessage);
              
              // Update UI state
              setPaymentStatusMessage(failMessage);
              setPaymentStatus('failed');
              setIsPaymentCompleted(true);
              setLocalPaymentError(failMessage);
              
              // Close WebSocket connection after failure
              setTimeout(() => {
                if (newSocket) newSocket.close();
              }, 5000);
            }
            
            // Handle other message types if needed
            else if (msg.name === "pending" || msg.name === "processing") {
              const pendingMessage = parsedData.kin || parsedData.eng || "Ubwishyu burageneye...";
              setPaymentStatusMessage(pendingMessage);
              setPaymentStatus('pending');
            }
          }
        } catch (err) {
          console.warn("Received non-JSON message:", event.data);
        }
      };

      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsWebSocketConnected(false);
        setLocalPaymentError("Connection error - please try again");
      };

      newSocket.onclose = (event) => {
        console.log("WebSocket closed:", event);
        setIsWebSocketConnected(false);
        setHasSubscribed(false);
      };
    } catch (err) {
      console.error("Connection error:", err);
      setLocalPaymentError("Failed to establish connection");
    }
  };
  // Payment submission
  const handleSubmitPayment = async () => {
    setIsLoading(true);
    setError(null);
    setLocalPaymentError(null);

    try {
      const user = readUserFromLocalStorage();
      const selectedPlanData = subscriptionPlans.find(
        (p) => p.id === selectedPlan,
      );
      const selectedDurationData = [
        ...durationPlans.weeks,
        ...durationPlans.months,
      ].find((d) => d.id === selectedDuration);

      if (!selectedPlanData || !selectedDurationData) {
        setError("Hitamo ifatabuguzi n'igihe mbere yo gukomeza");
        return;
      }

      // Calculate base amount and fee
      const baseAmount = selectedDurationData.price;
      const feeAmount = calculateWithdrawalFee(baseAmount);
      const totalAmount = calculateTotalWithFee(baseAmount);

      const payload = {
        id: user.id,
        planId: selectedPlan,
        baseAmount: baseAmount,
        feeAmount: feeAmount,
        amount: totalAmount,
        currency: selectedPlanData.currency || "RWF",
        email: user.loginEmail || "",
        languageCode: "rn",
        otp: isInOtpPhase ? otp : "",
        paymentGateway: "Afripay",
        paymentType: selectedPaymentMethod?.includes("visa")
          ? "card"
          : "mobile",
        period: selectedDurationData.periodNumber.toString(),
        periodName: selectedDurationData.periodName,
        phoneNumber: phoneNumber || user.phone || "",
      };

      console.log("Submitting payment payload:", payload);

      // Simulate API call - replace with your actual endpoint
      const response = await fetch(
        "https://dataapis.wixsite.com/kora/_functions/paymentData",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Payment API response:", result);

        if (result.requiresOtp || result.isOtpPhase) {
          setIsInOtpPhase(true);
          setPaymentStatusMessage("Shyiramo OTP wakiriye kuri telefone");
        } else {
          // Initialize WebSocket connection for payment tracking
          if (user.id) {
            initializeWebSocket(user.id);
            setPaymentStatusMessage("Ubwishyu burengeje...");
          } else {
            throw new Error("User ID not found");
          }
        }
      } else {
        throw new Error("Ubwishyu bwanzwe");
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(err instanceof Error ? err.message : "Ubwishyu bwanzwe");
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // ===== PAYMENT STATUS COMPONENTS =====

  // Desktop Payment Status Component
  const renderDesktopPaymentStatus = () => {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-6">
        <div className="text-center">
          {/* Loading State */}
          {paymentStatus === "pending" && (
            <>
              <div className="mb-2">
                <img
                  src="https://storage.googleapis.com/flutterflow-prod-hosting/builds/UKRsLlchjRvPgoLWHAoq/assets/assets/images/Loading.gif"
                  alt="Loading"
                  className="w-16 h-16 mx-auto"
                />
              </div>
              <div className="text-lg font-semibold text-white mb-2">
                Kugenzura Ubwishyu...
              </div>
              <div className="text-sm text-blue-400 max-w-xs">
                {paymentStatusMessage || "Ubwishyu burengeje, tegereza gato..."}
              </div>
            </>
          )}

          {/* Success State */}
          {paymentStatus === "success" && (
            <>
              <div className="mb-2">
                <img
                  src="https://static.wixstatic.com/media/d7f9fb_cbc6cfef0b1b4373bc6639dd6f307303~mv2.gif"
                  alt="Payment Success"
                  className="w-16 h-16 mx-auto"
                />
              </div>
              <div className="text-lg font-semibold text-white mb-2">
                Ubwishyu Bwakiriwe!
              </div>
              <div className="text-sm text-green-400 max-w-xs">
                {paymentStatusMessage ||
                  "Murakoze — ubwishyu bwakiriwe neza. Ifatabuguzi ryanyu ryashyizweho."}
              </div>
            </>
          )}

          {/* Failed State */}
          {paymentStatus === "failed" && (
            <>
              <div className="mb-2">
                <img
                  src="https://static.wixstatic.com/media/d7f9fb_ca3a41be4e1a484cb26c7bda7509e553~mv2.gif"
                  alt="Payment Failed"
                  className="w-16 h-16 mx-auto"
                />
              </div>
              <div className="text-lg font-semibold text-white mb-2">
                Ubwishyu Bwanzwe
              </div>
              <div className="text-sm text-red-400 max-w-xs">
                {paymentStatusMessage ||
                  "Ubwishyu bwanzwe. Ongera ugerageze cyangwa usabe ubufasha."}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {paymentStatus === "success" ? (
            <Button
              onClick={() => setLocation("/konte")}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              Komeza
            </Button>
          ) : paymentStatus === "failed" ? (
            <>
              <Button
                onClick={() => {
                  resetPaymentStates();
                  setCurrentStep("payment-method");
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4"
              >
                Subira Inyuma
              </Button>
              <Button
                onClick={() => {
                  resetPaymentStates();
                  handleSubmitPayment();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4"
              >
                Ongera Ugerageze
              </Button>
            </>
          ) : null}
        </div>
      </div>
    );
  };

  // Mobile Payment Status Component
  const renderMobilePaymentStatus = () => {
    return (
      <div className="text-center py-4">
        {/* Loading State */}
        {paymentStatus === "pending" && (
          <>
            <div className="mb-2">
              <img
                src="https://storage.googleapis.com/flutterflow-prod-hosting/builds/UKRsLlchjRvPgoLWHAoq/assets/assets/images/Loading.gif"
                alt="Loading"
                className="w-16 h-16 mx-auto"
              />
            </div>
            <div className="text-md text-blue-400 mb-2">
              {paymentStatusMessage || "Kugenzura ubwishyu..."}
            </div>
          </>
        )}

        {/* Success State */}
        {paymentStatus === "success" && (
          <>
            <div className="text-md text-green-400 mb-2">
              {paymentStatusMessage || "Murakoze — ubwishyu bwakiriwe neza."}
            </div>
            <div className="mb-2">
              <img
                src="https://static.wixstatic.com/media/d7f9fb_cbc6cfef0b1b4373bc6639dd6f307303~mv2.gif"
                alt="Payment Success"
                className="w-16 h-16 mx-auto"
              />
            </div>
            <Button
              onClick={() => setLocation("/konte")}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Komeza
            </Button>
          </>
        )}

        {/* Failed State */}
        {paymentStatus === "failed" && (
          <>
            <div className="text-md text-red-400 mb-2">
              {paymentStatusMessage || "Ubwishyu bwanzwe. Ongera ugerageze."}
            </div>
            <div className="mb-2">
              <img
                src="https://static.wixstatic.com/media/d7f9fb_ca3a41be4e1a484cb26c7bda7509e553~mv2.gif"
                alt="Payment Failed"
                className="w-16 h-16 mx-auto"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  resetPaymentStates();
                  setShowConfirmationOverlay(false);
                  setCurrentStep("payment-method");
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Subira
              </Button>
              <Button
                onClick={() => {
                  resetPaymentStates();
                  handleSubmitPayment();
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Ongera
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Mobile Overlay Components
  const renderMobilePaymentOverlay = () => (
    <div className="fixed inset-0 z-50 sm:hidden flex items-end">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/40"
        onClick={() => setShowPaymentOverlay(false)}
      />

      <div className="relative bg-white dark:bg-[#1c1c1c] w-full rounded-t-2xl max-h-[70vh] flex flex-col shadow-2xl z-50">
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-500 rounded-full" />
        </div>

        <div className="px-4 pb-2 text-center">
          <h3 className="text-gray-900 dark:text-white font-medium text-base">
            Hitamo Uburyo Bwo Kwishyura
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Kanda kuri serivisi wishaka gukoresha
          </p>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 space-y-2 py-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setTempSelectedPaymentMethod(method.id)}
                className={`w-full flex items-center justify-between rounded-lg px-4 py-3 border ${
                  tempSelectedPaymentMethod === method.id
                    ? "border-green-500 bg-green-50 dark:bg-green-600/20"
                    : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2a2a]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={method.image}
                    alt={method.name}
                    className="w-8 h-6 object-contain rounded-sm"
                  />
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {method.name}
                  </span>
                </div>

                {tempSelectedPaymentMethod === method.id ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-gray-400 dark:border-gray-500" />
                )}
              </button>
            ))}

            <div className="h-4" />
          </div>

          <div className="sticky bottom-0 w-full p-4 bg-white dark:bg-[#1c1c1c] border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={() => {
                setShowPaymentOverlay(false);
                if (tempSelectedPaymentMethod) {
                  setSelectedPaymentMethod(tempSelectedPaymentMethod);
                  setCurrentStep("duration");
                }
              }}
              disabled={!tempSelectedPaymentMethod}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg py-3 disabled:bg-gray-400 disabled:text-gray-600 dark:disabled:bg-gray-600 dark:disabled:text-gray-400"
            >
              Komeza
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMobileDurationOverlay = () => (
    <div className="fixed inset-0 z-50 sm:hidden flex items-end">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/40"
        onClick={() => setShowDurationOverlay(false)}
      />

      <div className="relative bg-white dark:bg-[#1c1c1c] w-full rounded-t-2xl max-h-[70vh] flex flex-col shadow-2xl z-50">
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-500 rounded-full" />
        </div>

        <div className="px-4 pb-2 text-center">
          <h3 className="text-gray-900 dark:text-white font-medium text-base">
            Hitamo Igihe
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Kanda kuri icyumweru cyangwa amezi wishaka
          </p>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {/* Icyumweru Section */}
            <div className="mb-4">
              <h4 className="text-green-600 dark:text-green-200 text-lg font-medium mb-3 text-center">
                Icyumweru
              </h4>
              <div className="space-y-2">
                {durationPlans.weeks.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setTempSelectedDuration(plan.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-4 py-3 border ${
                      tempSelectedDuration === plan.id
                        ? "border-green-500 bg-green-50 dark:bg-green-600/20"
                        : "border-green-500 dark:border-green-50 bg-green-600/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {plan.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {plan.price.toLocaleString()} RWF
                      </span>
                      {tempSelectedDuration === plan.id ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-400 dark:border-gray-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amezi Section */}
            <div>
              <h4 className="text-green-600 dark:text-green-200 text-lg font-medium mb-3 text-center">
                Amezi
              </h4>
              <div className="space-y-2">
                {durationPlans.months.slice(0, 6).map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setTempSelectedDuration(plan.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-4 py-3 border ${
                      tempSelectedDuration === plan.id
                        ? "border-green-500 bg-green-50 dark:bg-green-600/20"
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2a2a]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {plan.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {plan.price.toLocaleString()} RWF
                      </span>
                      {tempSelectedDuration === plan.id ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-400 dark:border-gray-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4" />
          </div>

          <div className="sticky bottom-0 w-full p-4 bg-white dark:bg-[#1c1c1c] border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={() => {
                setShowDurationOverlay(false);
                if (tempSelectedDuration) {
                  setSelectedDuration(tempSelectedDuration);
                  setCurrentStep("confirmation");
                }
              }}
              disabled={!tempSelectedDuration}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg py-3 disabled:bg-gray-400 disabled:text-gray-600 dark:disabled:bg-gray-600 dark:disabled:text-gray-400"
            >
              Komeza
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Confirmation Overlay
  const renderMobileConfirmationOverlay = () => {
    const selectedPlanData = subscriptionPlans.find(
      (p) => p.id === selectedPlan,
    );
    const selectedDurationData = [
      ...durationPlans.weeks,
      ...durationPlans.months,
    ].find((d) => d.id === selectedDuration);

    if (!selectedPlanData || !selectedDurationData) {
      return null;
    }

    const baseAmount = selectedDurationData.price;
    const feeAmount = calculateWithdrawalFee(baseAmount);
    const totalAmount = calculateTotalWithFee(baseAmount);

    // Dates
    const startDate = new Date();
    let endDate = new Date(startDate);

    if (selectedDurationData.periodName.toLowerCase() === "week") {
      endDate.setDate(
        startDate.getDate() + selectedDurationData.periodNumber * 7,
      );
    } else if (selectedDurationData.periodName.toLowerCase() === "month") {
      endDate.setMonth(
        startDate.getMonth() + selectedDurationData.periodNumber,
      );
    }

    const formatDate = (date: Date) =>
      date.toLocaleDateString("rw-RW", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });

    return (
      <div className="fixed inset-0 z-50 sm:hidden flex items-end">
        <div
          className="absolute inset-0 bg-black/40 dark:bg-black/40"
          onClick={() => setShowConfirmationOverlay(false)}
        />

        <div className="relative bg-white dark:bg-[#1c1c1c] w-full rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl z-50">
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-500 rounded-full" />
          </div>

          <div className="px-4 pb-2 text-center">
            <h3 className="text-gray-900 dark:text-white font-medium text-base">
              Kwemeza Kwishyura
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Kurikiza amabwiriza yose yuko bishyura
            </p>
          </div>

          {/* WebSocket Status for Mobile */}
          {paymentTransactionId && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 mx-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isWebSocketConnected
                        ? hasSubscribed
                          ? "bg-green-500"
                          : "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-xs text-blue-600 dark:text-blue-300">
                    {isWebSocketConnected
                      ? hasSubscribed
                        ? "Kugenzura..."
                        : "Gutangira..."
                      : "Ntago bigenzura"}
                  </span>
                </div>
                {paymentStatusMessage && (
                  <span className="text-xs text-gray-700 dark:text-white">
                    {paymentStatusMessage}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
            {/* Show payment completion status for mobile */}
            {isPaymentCompleted ? (
              renderMobilePaymentStatus()
            ) : (
              <>
                {/* Show loading when WebSocket is connected */}
                {isWebSocketConnected && !isPaymentCompleted ? (
                  <div className="text-center py-4">
                    <div className="mb-2">
                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                            Shyiramo PIN wemeze muri telefone yanyu , mutabonye
                            ubutumwa kanda : *182*7*1#
                          </p>

                          <div className="flex justify-center items-center mt-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                        </div>
                    <div className="text-md text-blue-400 mb-2">
                      {paymentStatusMessage || "Kugenzura ubwishyu..."}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Summary Section */}
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4">
                      <h4 className="text-gray-900 dark:text-white font-semibold mb-3">
                        Incamake
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Ifatabuguzi:
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {selectedPlanData?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Igihe:
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {selectedDurationData?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Itangiriro:
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {formatDate(startDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Iherezo:
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {formatDate(endDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Igiciro:
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {baseAmount.toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Ikiguzi (4%):
                          </span>
                          <span className="text-yellow-600 dark:text-yellow-500">
                            + {feeAmount.toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-900 dark:text-white">
                            Igiteranyo:
                          </span>
                          <span className="text-green-600 dark:text-green-500">
                            {totalAmount.toLocaleString()} RWF
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Section */}
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4">
                      {/* Card Payment Button for Mobile */}
                      {selectedPaymentMethod?.includes("visa") ? (
                        <div className="text-center py-4">
                          <div className="text-gray-900 dark:text-white font-semibold mb-3">
                            VISA & MasterCard
                          </div>
                          <Button
                            onClick={handleSubmitPayment}
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 mb-3"
                          >
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : null}
                            Ishura Ukoresheje Ikarita (
                            {totalAmount.toLocaleString()} RWF)
                          </Button>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Secure payment processed by our payment partner
                          </div>
                        </div>
                      ) : (
                        /* Mobile Payment for non-card methods */
                        <>
                          {!isInOtpPhase ? (
                            <>
                              <div className="mb-3">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 text-center">
                                  Andika nimero muri bukoreshe mwishyura
                                </p>
                                <input
                                  type="tel"
                                  value={phoneNumber}
                                  onChange={(e) =>
                                    setPhoneNumber(e.target.value)
                                  }
                                  placeholder="078 ••••••"
                                  className="w-full px-4 py-3 rounded-lg border border-green-500 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none text-center"
                                />
                              </div>

                              {/* Fee notice */}
                              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg mb-4">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                                  <span className="font-semibold">
                                    Icyitonderwa:
                                  </span>{" "}
                                  Iki kiguzi cya 4% kizakoreshwa mu gihe
                                  wishyura.
                                </p>
                              </div>

                              <Button
                                onClick={handleSubmitPayment}
                                disabled={!phoneNumber || isLoading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                              >
                                {isLoading && (
                                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                )}
                                Ohereza Ubwishyu ({totalAmount.toLocaleString()}{" "}
                                RWF)
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="mb-3">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 text-center">
                                  Shyiramo OTP wakiriye kuri telefone
                                </p>
                                <input
                                  type="text"
                                  value={otp}
                                  onChange={(e) =>
                                    setOtp(e.target.value.replace(/\D/g, ""))
                                  }
                                  placeholder="Andika OTP hano"
                                  className="w-full px-4 py-3 rounded-lg border-2 border-green-500 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none text-center text-lg font-semibold"
                                />
                              </div>

                              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg mb-4">
                                <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                                  Ubwishyu bukenewe:{" "}
                                  <span className="font-bold">
                                    {totalAmount.toLocaleString()} RWF
                                  </span>
                                </p>
                              </div>

                              <Button
                                onClick={handleSubmitPayment}
                                disabled={!otp || isLoading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                              >
                                {isLoading && (
                                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                )}
                                Emeza Ubwishyu
                              </Button>
                            </>
                          )}
                        </>
                      )}

                      {localPaymentError && (
                        <div className="mt-3 text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          {localPaymentError}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPlanSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Hitamo Ifatabuguzi
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Hitamo ifatabuguzi rikwiye ibyo ushaka
        </p>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 sm:hidden mb-8">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative py-2 cursor-pointer transition-all rounded-lg border-2 shadow-sm ${
              selectedPlan === plan.id
                ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                : "border-green-500 dark:border-green-600 bg-green-50 dark:bg-gray-800"
            }`}
          >
            {/* Floating Header Box */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">
              <div
                className={`px-2 py-1 text-[10px] font-semibold border rounded-md ${
                  selectedPlan === plan.id
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-green-500 text-white border-green-500"
                }`}
              >
                Icyumweru / Amezi
              </div>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col gap-2">
              {/* Title + Price + Features */}
              <div className="flex justify-between items-start gap-3">
                {/* Left side: title + price */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {plan.name}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {plan.currency}
                  </div>
                  <div className="text-green-600 dark:text-green-400 text-xl font-bold">
                    {plan.price}
                  </div>
                </div>

                {/* Right side: features */}
                <ul className="flex-1 space-y-0.5 min-w-0">
                  {plan.features.slice(0, 3).map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
                    >
                      {feature.included ? (
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <XIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{feature.name}</span>
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-gray-500 dark:text-gray-400 pl-4.5">
                      + {plan.features.length - 3} more
                    </li>
                  )}
                </ul>
              </div>

              {/* Button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlan(plan.id);
                  setCurrentStep("payment-method");
                }}
                className={`mt-1 w-full rounded-md py-1.5 text-sm font-semibold ${
                  selectedPlan === plan.id
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-sm"
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                <Check className="w-3 h-3 mr-1.5" />
                Komeza
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto mt-16 px-4">
        {subscriptionPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isPopular = plan.isPopular; // optional flag

          return (
            <Card
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`
                relative cursor-pointer rounded-3xl border transition-all duration-300 
                flex flex-col h-[470px]
                ${
                  isSelected
                    ? "border-green-500 shadow-green-200 shadow-xl scale-[1.02]"
                    : "border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1"
                }
                ${isPopular ? "ring-2 ring-green-400" : ""}
                bg-white
              `}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow">
                  Most Popular
                </div>
              )}

              <CardContent className="p-8 flex flex-col flex-1">
                {/* ===== HEADER ===== */}
                <div className="text-center mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>

                  <div className="flex items-end justify-center gap-2 mb-3">
                    <span className="text-5xl font-extrabold text-green-500 tracking-tight">
                      {plan.price.toLocaleString()}
                    </span>
                    <span className="text-lg font-semibold text-gray-700 mb-1">
                      RWF
                    </span>
                  </div>

                  <div className="text-sm font-medium text-gray-500 mb-3">
                    {plan.period}
                  </div>

                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto mb-0">
                    Ibi nibyo uzahabwa nugura iri fatabuguzi
                  </p>
                </div>

                {/* ===== FEATURES ===== */}
                <div className="border-t border-gray-100 my-2" />

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          feature.included
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {feature.included ? "✓" : "×"}
                      </div>

                      <span
                        className={`text-xs ${
                          feature.included
                            ? "text-gray-800 font-medium"
                            : "text-gray-400 line-through"
                        }`}
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* ===== CTA ===== */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                    setCurrentStep("payment-method");
                  }}
                  className={`
                    w-full h-12 rounded-xl text-base font-semibold transition-all
                    ${
                      isSelected
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }
                  `}
                >
                  Komeza
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="hidden justify-center">
          <Button
            onClick={() => setCurrentStep("payment-method")}
            className="bg-green-600 hover:bg-green-700 px-8 py-2 text-white"
          >
            Komeza Kwishyura
          </Button>
        </div>
      )}
    </div>
  );

  const renderPaymentMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Hitamo Uburyo Bwo Kwishyura
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Hitamo uburyo wishaka kwishyura
        </p>
      </div>

      {/* Mobile - Show button to open overlay */}
      <div className="sm:hidden">
        <Button
          onClick={() => setShowPaymentOverlay(true)}
          className="w-full bg-green-600 hover:bg-green-700 py-3 text-white"
        >
          Hitamo Uburyo Bwo Kwishyura
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>

        {selectedPaymentMethod && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              Wahisemo:{" "}
              {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name}
            </p>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8 px-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedPaymentMethod === method.id;

          return (
            <Card
              key={method.id}
              className={`
                relative rounded-2xl border transition-all duration-300 
                flex flex-col h-[170px] bg-white cursor-pointer
                ${
                  isSelected
                    ? "border-green-500 shadow-green-200 shadow-lg scale-[1.01]"
                    : "border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                }
              `}
              onClick={() => setSelectedPaymentMethod(method.id)}
            >
              <CardContent className="p-8 flex flex-col justify-between h-full">
                {/* ==== TOP CONTENT ==== */}
                <div className="flex items-center gap-3">
                  <img
                    src={method.image}
                    alt={method.name}
                    className="w-10 h-7 object-contain rounded flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                      {method.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {method.description}
                    </p>
                  </div>
                </div>

                {/* ==== KOMEZA BUTTON INSIDE CARD ==== */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent double trigger
                    setSelectedPaymentMethod(method.id);
                    setCurrentStep("duration"); // Automatically go to next step
                  }}
                  className={`
                    mt-2 h-9 w-full rounded-lg text-sm font-semibold transition-all
                    ${
                      isSelected
                        ? "bg-green-500 hover:bg-green-600 text-white shadow shadow-green-200"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }
                  `}
                >
                  Komeza
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderDurationSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Hitamo Igihe
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Hitamo igihe wishaka gukoresha ifatabuguzi
        </p>
      </div>

      {/* Mobile - Show button to open overlay */}
      <div className="sm:hidden">
        <Button
          onClick={() => setShowDurationOverlay(true)}
          className="w-full bg-green-600 hover:bg-green-700 py-3 text-white"
        >
          Hitamo Igihe
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>

        {selectedDuration && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              Wahiye:{" "}
              {
                [...durationPlans.weeks, ...durationPlans.months].find(
                  (d) => d.id === selectedDuration,
                )?.name
              }
            </p>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block space-y-8">
        {/* Weeks */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Ibyumweru
          </h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4">
            {durationPlans.weeks.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedDuration(plan.id)}
                className={`px-5 py-3 rounded-xl border-2 transition-colors flex justify-between items-center 
                  w-full sm:w-72
                  ${
                    selectedDuration === plan.id
                      ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-500 shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-500/5"
                  }`}
              >
                <span className="font-medium">{plan.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {plan.price.toLocaleString()} RWF
                  </span>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center 
                      ${
                        selectedDuration === plan.id
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700"
                      }`}
                  >
                    {selectedDuration === plan.id && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Months */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Amezi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {durationPlans.months.slice(0, 8).map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedDuration(plan.id)}
                className={`px-4 py-3 rounded-xl border-2 transition-colors flex justify-between items-center 
                  ${
                    selectedDuration === plan.id
                      ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-500 shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-500/5"
                  }`}
              >
                <span className="font-medium text-sm">{plan.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {plan.price.toLocaleString()} RWF
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center 
                      ${
                        selectedDuration === plan.id
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700"
                      }`}
                  >
                    {selectedDuration === plan.id && (
                      <Check
                        className="w-2.5 h-2.5 text-white"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep("payment-method")}
          className="px-6"
        >
          Subira Inyuma
        </Button>
        {selectedDuration && (
          <Button
            onClick={() => setCurrentStep("confirmation")}
            className="bg-green-600 hover:bg-green-700 px-6 text-white"
          >
            Komeza Kwemeza
          </Button>
        )}
      </div>
    </div>
  );

  // Main Confirmation component
  const renderConfirmation = () => {
    const selectedPlanData = subscriptionPlans.find(
      (p) => p.id === selectedPlan,
    );
    const selectedDurationData = [
      ...durationPlans.weeks,
      ...durationPlans.months,
    ].find((d) => d.id === selectedDuration);

    if (!selectedPlanData || !selectedDurationData) {
      return <div>Ikosa: Hitamo ifatabuguzi n'igihe mbere yo gukomeza</div>;
    }

    const baseAmount = selectedDurationData.price;
    const feeAmount = calculateWithdrawalFee(baseAmount);
    const totalAmount = calculateTotalWithFee(baseAmount);
    const isCardPayment = selectedPaymentMethod?.includes("visa");

    // Dates
    const startDate = new Date();
    let endDate = new Date(startDate);

    if (selectedDurationData.periodName.toLowerCase() === "week") {
      endDate.setDate(
        startDate.getDate() + selectedDurationData.periodNumber * 7,
      );
    } else if (selectedDurationData.periodName.toLowerCase() === "month") {
      endDate.setMonth(
        startDate.getMonth() + selectedDurationData.periodNumber,
      );
    }

    const formatDate = (date: Date) =>
      date.toLocaleDateString("rw-RW", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });

    return (
      <div className="space-y-10 max-w-5xl mx-auto px-4">
        {/* ===== HEADER ===== */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Emeza Ifatabuguzi
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base max-w-xl mx-auto">
            Reba ibyo wahisemo hanyuma ukomeze kwishyura
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ===== ORDER SUMMARY ===== */}
          <Card className="rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Incamake
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-500 dark:text-gray-400">
                    Ifatabuguzi:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedPlanData.name}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-500 dark:text-gray-400">
                    Igihe:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedDurationData.name}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-500 dark:text-gray-400">
                    Uburyo bwo kwishyura:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white text-right max-w-[60%]">
                    {
                      paymentMethods.find((m) => m.id === selectedPaymentMethod)
                        ?.name
                    }
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-500 dark:text-gray-400">
                    Itangiriro :
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(startDate)}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-500 dark:text-gray-400">
                    Iherezo :
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(endDate)}
                  </span>
                </div>

                {/* Price breakdown with fee */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-500 dark:text-gray-400">
                      Igiciro cy'ifatabuguzi:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {baseAmount.toLocaleString()} RWF
                    </span>
                  </div>

                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-500 dark:text-gray-400">
                      Ikiguzi (4%):
                    </span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-500">
                      + {feeAmount.toLocaleString()} RWF
                    </span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between text-lg sm:text-xl font-bold">
                      <span className="text-gray-900 dark:text-white">
                        Igiteranyo cyo kwishyura:
                      </span>
                      <span className="text-green-600 dark:text-green-500">
                        {totalAmount.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== PAYMENT SECTION ===== */}
          <Card className="rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-6 sm:p-8">
                       <div className="px-4 pb-2 text-center">
            <h3 className="text-gray-900 dark:text-white font-medium text-base">
              Kwemeza Kwishyura
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Kurikiza amabwiriza yose yuko bishyura
            </p>
          </div>

              {isPaymentCompleted ? (
                // Use the desktop payment status component
                renderDesktopPaymentStatus()
              ) : (
                <>
                  {/* Show loading when WebSocket is connected */}
                  {isWebSocketConnected && !isPaymentCompleted ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-6">
                      <div className="text-center">
                        <div className="mb-4">
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Shyiramo PIN wemeze muri telefone yanyu , mutabonye
                            ubutumwa kanda : *182*7*1#
                          </p>

                          <div className="flex justify-center items-center mt-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                        </div>

                        <div className="text-lg font-semibold text-white mb-2">
                          Kugenzura Ubwishyu...
                        </div>


                      </div>
                    </div>
                  ) : (
                    <>
                      {isCardPayment ? (
                        <div className="text-center py-6">
                          <FaCreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-500" />

                          {/* Fee notice */}
                          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                              <span className="font-semibold">
                                Icyitonderwa:
                              </span>{" "}
                              Iki kiguzi cya 4% kizakoreshwa kuri card yawe
                              n'umutunzi.
                            </p>
                          </div>

                          <Button
                            onClick={handleSubmitPayment}
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md"
                          >
                            {isLoading && (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            Ishura Ukoresheje Ikarita (
                            {totalAmount.toLocaleString()} RWF)
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {!isInOtpPhase ? (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Nimero ya Telefone
                                </label>
                                <input
                                  type="tel"
                                  value={phoneNumber}
                                  onChange={(e) =>
                                    setPhoneNumber(e.target.value)
                                  }
                                  placeholder="Shyiramo numero yawe ya telefone"
                                  className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                                />
                              </div>

                              {/* Fee notice */}
                              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                                  <span className="font-semibold">
                                    Icyitonderwa:
                                  </span>{" "}
                                  Iki kiguzi cya 4% kizakoreshwa mu gihe
                                  wishyura.
                                </p>
                              </div>

                              <Button
                                onClick={handleSubmitPayment}
                                disabled={!phoneNumber || isLoading}
                                className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md"
                              >
                                {isLoading && (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Ohereza Ubwishyu ({totalAmount.toLocaleString()}{" "}
                                RWF)
                              </Button>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Shyiramo OTP
                                </label>
                                <input
                                  type="text"
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                  placeholder="Shyiramo OTP wakiriye kuri telefone"
                                  className="w-full h-11 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white text-center text-lg"
                                />
                              </div>

                              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                                  Ubwishyu bukenewe:{" "}
                                  <span className="font-bold">
                                    {totalAmount.toLocaleString()} RWF
                                  </span>
                                </p>
                              </div>

                              <Button
                                onClick={handleSubmitPayment}
                                disabled={!otp || isLoading}
                                className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md"
                              >
                                {isLoading && (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                )}
                                Emeza Ubwishyu
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {(error || localPaymentError) && (
                        <div className="mt-5 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                          <p className="text-red-700 dark:text-red-300 text-sm">
                            {error || localPaymentError}
                          </p>
                        </div>
                      )}

                      {/* WebSocket connection status */}
                      {isWebSocketConnected && !isPaymentCompleted && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <div className="flex items-center justify-center gap-2">
                            {hasSubscribed ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                  {paymentStatusMessage ||
                                    "Kugenzura ubwishyu..."}
                                </span>
                              </>
                            ) : (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                                  Gutangira kugenzura ubwishyu...
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== BACK BUTTON ===== */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("duration")}
            className="h-11 px-10 rounded-xl font-semibold"
          >
            Subira Inyuma
          </Button>
        </div>
      </div>
    );
  };

  // Progress indicator
  const steps = [
    { id: "plans", name: "Hitamo Ifatabuguzi" },
    { id: "payment-method", name: "Uburyo Bwo Kwishyura" },
    { id: "duration", name: "Igihe" },
    { id: "confirmation", name: "Kwemeza" },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Top Navigation Bar - Fixed for Mobile */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sm:relative sm:bg-transparent sm:border-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-auto sm:py-8">
              <Button
                variant="ghost"
                onClick={() => setLocation("/konte")}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white -ml-2 sm:ml-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Subira Kuri Konte</span>
              </Button>

              {/* Mobile step indicator */}
              <div className="sm:hidden flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Inzira {steps.findIndex((s) => s.id === currentStep) + 1} ya{" "}
                  {steps.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Progress Steps - Hidden on mobile, shown on desktop */}
          <div className="hidden sm:block mb-8">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex flex-col items-center ${
                      steps.findIndex((s) => s.id === currentStep) >= index
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        steps.findIndex((s) => s.id === currentStep) >= index
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-xs mt-1">{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-2 ${
                        steps.findIndex((s) => s.id === currentStep) > index
                          ? "bg-green-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            {currentStep === "plans" && renderPlanSelection()}
            {currentStep === "payment-method" && renderPaymentMethod()}
            {currentStep === "duration" && renderDurationSelection()}
            {currentStep === "confirmation" && renderConfirmation()}
          </div>
        </div>

        {/* Mobile Overlays */}
        {showPaymentOverlay && renderMobilePaymentOverlay()}
        {showDurationOverlay && renderMobileDurationOverlay()}
        {showConfirmationOverlay && renderMobileConfirmationOverlay()}
      </div>
    </ProtectedRoute>
  );
}
