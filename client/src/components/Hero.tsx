import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Users, Star } from "lucide-react";
import heroImage from "../assets/Watsinze.png";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Simplified floating shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-20 w-60 h-60 bg-blue-100 rounded-full opacity-30 animate-float-slow"></div>
        <div className="absolute bottom-20 right-32 w-40 h-40 bg-green-100 rounded-full opacity-40 animate-float-medium"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Text Content - Left Side */}
          <motion.div 
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 leading-tight">
              KoraNawe <span className="text-green-500">Rimwe Gusa</span> Utsinde 
            </h1>
            <p className="text-base md:text-lg text-black/80 mb-6 leading-relaxed">
              Pass your driving test with confidence. Interactive lessons, image-based quizzes, and realistic mock exams.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button size="lg" className="gap-2 w-full sm:w-auto text-sm md:text-base px-6 py-2 shadow-lg hover:shadow-xl transition-shadow">
                  Tangira Ubu <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/inyigisho">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto text-sm md:text-base px-6 py-2 bg-white/40 backdrop-blur-md border-white/30 text-black hover:bg-white/25">
                  Reba Amasomo
                </Button>
              </Link>
            </div>

            {/* Stats moved to bottom of text section on mobile */}
            <div className="flex gap-6 mt-6 lg:hidden justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-bold text-sm text-black">500+</div>
                  <div className="text-xs text-black/60">Drivers</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="font-bold text-sm text-black">98%</div>
                  <div className="text-xs text-black/60">Pass Rate</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hero Image - Right Side - Larger image */}
          <motion.div 
            className="w-full lg:w-1/2 hidden lg:flex justify-center lg:justify-end items-center"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="relative w-full max-w-lg">
              {/* Background decoration */}
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl transform rotate-2" />
              
              {/* Main image - Larger size */}
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={heroImage} 
                  alt="Rwanda Driving Education"
                  className="w-full h-80 object-cover"
                />
              </div>

              {/* Floating stats - Desktop only */}
              <motion.div 
                className="absolute -bottom-3 -left-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-md border border-white/20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-bold text-sm text-black">500+</div>
                    <div className="text-xs text-black/60">Drivers</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="absolute -top-3 -right-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-md border border-white/20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="font-bold text-sm text-black">98%</div>
                    <div className="text-xs text-black/60">Pass Rate</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}