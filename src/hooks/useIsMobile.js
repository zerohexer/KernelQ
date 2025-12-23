import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * Uses both screen width and user agent detection
 */
const useIsMobile = (breakpoint = 768) => {
    // Initialize with correct value immediately
    const getIsMobile = () => {
        if (typeof window === 'undefined') return false;
        const isSmallScreen = window.innerWidth <= breakpoint;
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
        return isSmallScreen || isMobileUserAgent;
    };

    const [isMobile, setIsMobile] = useState(getIsMobile);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(getIsMobile());
        };

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, [breakpoint]);

    return isMobile;
};

export default useIsMobile;
