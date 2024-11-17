import { useAppSelector } from 'renderer/redux/hooks';
import Box from '@mui/material/Box';
import SelectDataset from 'renderer/components/SelectDataset';
import ViewFile from 'renderer/components/ViewFile';

const styles = {
    main: {
        height: '100%',
    },
};

const Main = () => {
    const currentView = useAppSelector((state) => state.ui.view);

    return (
        <Box sx={styles.main}>
            {currentView === 'select' && <SelectDataset />}
            {currentView === 'view' && <ViewFile />}
        </Box>
    );
};

export default Main;
