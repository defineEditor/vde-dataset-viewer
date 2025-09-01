import React from 'react';
import { Alert, AlertProps } from '@mui/material';
import { ITableRow, IssueExecutability } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    alert: {
        textTransform: 'none',
        height: '100%',
    },
};

const Executability: React.FC<{
    value: IssueExecutability;
}> = ({ value }) => {
    if (!value) {
        return null;
    }
    let severity: AlertProps['severity'] = 'info';
    let label: string = '';
    if (value === 'fully executable') {
        severity = 'success';
        label = 'Fully';
    } else if (value === 'not executable') {
        severity = 'warning';
        label = 'Not';
    } else if (value === 'partially executable') {
        severity = 'info';
        label = 'Partially';
    } else if (value === 'partially executable - possible overreporting') {
        severity = 'info';
        label = 'Partially (Overreporting)';
    } else if (value === 'partially executable - possible underreporting') {
        severity = 'info';
        label = 'Partially (Underreporting)';
    }
    return (
        <Alert severity={severity} sx={styles.alert}>
            {label}
        </Alert>
    );
};

const renderExecutability = (cell: CoreCell<ITableRow, unknown>) => {
    return <Executability value={cell?.getValue() as IssueExecutability} />;
};

export default renderExecutability;
