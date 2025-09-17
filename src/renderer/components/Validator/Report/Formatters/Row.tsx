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
    value: number;
    dataset: string;
    onOpenFile: (
        event: React.MouseEvent<HTMLButtonElement>,
        id: string,
        row?: number,
        columns?: string,
    ) => void;
}> = ({ value, dataset, onOpenFile }) => {
    return (
        <Button
            variant="text"
            onClick={(event) => onOpenFile(event, dataset, value)}
            id="info"
            sx={styles.button}
        >
            {value}
        </Button>
    );
};

const renderRow = (
    onOpenFile: (
        event: React.MouseEvent<HTMLButtonElement>,
        id: string,
        row?: number,
        columns?: string,
    ) => void,
) => {
    const renderFunction = (cell: CoreCell<ITableRow, unknown>) => {
        return (
            <Row
                value={cell.getValue() as number}
                dataset={cell.row?.original?.dataset as string}
                onOpenFile={onOpenFile}
            />
        );
    };
    return renderFunction;
};

export default renderRow;
