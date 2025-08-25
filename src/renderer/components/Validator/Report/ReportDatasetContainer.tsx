import React from 'react';
import DatasetView from 'renderer/components/DatasetView';
import { ITableData } from 'interfaces/common';
import { useAppSelector } from 'renderer/redux/hooks';

const DatasetContainer: React.FC<{
    data?: ITableData;
    dimentions: { height: number; width: number };
}> = ({ data = null, dimentions }) => {
    const settings = useAppSelector((state) => state.settings.viewer);
    const updatedSettings = {
        ...settings,
        showTypeIcons: false,
        dynamicRowHeight: true,
        hideRowNumbers: true,
        showLabel: true,
        baseHeight: `${dimentions.height}px`,
    };

    if (!data) {
        return null;
    }

    return (
        <DatasetView
            key="report"
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
