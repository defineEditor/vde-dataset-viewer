import React from 'react';
import { Alert } from '@mui/material';
import { ITableRow } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    alert: (theme) => ({
        textTransform: 'none',
        height: '100%',
        fontSize: theme.densitySettings.table.fontSize,
        padding: theme.densitySettings.table.cellPadding,
    }),
};

const RuleStatus: React.FC<{
    status: 'SKIPPED' | 'SUCCESS';
}> = ({ status }) => {
    return (
        <Alert
            severity={status === 'SUCCESS' ? 'success' : 'warning'}
            sx={styles.alert}
        >
            {status}
        </Alert>
    );
};

const renderRuleStatus = (cell: CoreCell<ITableRow, unknown>) => {
    return <RuleStatus status={cell?.getValue() as 'SKIPPED' | 'SUCCESS'} />;
};

export default renderRuleStatus;
