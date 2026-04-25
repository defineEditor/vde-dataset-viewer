import React from 'react';
import { styled, Theme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { setCompareResultTab } from 'renderer/redux/slices/ui';
import Metadata from 'renderer/components/Compare/Metadata';
import Data from 'renderer/components/Compare/Data';
import Summary from 'renderer/components/Compare/Summary';

const styles = {
    root: {
        display: 'flex',
        flex: '1 1 auto',
        px: 0,
        backgroundColor: 'grey.100',
        height: '100%',
        overflow: 'hidden',
        justifyContent: 'flex-start',
    },
    tabs: (theme: Theme) => ({
        width: '100%',
        background: theme.vars?.palette.gradients.tabStrip,
        textTransform: 'none',
    }),
    fullHeight: {
        height: '100%',
        width: '100%',
    },
    tabPanel: {
        height: '100%',
        p: 0,
    },
};

const StyledTab = styled(Tab)({
    textTransform: 'none',
});

const Results: React.FC = () => {
    const dispatch = useAppDispatch();
    const currentTab = useAppSelector((state) => state.ui.compare.resultTab);

    const currentCompareId = useAppSelector(
        (state) => state.ui.compare.currentCompareId,
    );

    const datasetDiff = useAppSelector(
        (state) => state.data.compare.data[currentCompareId]?.datasetDiff,
    );

    const noDataDiff =
        datasetDiff !== null &&
        datasetDiff.data.addedRows.length === 0 &&
        datasetDiff.data.deletedRows.length === 0 &&
        datasetDiff.data.modifiedRows.length === 0;

    const noMetadataDiff =
        datasetDiff !== null &&
        Object.keys(datasetDiff.metadata.attributeDiffs || {}).length === 0 &&
        Object.keys(datasetDiff.metadata.dsAttributeDiffs || {}).length === 0;

    const noDiff =
        datasetDiff !== null &&
        noDataDiff &&
        noMetadataDiff &&
        datasetDiff.metadata.missingInBase.length === 0 &&
        datasetDiff.metadata.missingInCompare.length === 0 &&
        Object.keys(datasetDiff.metadata.positionDiffs || {}).length === 0;

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: 'summary' | 'metadata' | 'data',
    ) => {
        dispatch(setCompareResultTab(newValue));
    };

    return (
        <Stack spacing={0} sx={styles.root}>
            <TabContext value={currentTab || 'summary'}>
                <TabList
                    onChange={handleTabChange}
                    sx={styles.tabs}
                    variant="fullWidth"
                >
                    <StyledTab
                        label="Summary"
                        value="summary"
                        sx={{
                            color: noDiff ? 'success.main' : undefined,
                        }}
                    />
                    <StyledTab
                        label="Metadata"
                        value="metadata"
                        sx={{
                            color: noMetadataDiff ? 'success.main' : undefined,
                        }}
                    />
                    <StyledTab
                        label="Data"
                        value="data"
                        sx={{
                            color: noDataDiff ? 'success.main' : undefined,
                        }}
                    />
                </TabList>
                <Box style={styles.fullHeight}>
                    <TabPanel value="summary" sx={styles.tabPanel}>
                        <Summary />
                    </TabPanel>
                    <TabPanel value="metadata" sx={styles.tabPanel}>
                        <Metadata />
                    </TabPanel>
                    <TabPanel value="data" sx={styles.tabPanel}>
                        <Data />
                    </TabPanel>
                </Box>
            </TabContext>
        </Stack>
    );
};

export default Results;
