import React from 'react';
import { styled } from '@mui/material/styles';
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
    },
    tabs: {
        width: '100%',
        background:
            'radial-gradient(circle farthest-corner at bottom center,#eeeeee,#e5e4e4)',
        textTransform: 'none',
    },
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

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: 'summary' | 'metadata' | 'data',
    ) => {
        dispatch(setCompareResultTab(newValue));
    };

    return (
        <Stack spacing={0} justifyContent="flex-start" sx={styles.root}>
            <TabContext value={currentTab || 'summary'}>
                <TabList
                    onChange={handleTabChange}
                    sx={styles.tabs}
                    variant="fullWidth"
                >
                    <StyledTab label="Summary" value="summary" />
                    <StyledTab label="Metadata" value="metadata" />
                    <StyledTab label="Data" value="data" />
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
