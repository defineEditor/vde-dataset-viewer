import React, { useEffect, useState, useRef } from 'react';
import { keyframes, styled } from '@mui/material/styles';
import Element from './Elements';

const frames = keyframes`
   0%, 100% {
    clip-path: polygon(100% 0, 100% 200%, 50% 50%, 0 200%, 0 0);
  }
  50% {
    clip-path: polygon(100% 0, 100% 100%, 50% 50%, 0 100%, 0 0);
  }
`;

const FollowerContainer = styled('div')({
    '&.follower-animation': {
        animation: `${frames} 0.3s ease-in-out infinite`,
    },
});

const FollowerEye = styled('div')({
    position: 'absolute',
    width: 15,
    height: 15,
    background: '#1a1a1a',
    boxShadow: 'inset 0 0 4px rgba(255, 255, 255, 0.5)',
    borderRadius: '50%',
    top: '40%',
    right: '20%',
});

const FollowerDiv = styled(FollowerContainer)(({ theme }) => ({
    position: 'fixed',
    width: 100,
    height: 100,
    background: 'radial-gradient(circle at 30% 30%, #ffeb3b, #ffc107, #ff9800)',
    boxShadow: '0 0 10px rgba(255, 152, 0, 0.3)',
    borderRadius: '50%',
    clipPath: 'polygon(100% 0, 100% 100%, 50% 50%, 0 100%, 0 0)',
    pointerEvents: 'none',
    zIndex: theme.zIndex.tooltip + 1,
}));

interface Props {
    mouseX: number;
    mouseY: number;
}

const Follower: React.FC<Props> = ({ mouseX, mouseY }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [elements, setElements] = useState<
        Array<{ id: number; x: number; y: number; createdAt: number }>
    >([]);
    const animationFrameRef = useRef<number | null>(null);
    const elementIdRef = useRef(0);

    // Clean up expired elements every second
    useEffect(() => {
        const cleanup = setInterval(() => {
            setElements((current) => {
                const now = Date.now();
                return current.filter(
                    (element) => now - element.createdAt < 5000,
                );
            });
        }, 1000);

        return () => clearInterval(cleanup);
    }, []);

    useEffect(() => {
        const animate = () => {
            setPosition((currentPos) => {
                const dx = mouseX - currentPos.x;
                const dy = mouseY - currentPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Create elements near Follower
                if (distance < 100 && Math.random() < 0.1) {
                    // 10% chance each frame
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 50;
                    const elementX = currentPos.x + radius * Math.cos(angle);
                    const elementY = currentPos.y + radius * Math.sin(angle);

                    setElements((current) => {
                        const newElement = {
                            id: elementIdRef.current++,
                            x: elementX,
                            y: elementY,
                            createdAt: Date.now(), // Add creation timestamp
                        };
                        return [...current, newElement].slice(-15); // Keep last 15 elements
                    });
                }

                return {
                    x: currentPos.x + dx * 0.01,
                    y: currentPos.y + dy * 0.01,
                };
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [mouseX, mouseY]);

    const angle =
        Math.atan2(mouseY - position.y, mouseX - position.x) * (180 / Math.PI);

    return (
        <>
            <FollowerDiv
                className="follower-animation"
                style={{
                    left: position.x - 30,
                    top: position.y - 30,
                    transform: `rotate(${angle - 90}deg)`,
                }}
            >
                <FollowerEye />
            </FollowerDiv>
            {elements.map((element) => (
                <Element key={element.id} x={element.x} y={element.y} />
            ))}
        </>
    );
};

export default Follower;
