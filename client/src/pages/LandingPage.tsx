import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import LandNav from "../components/LandNav"
import Hero from "../components/Hero"
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import WeofferImage from "../assets/WE OFFER.png";
import amasomoImage from "../assets/AMASOMO.png";
import { ArrowRight, Calendar, PlayCircle, Users, BookOpen, Facebook, Twitter, Instagram, Mail } from "lucide-react";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
};

const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
};

// Animated component wrapper
function AnimatedSection({ children, className = "" }) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={inView ? "animate" : "initial"}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [location, setLocation] = useLocation();
  const [isNewVisitor, setIsNewVisitor] = useState(true);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited');
    
    if (hasVisited === 'true') {
      setIsNewVisitor(false);
      // Redirect to ahabanza if not a new visitor
      setLocation('/ahabanza');
    } else {
      // Mark as visited for future visits
      localStorage.setItem('hasVisited', 'true');
      setIsNewVisitor(true);
    }
  }, [setLocation]);

  // Show loading or nothing while checking
  if (!isNewVisitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <LandNav />
      <Hero />

      {/* Section 1: How We Offer Lessons */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Image Side */}
          <motion.div 
            className="lg:w-1/2"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, threshold: 0.2 }}
            variants={fadeInLeft}
            transition={{ duration: 0.7 }}
          >
            <div className="relative group">
              {/* Background decoration */}
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/10 to-green-500/10 rounded-3xl transform rotate-2 group-hover:rotate-1 transition-transform duration-500" />
              
              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={amasomoImage}
                  alt="How we offer lessons"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating elements */}
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg transform -rotate-6">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold">Video Lessons</span>
                  </div>
                </div>
                
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg transform rotate-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold">Live Classes</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Side */}
          <motion.div 
            className="lg:w-1/2 space-y-6 lg:space-y-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, threshold: 0.2 }}
            variants={fadeInRight}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Quality Education
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              How We Offer 
              <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent"> Lessons</span>
            </h2>
            
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              We provide interactive, engaging, and personalized learning experiences through modern technology. 
              Our platform combines video lessons, live sessions, and practical exercises to ensure effective learning.
            </p>

            <motion.div 
              className="pt-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="gap-3 px-8 py-3 text-lg font-semibold rounded-2xl" 
                onClick={() => setLocation('/ahabanza')}
              >
                Start Now 
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: How We Plan For You */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28 bg-muted/30 rounded-3xl my-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Content Side */}
          <motion.div 
            className="lg:w-1/2 space-y-6 lg:space-y-8 order-2 lg:order-1"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, threshold: 0.2 }}
            variants={fadeInLeft}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-green-700 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Personalized Planning
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              We Plan 
              <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent"> For You</span>
            </h2>
            
            <p className="text-sm lg:text-lg text-muted-foreground leading-relaxed">
              Let us handle the planning while you focus on learning. We create customized study schedules, 
              track your progress, and adapt to your learning pace for optimal results.
            </p>

            <motion.div 
              className="pt-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="gap-3 px-8 py-3 text-lg font-semibold rounded-2xl" 
                onClick={() => setLocation('/ahabanza')}
              >
                Learn More About Planning
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Image Side */}
          <motion.div 
            className="lg:w-1/2 order-1 lg:order-2"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, threshold: 0.2 }}
            variants={fadeInRight}
            transition={{ duration: 0.7 }}
          >
            <div className="relative group">
              {/* Background decoration */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl transform -rotate-2 group-hover:-rotate-1 transition-transform duration-500" />
              
              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={WeofferImage}
                  alt="How we plan for you"
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating elements */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg transform rotate-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-semibold">Study Plan</span>
                  </div>
                </div>
                
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg transform -rotate-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-semibold">Progress</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <motion.div 
          className="bg-gradient-to-r from-green-600 to-green-500 rounded-3xl p-10 text-white shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Urashaka gutangira?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-95">
            Wiyandikishe nonaha utangire urugendo rwawe rwo kwiga
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="gap-3 bg-white text-green-600 hover:bg-gray-100 font-semibold text-base px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                onClick={() => setLocation('/login')}
              >
                Fungura Konti <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-3 text-white border-white hover:bg-white/10 font-semibold text-base px-8 py-3 rounded-xl backdrop-blur-sm transition-all duration-300" 
                onClick={() => setLocation('/login')}
              >
                Injira Muri Konti
              </Button>
            </motion.div>
          </div>
          
          {/* Additional decorative element */}
          <div className="mt-6 flex justify-center items-center gap-2 text-white/70">
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand & Social */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="font-bold text-lg">Kora</span>
              </Link>
              <p className="text-muted-foreground mb-4 text-sm">
                Pass your driving test with confidence. Interactive lessons and realistic mock exams.
              </p>
              <div className="flex gap-3">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Support */}
            <div className="md:col-span-1">
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                    Twandikire
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="md:col-span-1">
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>Kigali, Rwanda</li>
                <li>info@koraNawe.rw</li>
                <li>+250 788 895 345</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-center items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Kora. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}