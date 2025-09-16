import React, { useRef } from 'react';
import { Box } from '@mui/material';
import DatasetView from 'renderer/components/DatasetView';
import { ITableData } from 'interfaces/common';
import { useAppSelector } from 'renderer/redux/hooks';
import columnDefs from 'renderer/components/Validator/Report/columnDefs';
import calculateColumnWidth from 'renderer/utils/calculateColumnWidth';
import useWidth from 'renderer/components/hooks/useWidth';
import useScrollbarWidth from 'renderer/components/hooks/useScrollbarWidth';

const styles = {
    container: {
        width: '100%',
    },
};

const DatasetContainer: React.FC<{
    data?: ITableData;
    type: 'summary' | 'details' | 'rules';
}> = ({ data = undefined, type }) => {
    const settings = useAppSelector((state) => state.settings.viewer);
    const updatedSettings = {
        ...settings,
        showTypeIcons: false,
        dynamicRowHeight: true,
        hideRowNumbers: false,
        showLabel: true,
    };

    // Measure width of the table
    const tabContainerRef = useRef<HTMLDivElement>(null);
    const width = useWidth(tabContainerRef);
    const scrollbarWidth = useScrollbarWidth();

    if (!data) {
        return null;
    }

    // Get columns metadata
    const columnWidths = calculateColumnWidth(
        columnDefs[type],
        'expand',
        width - scrollbarWidth,
        50,
        1000,
        false,
        data,
    );

    // Update header with calculated widths
    const updatedHeader = data.header.map((col) => ({
        ...col,
        size: columnWidths[col.id],
    }));

    const updatedData = {
        ...data,
        header: updatedHeader,
    };

    return (
        <Box ref={tabContainerRef} sx={styles.container}>
            {width > 0 && (
                <DatasetView
                    key="report"
                    tableData={updatedData}
                    isLoading={false}
                    settings={updatedSettings}
                    handleContextMenu={() => {}}
                    currentPage={1}
                    currentMask={null}
                />
            )}
        </Box>
    );
};

export default DatasetContainer;
