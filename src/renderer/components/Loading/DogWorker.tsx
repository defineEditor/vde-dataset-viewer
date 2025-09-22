import React, { useState } from 'react';
import { Box, styled, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

const getPawColor = (speed: number) => {
    if (speed >= 1 / 3) {
        return '#FBF1F8';
    }

    const normalizedSpeed = 1 - speed * 3;

    // Start color: white (#FBF1F8)
    const white = { r: 251, g: 241, b: 248 };
    // End color: #f57059
    const target = { r: 245, g: 112, b: 89 }; // #f57059

    // Interpolate between white and target color
    const r = Math.round(white.r + (target.r - white.r) * normalizedSpeed);
    const g = Math.round(white.g + (target.g - white.g) * normalizedSpeed);
    const b = Math.round(white.b + (target.b - white.b) * normalizedSpeed);

    return `rgb(${r}, ${g}, ${b})`;
};

const styles = {
    icon: {
        color: 'grey.100',
        fontSize: 64,
    },
};

const RotatingGears = styled(Box)<{ speed: number }>(({ speed }) => ({
    position: 'absolute',
    top: 18,
    right: 50,
    animation: `rotate ${speed}s linear infinite`,
    '@keyframes rotate': {
        '0%': {
            transform:
                'perspective(600px) rotateX(145deg) rotateY(-15deg) rotateZ(0deg)',
        },
        '100%': {
            transform:
                'perspective(600px) rotateX(145deg) rotateY(-15deg) rotateZ(360deg)',
        },
    },
}));

const Dog = styled(Box)({
    scale: 0.6,
    height: '150px',
    width: '150px',
});

const Ears = styled(Box)({
    position: 'relative',
    left: 50,
    top: 28,
    display: 'flex',
    gap: 80,
    '&::before': {
        // Left ear
        content: '""',
        height: '50px',
        width: '40px',
        borderRadius: '50%',
        transform: 'rotate(-50deg)',
        background: '#475881',
        boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2)', // Add depth
    },
    '&::after': {
        // Right ear
        content: '""',
        height: '50px',
        width: '40px',
        borderRadius: '50%',
        transform: 'rotate(45deg)',
        background: '#475881',
        boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2)', // Add depth
    },
});

const Head = styled(Box)({
    height: 74,
    width: 135,
    position: 'relative',
    left: 65,
    zIndex: 2,
    boxShadow: '-8px 0 0 #475881',
    borderRadius: 37,
    background: '#7C85AB',
});

const Eyes = styled(Box)<{ speed?: number }>(({ speed = 1 }) => ({
    height: 12,
    width: 12,
    position: 'relative',
    top: 37,
    left: 60,
    borderRadius: '100%',
    animation: `dogRead ${speed}s infinite`,
    background: 'black',
    '&::before': {
        display: 'block',
        content: '""',
        height: 12,
        width: 12,
        position: 'relative',
        left: 28,
        borderRadius: '100%',
        background: 'black',
    },
    '@keyframes dogRead': {
        '0%': { transform: 'none' },
        '20%': { transform: 'translateX(-2px)' },
        '40%': { transform: 'translateX(3px)' },
        '60%': { transform: 'translateX(-2px)' },
        '80%': { transform: 'translateX(3px)' },
        '100%': { transform: 'none' },
    },
}));

const Nose = styled(Box)({
    height: 30,
    width: 48,
    position: 'relative',
    top: 40,
    left: 58,
    borderRadius: 20,
    background: '#FBF1D8',
    '&::before': {
        display: 'block',
        content: '""',
        height: 0,
        width: 0,
        position: 'relative',
        top: 3,
        left: 14,
        borderRadius: 15,
        borderTop: '12px solid black',
        borderLeft: '12px solid transparent',
        borderRight: '10px solid transparent',
    },
});

const Body = styled(Box)({
    height: 80,
    width: 200,
    position: 'relative',
    top: -20,
    zIndex: 1,
    borderRadius: 55,
    background: '#7C85AB',
});

const LeftPaw = styled(Box)<{ speed?: number }>(({ speed = 1 }) => ({
    height: 25,
    width: 37,
    position: 'relative',
    top: 50,
    left: 95,
    borderRadius: 12,
    animation: `dogLeftType ${speed}s infinite`,
    background: getPawColor(speed),
    '@keyframes dogLeftType': {
        '0%': { transform: 'none' },
        '25%': { transform: 'translateY(-8px)' },
        '50%': { transform: 'none' },
        '75%': { transform: 'translateY(-8px)' },
        '100%': { transform: 'none' },
    },
}));

