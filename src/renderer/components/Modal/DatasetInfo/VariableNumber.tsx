import React from 'react';
import { Tooltip, Button } from '@mui/material';
import { ITableRow } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    numberButton: {
        minWidth: '1px',
    },
};

const VariableNumber: React.FC<{
    number: number;
    name: string;
    onGoToClick: (column: string) => void;
}> = ({ number, name, onGoToClick }) => {
    return (
        <Tooltip title="Go to column" enterDelay={1000}>
            <Button
                variant="text"
                onClick={() => onGoToClick(name)}
                id="goto"
                sx={styles.numberButton}
            >
                {number}
            </Button>
        </Tooltip>
    );
};

const renderVariableNumber = (onGoToClick: (column: string) => void) => {
    const renderFunction = (info: CoreCell<ITableRow, unknown>) => {
        return (
            <VariableNumber
                number={info?.row?.original?.['#'] as number}
                name={info?.row?.original?.name as string}
                onGoToClick={onGoToClick}
            />
        );
    };
    return renderFunction;
};

export default renderVariableNumber;
