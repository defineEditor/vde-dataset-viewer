import React from 'react';
import { Button } from '@mui/material';
import { BasicFilter, ITableRow, IUiValidationPage } from 'interfaces/common';
import { CoreCell } from '@tanstack/react-table';

const styles = {
    button: {
        textTransform: 'none',
        minWidth: '1px',
    },
};

const SummaryIssues: React.FC<{
    value: string;
    filter: BasicFilter;
    onFilterIssues: (
        filter: BasicFilter,
        reportTab: IUiValidationPage['currentReportTab'],
    ) => void;
}> = ({ value, filter, onFilterIssues }) => {
    return (
        <Button
            variant="text"
            onClick={() => onFilterIssues(filter, 'details')}
            id="info"
            sx={styles.button}
        >
            {value}
        </Button>
    );
};

const renderSummaryIssues = (
    onFilterIssues: (
        filter: BasicFilter,
        reportTab: IUiValidationPage['currentReportTab'],
    ) => void,
) => {
    const renderFunction = (cell: CoreCell<ITableRow, unknown>) => {
        const filter: BasicFilter = {
            conditions: [
                {
                    variable: 'dataset',
                    operator: 'eq',
                    value: cell.row?.original?.dataset as string,
                },
                {
                    variable: 'core_id',
                    operator: 'eq',
                    value: cell.row?.original?.core_id as string,
                },
            ],
            connectors: ['and'],
        };
        return (
            <SummaryIssues
                value={cell.getValue() as string}
                filter={filter}
                onFilterIssues={onFilterIssues}
            />
        );
    };
    return renderFunction;
};

export default renderSummaryIssues;
