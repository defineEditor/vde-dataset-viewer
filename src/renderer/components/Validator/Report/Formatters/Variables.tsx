import React from 'react';
import { Button, Stack } from '@mui/material';
import { ITableRow } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    container: {
        flexWrap: 'wrap',
    },
    button: {
        textTransform: 'none',
        minWidth: '1px',
    },
};

const Variables: React.FC<{
    variables: string[];
    row: string;
    dataset: string;
    onOpenFile: (id: string, row?: string, columns?: string) => void;
}> = ({ variables, row, dataset, onOpenFile }) => {
    if (!variables || variables.length === 0) {
        return null;
    }
    const isDatasetVariable = variables.map(
        (name) => name === name.toUpperCase() && !name.startsWith('$'),
    );
    return (
        <Stack spacing={0} sx={styles.container} direction="row">
            {variables.map((item, index) => {
                if (isDatasetVariable[index]) {
                    return (
                        <Button
                            variant="text"
                            onClick={() => onOpenFile(dataset, row, item)}
                            id="info"
                            sx={styles.button}
                        >
                            {item}
                        </Button>
                    );
                }
                return <span>{item}</span>;
            })}
        </Stack>
    );
};

const renderVariables = (onOpenFile: (id: string) => void) => {
    const renderFunction = (cell: CoreCell<ITableRow, unknown>) => {
        return (
            <Variables
                variables={cell.getValue() as string[]}
                row={cell.row?.original?.row as string}
                dataset={cell.row?.original?.dataset as string}
                onOpenFile={onOpenFile}
            />
        );
    };
    return renderFunction;
};

export default renderVariables;
