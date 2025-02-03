/* eslint-disable no-nested-ternary */
import React, { useEffect, useState, useRef } from 'react';
import { styled } from '@mui/material/styles';

const ELEMENT_COLORS = [
    '#ff0000', // red
    '#ff8c00', // orange
    '#ffff00', // yellow
    '#00ff00', // green
    '#00ffff', // cyan
    '#0000ff', // blue
    '#ff00ff', // magenta
];

const DATASET_TERMS = [
    // Existing terms
    'records',
    'columns',
    'string',
    'integer',
    'label',
    'name',
    'itemOID',
    'length',
    'decimal',
    'boolean',
    // From ItemDescription interface
    'dataType',
    'displayFormat',
    'keySequence',
    // From Dataset interface
    'rows',
    'fileOID',
    'originator',
    'studyOID',
    'metaDataRef',
    'itemGroupOID',
    // Additional ItemType values
    'float',
    'double',
    'date',
    'time',
    'datetime',
    'URI',
];

const ElementDiv = styled('div')({
    position: 'fixed',
    fontSize: '16px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    pointerEvents: 'none',
    transition: 'opacity 0.5s ease-out',
    textShadow: '0 0 5px currentColor',
});

interface Props {
    x: number;
    y: number;
}

const Element: React.FC<Props> = ({ x, y }) => {
    const [position, setPosition] = useState({ x, y });
    const [opacity, setOpacity] = useState(1);
    const color = useRef(
        ELEMENT_COLORS[Math.floor(Math.random() * ELEMENT_COLORS.length)],
    );
    const velocityRef = useRef({
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
    });
    const elementValue = useRef(
        DATASET_TERMS[Math.floor(Math.random() * DATASET_TERMS.length)],
    );
    const frameRef = useRef<number>();

    useEffect(() => {
        // Start fade out after 4.5 seconds
        const fadeTimeout = setTimeout(() => {
            setOpacity(0);
        }, 4500);

        // Cleanup after 7 seconds
        const cleanupTimeout = setTimeout(() => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        }, 7000);

        const animate = () => {
            setPosition((pos) => {
                const newX = pos.x + velocityRef.current.x;
                const newY = pos.y + velocityRef.current.y;

                // Bounce off screen edges
                if (newX < 0 || newX > window.innerWidth) {
                    velocityRef.current.x *= -1;
                }
                if (newY < 0 || newY > window.innerHeight) {
                    velocityRef.current.y *= -1;
                }

                return {
                    x:
                        newX < 0
                            ? 0
                            : newX > window.innerWidth
                              ? window.innerWidth
                              : newX,
                    y:
                        newY < 0
                            ? 0
                            : newY > window.innerHeight
                              ? window.innerHeight
                              : newY,
                };
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            clearTimeout(fadeTimeout);
            clearTimeout(cleanupTimeout);
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    return (
        <ElementDiv
            style={{
                left: position.x,
                top: position.y,
                opacity,
                color: color.current,
            }}
        >
            {elementValue.current}
        </ElementDiv>
    );
};

export default Element;
