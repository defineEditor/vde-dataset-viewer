import React, { useContext } from 'react';
import { useAppSelector } from 'renderer/redux/hooks';
import AppContext from 'renderer/utils/AppContext';
import { IUiModalFilter } from 'interfaces/common';
import FilterBody from 'renderer/components/Modal/Filter/FilterBody';

const DatasetFilter: React.FC<IUiModalFilter> = ({
    type,
    filterType,
    data,
}: IUiModalFilter) => {
    const { apiService } = useContext(AppContext);

    const currentFileId = useAppSelector((state) => state.ui.currentFileId);

    const stateBasicFilter = useAppSelector(
        (state) => state.data.filterData.currentFilter[currentFileId] || null,
    );

    const defaultFilter = data?.defaultFilter;

    const currentBasicFilter = defaultFilter || stateBasicFilter || null;

    const metadata = apiService.getOpenedFileMetadata(currentFileId);

    const openedFiles = apiService.getOpenedFiles();
    let dataset: { name: string; label: string };
    if (
        openedFiles.length > 0 &&
        openedFiles.some((file) => file.fileId === currentFileId)
    ) {
        dataset = openedFiles.find((file) => file.fileId === currentFileId) as {
            name: string;
            label: string;
        };
    } else {
        dataset = {
            name: '',
            label: '',
        };
    }

    // Update unique values when filter is loaded or data is updated
    const loadedRecords = useAppSelector(
        (state) => state.data.loadedRecords[currentFileId],
    );

    return (
        <FilterBody
            fileId={currentFileId}
            type={type}
            filterType={filterType}
            currentBasicFilter={currentBasicFilter}
            metadata={metadata}
            dataset={dataset}
            loadedRecords={loadedRecords}
        />
    );
};

export default DatasetFilter;
