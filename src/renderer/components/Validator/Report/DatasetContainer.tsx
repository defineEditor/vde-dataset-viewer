import React from 'react';
import DatasetView from 'renderer/components/DatasetView';
import { ITableData } from 'interfaces/common';
import { useAppSelector } from 'renderer/redux/hooks';

const DatasetContainer: React.FC<{ data?: ITableData }> = ({ data = null }) => {
    const settings = useAppSelector((state) => state.settings.viewer);
    const updatedSettings = {
        ...settings,
        showTypeIcons: false,
        dynamicRowHeight: true,
        useFlex: true,
        hideRowNumbers: true,
        showLabel: true,
    };

    if (!data) {
        return null;
    }

    return (
        <DatasetView
            key="issue-summary"
            tableData={data}
            isLoading={false}
            settings={updatedSettings}
            handleContextMenu={() => {}}
            currentPage={1}
            currentMask={null}
        />
    );
};

export default DatasetContainer;
