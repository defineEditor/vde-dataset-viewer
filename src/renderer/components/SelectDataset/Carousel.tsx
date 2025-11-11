import React, { useState } from 'react';
import { Button, Stack } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
    },
    carousel: {
        display: 'flex',
        overflow: 'hidden',
        flexWrap: 'nowrap',
    },
    iconLeft: {
        marginLeft: 1,
    },
    slideButton: (theme) => ({
        userSelect: 'none',
        width: 40,
        minWidth: 40,
        height: 150,
        backgroundColor: 'grey.200',
        transition: 'background-color 0.3s',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Add shadow
        '&:hover': {
            backgroundColor: `${theme.palette.primary.main}10`,
        },
    }),
};

const Carousel: React.FC<{
    children: React.ReactNode;
    elementsToShow: number;
}> = ({ children, elementsToShow }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const childrenArray = React.Children.toArray(children);

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex < childrenArray.length - elementsToShow
                ? prevIndex + 1
                : prevIndex,
        );
    };

    return (
        <Stack
            spacing={2}
            direction="row"
            alignItems="flex-start"
            justifyContent="flex-start"
            sx={styles.container}
        >
            {childrenArray.length > elementsToShow && (
                <Button
                    sx={styles.slideButton}
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                >
                    <ArrowBackIosIcon sx={styles.iconLeft} />
                </Button>
            )}
            {childrenArray.length > elementsToShow
                ? childrenArray.slice(
                      currentIndex,
                      currentIndex + elementsToShow,
                  )
                : childrenArray}
            {childrenArray.length > elementsToShow && (
                <Button
                    sx={styles.slideButton}
                    onClick={handleNext}
                    disabled={
                        currentIndex >= childrenArray.length - elementsToShow
                    }
                >
                    <ArrowForwardIosIcon />
                </Button>
            )}
        </Stack>
    );
};

export default Carousel;
