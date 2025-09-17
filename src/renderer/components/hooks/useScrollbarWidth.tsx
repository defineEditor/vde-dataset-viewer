import { useState, useEffect } from 'react';

const useScrollbarWidth = () => {
    const [scrollbarWidth, setScrollbarWidth] = useState(0);

    const measureScrollbarWidth = (): number => {
        // Create temporary elements to measure scrollbar
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        document.body.appendChild(outer);

        const inner = document.createElement('div');
        outer.appendChild(inner);

        const width = outer.offsetWidth - inner.offsetWidth;
        document.body.removeChild(outer);

        return width;
    };

    useEffect(() => {
        setScrollbarWidth(measureScrollbarWidth());
    }, []);

    return scrollbarWidth;
};

export default useScrollbarWidth;
