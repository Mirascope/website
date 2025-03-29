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
      if (typeof window === 'undefined') return true;
      const savedPreference = localStorage.getItem('fontPreference');
      // If no preference is set, default to mono
      return savedPreference === null ? true : savedPreference === 'mono';
    });

    // Apply the font preference on initial load
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const savedPreference = localStorage.getItem('fontPreference');
        // If no preference is set, default to mono
        setMonoEnabled(savedPreference === null ? true : savedPreference === 'mono');
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
          <div className="max-w-5xl mx-auto w-full flex-grow">
            <Header monoEnabled={monoEnabled} toggleFont={toggleFont} />
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
