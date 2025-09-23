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

const Cat = styled(Box)({
    scale: 0.6,
    height: '150px',
    width: '150px',
});

const Ears = styled(Box)({
    height: 0,
    width: 0,
    position: 'relative',
    left: 90,
    borderBottom: '27px solid #F07E42',
    borderLeft: '10px solid transparent',
    borderRight: '23px solid transparent',
    '&::before': {
        display: 'block',
        content: '""',
        height: 0,
        width: 0,
        position: 'relative',
        left: 24,
        borderBottom: '27px solid #F07E42',
        borderLeft: '10px solid transparent',
        borderRight: '23px solid transparent',
    },
});

const Head = styled(Box)({
    height: 74,
    width: 135,
    position: 'relative',
    left: 65,
    zIndex: 2,
    boxShadow: '-8px 0 0 #F07E42',
    borderRadius: 37,
    background: '#FFA852',
});

const Eyes = styled(Box)<{ speed?: number }>(({ speed = 1 }) => ({
    height: 12,
    width: 12,
    position: 'relative',
    top: 37,
    left: 64,
    borderRadius: '100%',
    animation: `catRead ${speed}s infinite`,
    background: 'black',
    '&::before': {
        display: 'block',
        content: '""',
        height: 12,
        width: 12,
        position: 'relative',
        left: 18,
        borderRadius: '100%',
        background: 'black',
    },
    '@keyframes catRead': {
        '0%': { transform: 'none' },
        '20%': { transform: 'translateX(-2px)' },
        '40%': { transform: 'translateX(3px)' },
        '60%': { transform: 'translateX(-2px)' },
        '80%': { transform: 'translateX(3px)' },
        '100%': { transform: 'none' },
    },
}));

const Nose = styled(Box)({
    height: 22,
    width: 22,
    position: 'relative',
    top: 40,
    left: 60,
    borderRadius: 20,
    background: '#FBF1D8',
    '&::before': {
        display: 'block',
        content: '""',
        height: 22,
        width: 22,
        position: 'relative',
        left: 22,
        borderRadius: 20,
        background: '#FBF1D8',
    },
    '&::after': {
        display: 'block',
        content: '""',
        height: 0,
        width: 0,
        position: 'relative',
        top: -22,
        left: 12,
        borderRadius: 10,
        borderTop: '10px solid #FFA5C0',
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
    },
});

const Body = styled(Box)({
    height: 110,
    width: 200,
    position: 'relative',
    top: -30,
    zIndex: 1,
    borderRadius: 55,
    background: '#FFA852',
});

const LeftPaw = styled(Box)<{ speed?: number }>(({ speed = 1 }) => ({
    height: 25,
    width: 37,
    position: 'relative',
    top: 70,
    left: 95,
    borderRadius: 12,
    animation: `catLeftType ${speed}s infinite`,
    background: getPawColor(speed),
    '@keyframes catLeftType': {
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
    top: 45,
    left: 142,
    borderRadius: 12,
    animation: `catRightType ${speed}s infinite`,
    background: getPawColor(speed),
    '@keyframes catRightType': {
        '0%': { transform: 'translateY(-8px)' },
        '25%': { transform: 'none' },
        '50%': { transform: 'translateY(-8px)' },
        '75%': { transform: 'none' },
        '100%': { transform: 'translateY(-8px)' },
    },
}));

const Tail = styled(Box)({
    height: 24,
    width: 80,
    position: 'relative',
    top: -54,
    left: -31,
    zIndex: 0,
    borderRadius: '17px 0 0 17px',
    background: '#F07E42',
});

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
    background: '#FFCA95',
});

const Keyboard = styled(Box)({
    height: 12,
    width: 132,
    position: 'relative',
    left: -14,
    borderRadius: '0 6px 6px 0',
    background: '#F07E42',
    '&::before': {
        display: 'block',
        content: '""',
        height: 12,
        width: 72,
        position: 'relative',
        left: -68,
        borderRadius: 6,
        background: '#FFCA95',
    },
});

const catPhrases = ['Meow', 'Meeoow', 'Meeeeeeeow!!!!', 'Meow'];

const CatWorker: React.FC = () => {
    const [speed, setSpeed] = useState(1);
    const [annoyedLevel, setAnnoyedLevel] = useState(0);
    const [itIsTalking, setIsTalking] = useState(false);

    const handleSpeedChange = () => {
        setSpeed((prevSpeed) => {
            if (prevSpeed * 0.8 > 0.2 && annoyedLevel < catPhrases.length - 1) {
                return Math.round(prevSpeed * 0.8 * 100) / 100;
            }
            if (
                annoyedLevel < catPhrases.length - 1 ||
                annoyedLevel % 10 === 0
            ) {
                setIsTalking(true);
                // Close the tooltip after some time
                setTimeout(() => {
                    setIsTalking(false);
                }, 1000);
            }
            setAnnoyedLevel((level) => level + 1);
            return 2 * (annoyedLevel + 1);
        });
    };
    return (
        <Cat onClick={() => handleSpeedChange()}>
            <Ears />
            <Head>
                <Eyes speed={speed} />
                <Tooltip
                    title={
                        <Box sx={{ userSelect: 'none' }}>
                            {annoyedLevel >= 100 && annoyedLevel < 110
                                ? 'Woof'
                                : catPhrases[
                                      Math.min(
                                          annoyedLevel,
                                          catPhrases.length,
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
            <Tail />
            <Laptop>
                <Screen />
                <RotatingGears speed={speed * 2}>
                    <SettingsIcon sx={styles.icon} />
                </RotatingGears>

                <Keyboard />
            </Laptop>
        </Cat>
    );
};

export default CatWorker;
