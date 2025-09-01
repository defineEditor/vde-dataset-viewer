import React from 'react';
import { Button } from '@mui/material';
import { ITableRow } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    button: {
        textTransform: 'none',
        minWidth: '1px',
    },
};

const Row: React.FC<{
    value: string;
    dataset: string;
    onOpenFile: (id: string, row?: string, columns?: string) => void;
}> = ({ value, dataset, onOpenFile }) => {
    return (
        <Button
            variant="text"
            onClick={() => onOpenFile(dataset, value)}
            id="info"
            sx={styles.button}
        >
            {value}
        </Button>
    );
};

const renderRow = (onOpenFile: (id: string) => void) => {
    const renderFunction = (cell: CoreCell<ITableRow, unknown>) => {
        return (
            <Row
                value={cell.getValue() as string}
                dataset={cell.row?.original?.dataset as string}
                onOpenFile={onOpenFile}
            />
        );
    };
    return renderFunction;
};

export default renderRow;
