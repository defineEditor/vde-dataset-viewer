import React from 'react';
import { Alert } from '@mui/material';
import { ITableRow } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    alert: {
        textTransform: 'none',
        height: '100%',
    },
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
