import { useState, useCallback, useEffect, useRef } from 'react';

const useTableHeight = () => {
    const [tableHeight, setTableHeight] = useState(0);
    const viewContainerRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout>();

    const measureHeight = useCallback(() => {
        if (viewContainerRef.current) {
            const rect = viewContainerRef.current.getBoundingClientRect();
            setTableHeight(rect.height);
        }
    }, []);

    // When resize starts, reset height to 0 with debouncing
    useEffect(() => {
        const handleResizeWindow = () => {
            // Clear any existing timeout
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            // Set a timeout to reset height
            resizeTimeoutRef.current = setTimeout(() => {
                setTableHeight(0);
            }, 200);
        };

        window.addEventListener('resize', handleResizeWindow);

        return () => {
            window.removeEventListener('resize', handleResizeWindow);
            // Clean up timeout on unmount
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [measureHeight]);

    // When height becomes 0 measure the element
    useEffect(() => {
        if (tableHeight === 0 && viewContainerRef.current) {
            measureHeight();
        }
    }, [tableHeight, measureHeight]);

    // Initial measurement effect
    useEffect(() => {
        // Only measure initially if height is 0
        if (tableHeight === 0) {
            measureHeight();
        }
    }, [measureHeight]); // This will run once on mount
    return { tableHeight, viewContainerRef };
};

export default useTableHeight;
