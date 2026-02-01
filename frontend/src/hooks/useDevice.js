import { useState, useEffect } from 'react';

export const useDevice = () => {
  const [device, setDevice] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDevice('mobile');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 1024) {
        setDevice('tablet');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setDevice('desktop');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { device, isMobile, isTablet, isDesktop };
};

export default useDevice;
