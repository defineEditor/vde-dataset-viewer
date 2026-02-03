import React from 'react';
import { IUiModalFilter } from 'interfaces/common';
import DatasetFilter from 'renderer/components/Modal/Filter/DatasetFilter';
import CompareFilter from 'renderer/components/Modal/Filter/CompareFilter';
import ReportFilter from 'renderer/components/Modal/Filter/ReportFilter';

const FilterComponent: React.FC<IUiModalFilter> = (props: IUiModalFilter) => {
    const { filterType } = props;

    if (filterType === 'dataset') {
        return <DatasetFilter {...props} />;
    }
    if (filterType === 'compare') {
        return <CompareFilter {...props} />;
    }
    if (filterType === 'report') {
        return <ReportFilter {...props} />;
    }
    return null;
};

export default FilterComponent;
