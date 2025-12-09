import React, { useEffect, useRef } from 'react';

// Declare Vanta as a global (loaded via CDN)
declare global {
    interface Window {
        VANTA: any;
    }
}

interface VantaBackgroundProps {
    active?: boolean;
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ active = true }) => {
    const vantaRef = useRef<any>(null);

    useEffect(() => {
        if (!active) {
            // Destroy Vanta effect when not active
            if (vantaRef.current) {
                vantaRef.current.destroy();
                vantaRef.current = null;
            }
            return;
        }

        // Initialize Vanta effect
        const initVanta = () => {
            if (window.VANTA && !vantaRef.current) {
                vantaRef.current = window.VANTA.NET({
                    el: '#vanta-bg',
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    scaleMobile: 1.00,
                    color: 0x1968b1,
                    backgroundColor: 0x020018,
                    maxDistance: 28.00,
                    spacing: 20.00
                });
            }
        };

        // Small delay to ensure DOM is ready and scripts are loaded
        const timer = setTimeout(initVanta, 100);

        return () => {
            clearTimeout(timer);
            if (vantaRef.current) {
                vantaRef.current.destroy();
                vantaRef.current = null;
            }
        };
    }, [active]);

    return null; // Vanta attaches to #vanta-bg which is in index.html
};

export default VantaBackground;
