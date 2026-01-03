import React, { useContext } from 'react';
import { useAppSelector } from 'renderer/redux/hooks';
import AppContext from 'renderer/utils/AppContext';
import { IUiModalFilter, ITableRow } from 'interfaces/common';
import FilterBody from 'renderer/components/Modal/Filter/FilterBody';

const CompareFilter: React.FC<IUiModalFilter> = ({
    type,
    filterType,
}: IUiModalFilter) => {
    const { apiService } = useContext(AppContext);

    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );

    const currentBasicFilter = useAppSelector(
        (state) =>
            state.data.filterData.currentFilter[currentCompareId] || null,
    );

    // Get files corresponding to currentCompareId
    const compareFileIds = apiService
        .getOpenedFiles()
        .filter((file) => file.compareId === currentCompareId)
        .map((file) => file.fileId);

    // Update unique values when filter is loaded or data is updated
    const loadedRecords1 = useAppSelector(
        (state) => state.data.loadedRecords[compareFileIds[0]],
    );
    const loadedRecords2 = useAppSelector(
        (state) => state.data.loadedRecords[compareFileIds[1]],
    );
    const loadedRecords = (loadedRecords1 || 0) + (loadedRecords2 || 0);

    if (compareFileIds.length === 0) {
        return null;
    }

    const data: ITableRow[] = [];
    compareFileIds.forEach((fileId) => {
        data.push(...apiService.getOpenedFileData(fileId));
    });

    const metadata = apiService.getOpenedFileMetadata(compareFileIds[0]);

    const openedFiles = apiService.getOpenedFiles();
    let dataset: { name: string; label: string };
    if (
        openedFiles.length > 0 &&
        openedFiles.some((file) => file.fileId === compareFileIds[0])
    ) {
        dataset = openedFiles.find(
            (file) => file.fileId === compareFileIds[0],
        ) as {
            name: string;
            label: string;
        };
    } else {
        dataset = {
            name: '',
            label: '',
        };
    }

    return (
        <FilterBody
            fileId={currentCompareId}
            type={type}
            filterType={filterType}
            currentBasicFilter={currentBasicFilter}
            data={data}
            metadata={metadata}
            dataset={dataset}
            loadedRecords={loadedRecords}
        />
    );
};

export default CompareFilter;