const RightPaw = styled(Box)<{ speed?: number }>(({ speed = 1 }) => ({
    height: 25,
    width: 37,
    position: 'relative',
    top: 25,
    left: 142,
    borderRadius: 12,
    animation: `dogRightType ${speed}s infinite`,
    background: getPawColor(speed),
    '@keyframes dogRightType': {
        '0%': { transform: 'translateY(-8px)' },
        '25%': { transform: 'none' },
        '50%': { transform: 'translateY(-8px)' },
        '75%': { transform: 'none' },
        '100%': { transform: 'translateY(-8px)' },
    },
}));

const Tail = styled(Box)<{ speed: number }>(({ speed }) => ({
    height: 34,
    width: 70,
    position: 'relative',
    top: -68,
    left: -20,
    zIndex: 0,
    borderRadius: '17px 0 0 17px',
    background: '#475881',
    animation: `dogTail ${speed}s infinite`,
    '@keyframes dogTail': {
        '0%': { transform: 'translateY(-18px) rotate(25deg)' },
        '25%': { transform: 'none' },
        '50%': { transform: 'translateY(-18px) rotate(35deg)' },
        '75%': { transform: 'none' },
        '100%': { transform: 'translateY(-18px) rotate(25deg)' },
    },
}));

const Laptop = styled(Box)({
    position: 'relative',
    top: -151,
    left: 170,
    zIndex: 2,
});

const Screen = styled(Box)({
    height: 85,
    width: 130,
    borderRadius: 8,
    transform: 'skew(-18deg)',
    background: '#20314E',
});

const Keyboard = styled(Box)({
    height: 12,
    width: 132,
    position: 'relative',
    left: -14,
    borderRadius: '0 6px 6px 0',
    background: '#475881',
    '&::before': {
        display: 'block',
        content: '""',
        height: 12,
        width: 72,
        position: 'relative',
        left: -68,
        borderRadius: 6,
        background: '#20314E',
    },
});

const dogPhrases = ['Woof', 'Woooof', 'Woooooof!!!!', 'Woof'];

const DogWorker: React.FC = () => {
    const [speed, setSpeed] = useState(1);
    const [annoyedLevel, setAnnoyedLevel] = useState(0);
    const [itIsTalking, setIsTalking] = useState(false);

    const handleSpeedChange = () => {
        setSpeed((prevSpeed) => {
            if (prevSpeed * 0.8 > 0.2) {
                return Math.round(prevSpeed * 0.8 * 100) / 100;
            }
            setIsTalking(true);
            // Close the tooltip after some time
            setTimeout(() => {
                setIsTalking(false);
            }, 1000);
            setAnnoyedLevel((level) => level + 1);
            return Math.round(1 * (annoyedLevel / 2));
        });
    };

    let tailSpeed = Math.max(1 / speed, 0.7);
    if (tailSpeed > 1 && tailSpeed < 10) {
        // Anxiety grows fast
        tailSpeed **= 3;
    } else if (tailSpeed >= 10) {
        tailSpeed = 100;
    }

    return (
        <Dog onClick={() => handleSpeedChange()}>
            <Ears />
            <Head>
                <Eyes speed={speed} />
                <Tooltip
                    title={
                        <Box sx={{ userSelect: 'none' }}>
                            {annoyedLevel >= 100 && annoyedLevel < 110
                                ? 'Woof'
                                : dogPhrases[
                                      Math.min(
                                          annoyedLevel,
                                          dogPhrases.length,
                                      ) - 1
                                  ]}
                        </Box>
                    }
                    arrow
                    open={itIsTalking}
                    onClose={() => setIsTalking(false)}
                >
                    <Nose />
                </Tooltip>
            </Head>
            <Body>
                <LeftPaw speed={speed / 3} />
                <RightPaw speed={speed / 3} />
            </Body>
            <Tail speed={tailSpeed} />
            <Laptop>
                <Screen />
                <RotatingGears speed={speed * 2}>
                    <SettingsIcon sx={styles.icon} />
                </RotatingGears>

                <Keyboard />
            </Laptop>
        </Dog>
    );
};

export default DogWorker;
