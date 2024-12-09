import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import LoadingSanta from 'renderer/components/Loading/LoadingSanta';
import LoadingCat from 'renderer/components/Loading/LoadingCat';
import LoadingDog from 'renderer/components/Loading/LoadingDog';

const getRandomLoadingComponent = () => {
    const now = new Date();
    const isHolidaySeason =
        now.getMonth() === 11 || (now.getMonth() === 0 && now.getDate() <= 7);
    const components = isHolidaySeason
        ? [LoadingCat, LoadingDog, LoadingSanta]
        : [LoadingCat, LoadingDog];
    const randomIndex = Math.floor(Math.random() * components.length);
    return components[randomIndex];
};

const Loading: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current) {
            const iframeDoc =
                iframeRef.current.contentDocument ||
                iframeRef.current.contentWindow?.document;
            if (iframeDoc) {
                iframeDoc.body.innerHTML = ''; // Clear existing content
                const root = iframeDoc.createElement('div');
                iframeDoc.body.style.margin = '0';
                iframeDoc.body.style.display = 'flex';
                iframeDoc.body.style.justifyContent = 'center';
                iframeDoc.body.style.alignItems = 'center';
                iframeDoc.body.style.height = '100vh';
                iframeDoc.body.style.overflow = 'hidden'; // Hide scrollbars
                iframeDoc.body.appendChild(root);
                const reactRoot = createRoot(root);
                const RandomLoadingComponent = getRandomLoadingComponent();
                reactRoot.render(<RandomLoadingComponent />);
            }
        }
    }, []);

    return (
        <iframe
            ref={iframeRef}
            title="loading-content"
            style={{ border: 'none', width: '300px', height: '300px' }}
        />
    );
};

export default Loading;
