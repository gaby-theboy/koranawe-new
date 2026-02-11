import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, User, Globe, LogOut, UserCircle, Settings } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LandNav() {
  const [location] = useLocation();
  const [isLoggedIn] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");

  const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "rw", name: "Kinyarwanda", native: "Kinyarwanda" },
  ];

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
  };

  return (
    <>
     {/* Desktop Navigation - Compact */}
<nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm hidden md:block">
  <div className="max-w-7xl mx-auto px-6 md:px-8">
    <div className="flex h-20 items-center justify-between">
      {/* Left side - Logo and Menu */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">
                K
              </span>
            </div>
            <span className="font-bold text-lg">KoraNawe</span>
          </Link>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Language Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Choose Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`cursor-pointer ${
                  currentLanguage === language.code ? "bg-accent" : ""
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{language.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {language.native}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Get Started Button with Green Gradient */}
        <Link href="/ahabanza">
          <Button 
            size="sm" 
            className="h-10 px-4 text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            Tangira Ubu
          </Button>
        </Link>
      </div>
    </div>
  </div>
</nav>

      {/* Mobile Top Bar - Compact */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm md:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xs">
                  K
                </span>
              </div>
              <span className="font-bold text-base">KoraNawe</span>
            </Link>

            <div className="flex items-center gap-1">
              {/* Get Started Button - Mobile */}
               {/* Language Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Choose Language</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {languages.map((language) => (
                    <DropdownMenuItem
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`cursor-pointer ${
                        currentLanguage === language.code ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{language.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {language.native}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/ahabanza">
                <Button 
                  size="sm" 
                  className="h-7 px-3 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                >
                  Tangira
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}