import React, { useMemo } from 'react';
import { useAppSelector } from 'renderer/redux/hooks';
import { IUiModalFilter } from 'interfaces/common';
import FilterBody from 'renderer/components/Modal/Filter/FilterBody';
import convertToDataset from 'renderer/components/Validator/Report/convertToDataset';

const ReportFilter: React.FC<IUiModalFilter> = ({
    type,
    filterType,
}: IUiModalFilter) => {
    const reportTab = useAppSelector(
        (state) => state.ui.validationPage.currentReportTab,
    );

    const reportFilters = useAppSelector(
        (state) => state.data.validator.reportFilters,
    );

    const currentBasicFilter = useMemo(() => {
        if (reportTab && reportFilters[reportTab]) {
            return reportFilters[reportTab];
        }
        return null;
    }, [reportTab, reportFilters]);

    const currentReportId = useAppSelector(
        (state) => state.ui.validationPage.currentReportId,
    );

    const report = useAppSelector(
        (state) =>
            state.data.validator.reportData[currentReportId || ''] || null,
    );

    const table = convertToDataset(
        report,
        reportTab as 'details' | 'summary' | 'rules',
        undefined,
        null,
        true,
    );

    const dataset: { name: string; label: string } = {
        name: reportTab,
        label: reportTab,
    };

    return (
        <FilterBody
            type={type}
            filterType={filterType}
            currentBasicFilter={currentBasicFilter}
            data={table.data}
            metadata={table.metadata}
            dataset={dataset}
            loadedRecords={table.data.length}
            reportTab={reportTab as 'details' | 'summary' | 'rules'}
        />
    );
};

export default ReportFilter;
