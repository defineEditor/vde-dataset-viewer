import React from 'react';
import { Button, Stack, Box } from '@mui/material';
import { ITableRow } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    container: {
        flexWrap: 'wrap',
    },
    button: {
        textTransform: 'none',
        minWidth: '1px',
        p: 0.5,
    },
    text: {
        p: 0.5,
        lineHeight: '1.75',
    },
};

const Variables: React.FC<{
    variables: string[];
    row: number;
    dataset: string;
    onOpenFile: (
        event: React.MouseEvent<HTMLButtonElement>,
        id: string,
        row?: number,
        columns?: string,
    ) => void;
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
                            onClick={(event) =>
                                onOpenFile(event, dataset, row, item)
                            }
                            id="info"
                            sx={styles.button}
                        >
                            {item}
                        </Button>
                    );
                }
                return (
                    <Box sx={styles.text} key={item}>
                        {item}
                    </Box>
                );
            })}
        </Stack>
    );
};

const renderVariables = (
    onOpenFile: (
        event: React.MouseEvent<HTMLButtonElement>,
        id: string,
        row?: number,
        columns?: string,
    ) => void,
) => {
    const renderFunction = (cell: CoreCell<ITableRow, unknown>) => {
        return (
            <Variables
                variables={cell.getValue() as string[]}
                row={cell.row?.original?.row as number}
                dataset={cell.row?.original?.dataset as string}
                onOpenFile={onOpenFile}
            />
        );
    };
    return renderFunction;
};

export default renderVariables;
