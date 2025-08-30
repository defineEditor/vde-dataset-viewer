import React from 'react';
import { Tooltip, Button } from '@mui/material';
import { ITableRow } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    nameButton: {
        textTransform: 'none',
        minWidth: '1px',
    },
};

const VariableName: React.FC<{
    name: string;
    onShowInfo: (id: string) => void;
}> = ({ name, onShowInfo }) => {
    return (
        <Tooltip title="Show column info" enterDelay={1000}>
            <Button
                variant="text"
                onClick={() => onShowInfo(name)}
                id="info"
                sx={styles.nameButton}
            >
                {name}
            </Button>
        </Tooltip>
    );
};

const renderVariableName = (onShowInfo: (id: string) => void) => {
    const renderFunction = (info: CoreCell<ITableRow, unknown>) => {
        return (
            <VariableName
                name={info?.row?.original?.name as string}
                onShowInfo={onShowInfo}
            />
        );
    };
    return renderFunction;
};

export default renderVariableName;
