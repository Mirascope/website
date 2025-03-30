import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useState, useEffect } from 'react'

import Header from '../components/Header'
import Footer from '../components/Footer'

export const Route = createRootRoute({
  component: () => {
    const router = useRouterState();
    const isLandingPage = router.location.pathname === '/';
    
    // Initialize font preference from localStorage
    const [monoEnabled, setMonoEnabled] = useState(() => {
      if (typeof window === 'undefined') return false;
      const savedPreference = localStorage.getItem('fontPreference');
      // If no preference is set, default to handwriting
      return savedPreference === null ? false : savedPreference === 'mono';
    });

    // Apply the font preference on initial load
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const savedPreference = localStorage.getItem('fontPreference');
        // If no preference is set, default to handwriting
        setMonoEnabled(savedPreference === null ? false : savedPreference === 'mono');
      }
    }, []);

    // Toggle font function to pass to Header
    const toggleFont = () => {
      const newValue = !monoEnabled;
      setMonoEnabled(newValue);
      
      // Save preference to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('fontPreference', newValue ? 'mono' : 'handwriting');
      }
    };
    
    return (
      <>
        <div 
          className={`flex flex-col min-h-screen ${isLandingPage ? 'bg-watercolor-flipped' : ''} ${monoEnabled ? 'mono-enabled' : 'handwriting-enabled'}`}
        >
          {/* Header is fixed, so it's outside the content flow */}
          <Header monoEnabled={monoEnabled} toggleFont={toggleFont} />
          
          {/* Content container with padding to account for fixed header */}
          <div className="pt-24 max-w-5xl mx-auto w-full flex-grow">
            <main className="flex-grow">
              <Outlet />
            </main>
          </div>
          <Footer />
        </div>
        <TanStackRouterDevtools />
      </>
    );
  },
})
