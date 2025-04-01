import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export default function Footer() {
  const router = useRouterState();
  const isLandingPage = router.location.pathname === '/';
  
  return (
    <footer className={cn(
      "w-full py-6 px-4 sm:px-6 md:px-12 mt-auto",
      isLandingPage ? "bg-transparent" : "bg-background"
    )}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-center">
        <div className={cn(
          "text-sm sm:text-base mb-4 md:mb-0 text-center md:text-left",
          isLandingPage ? "text-white" : "text-slate-800 dark:text-white"
        )}>
          <p>© 2025 Mirascope. All rights reserved.</p>
        </div>
        
        <div className="flex gap-4 sm:gap-8">
          <Link 
            to="/privacy" 
            className={cn(
              "text-sm sm:text-base transition-colors",
              isLandingPage ? "text-white hover:text-gray-300" : "text-slate-800 dark:text-white hover:text-primary dark:hover:text-primary-foreground"
            )}
          >
            Privacy Policy
          </Link>
          <Link 
            to="/terms" 
            className={cn(
              "text-sm sm:text-base transition-colors",
              isLandingPage ? "text-white hover:text-gray-300" : "text-slate-800 dark:text-white hover:text-primary dark:hover:text-primary-foreground"
            )}
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}