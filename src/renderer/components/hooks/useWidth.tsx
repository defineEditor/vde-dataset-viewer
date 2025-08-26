import { useState, useEffect, RefObject } from 'react';

const useWidth = <T extends HTMLElement>(ref: RefObject<T> | null) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const element = ref?.current;
        if (!element) return () => {};

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(element);

        // Set initial width
        setWidth(element.getBoundingClientRect().width);

        // Cleanup function for useEffect
        return () => resizeObserver.disconnect();
    }, [ref]);

    return width;
};

export default useWidth;
