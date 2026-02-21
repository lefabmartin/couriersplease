import { useState } from "react";
import { ChevronDown, LogIn, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Navbar() {
  const [alertDismissed, setAlertDismissed] = useState(false);

  return (
    <div className="w-full flex flex-col font-sans">
      {/* Top Bar - Red #C21E36 */}
      <div className="bg-[#C21E36] text-white py-2 px-4 md:px-8 flex justify-end items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-[#a0192b] hover:text-white gap-1.5 h-8 px-3 text-sm font-medium"
          asChild
        >
          <a href="#">
            <LogIn className="h-4 w-4" />
            Login
          </a>
        </Button>
        <Button
          size="sm"
          className="bg-brand-orange hover:bg-brand-primary-hover text-white border-0 gap-1.5 h-8 px-4 text-sm font-medium"
          asChild
        >
          <a href="#">
            <Send className="h-4 w-4" />
            Send
          </a>
        </Button>
      </div>

      {/* Alert / Information Banner - White */}
      {!alertDismissed && (
        <div className="bg-white border-b border-gray-100 py-3 px-4 md:px-8 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-700 flex-1">
            Sendle has halted all parcel pick-ups. Find out more to consign directly with CouriersPlease,{" "}
            <a href="#" className="text-[#8b4512] underline hover:text-[#a0522d]">
              click here
            </a>
            . For all service updates please visit our{" "}
            <a href="#" className="text-[#8b4512] underline hover:text-[#a0522d]">
              news page
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => setAlertDismissed(true)}
            className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-700 shrink-0"
            aria-label="Close alert"
          >
            <X className="h-5 w-5" />
            <span className="text-xs">Close</span>
          </button>
        </div>
      )}

      {/* Main Navigation Bar - White */}
      <nav className="bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <span className="text-[#C21E36] font-bold text-xl md:text-2xl tracking-tight">
              CouriersPlease
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-6 md:gap-8 font-medium text-gray-800 text-[15px]">
            <a href="#" className="flex items-center gap-1 hover:text-[#C21E36] transition-colors">
              Sending <ChevronDown className="h-4 w-4" />
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-[#C21E36] transition-colors">
              Receiving <ChevronDown className="h-4 w-4" />
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-[#C21E36] transition-colors">
              Franchising <ChevronDown className="h-4 w-4" />
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-[#C21E36] transition-colors">
              About <ChevronDown className="h-4 w-4" />
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}
