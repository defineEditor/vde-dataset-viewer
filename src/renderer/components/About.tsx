import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import UpdateIcon from '@mui/icons-material/Update';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { openModal, openSnackbar } from 'renderer/redux/slices/ui';
import AppContext from 'renderer/utils/AppContext';
import { modals } from 'misc/constants';

const styles = {
    root: {
        width: '100%',
        height: '100%',
        backgroundColor: 'background.paper',
        justifyContent: 'center',
    },
    main: {
        mt: 4,
    },
    description: {
        color: 'grey.700',
    },
    features: {
        width: '95%',
        justifyContent: 'center',
    },
    card: {
        width: '320px',
        display: 'flex',
        verticalAlign: 'top',
        backgroundColor: 'grey.100',
    },
    cardContent: {
        flex: '1 1 auto',
    },
};

const openLink = (event) => {
    event.preventDefault();
    window.open(event.target.href, '_blank');
};

const About: React.FC = () => {
    const dispatch = useDispatch();
    const { apiService } = React.useContext(AppContext);

    const [checkingForUpdate, setCheckingForUpdate] = useState(false);

    const checkForUpdates = (_event) => {
        setCheckingForUpdate(true);
        const checkUpdates = async () => {
            const result = await apiService.checkUpdates();
            if (result.newUpdated) {
                dispatch(openModal({ type: modals.APPUPDATE, data: result }));
            } else {
                dispatch(
                    openSnackbar({
                        type: 'info',
                        message: 'You are using the latest version',
                    }),
                );
            }
            setCheckingForUpdate(false);
        };
        checkUpdates();
    };

    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        const getAppVersion = async () => {
            const version = await apiService.getAppVersion();
            setAppVersion(version);
        };

        getAppVersion();
    }, [apiService]);

    return (
        <Stack sx={styles.root} spacing={10}>
            <Box sx={styles.main}>
                <Typography
                    variant="h5"
                    align="center"
                    color="primary"
                    gutterBottom
                >
                    VDE Dataset Viewer {appVersion}
                </Typography>
                <Typography
                    variant="body1"
                    align="center"
                    color="primary"
                    gutterBottom
                >
                    Check for updates
                    <Tooltip
                        title="Check for Updates"
                        placement="bottom"
                        enterDelay={500}
                    >
                        {checkingForUpdate ? (
                            <CircularProgress size={28} />
                        ) : (
                            <IconButton onClick={checkForUpdates}>
                                <UpdateIcon />
                            </IconButton>
                        )}
                    </Tooltip>
                </Typography>
                <Typography variant="h6" align="center" sx={styles.description}>
                    VDE Dataset Viewer is an open-source application designed to
                    help users review datasets.
                </Typography>
            </Box>
            <Stack spacing={5} direction="row" sx={styles.features}>
                <Card sx={styles.card}>
                    <Box sx={styles.cardContent}>
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                Contacts
                            </Typography>
                            <Typography variant="body1">
                                <a
                                    onClick={openLink}
                                    href="https://t.me/defineeditor"
                                >
                                    Telegram
                                </a>
                                <br />
                                <a
                                    onClick={openLink}
                                    href="https://chat.whatsapp.com/HpBqZZboqCJ2fp7gOpxRZR"
                                >
                                    WhatsApp
                                </a>
                                <br />
                                <a
                                    onClick={openLink}
                                    href="http://defineeditor.com"
                                >
                                    Website
                                </a>
                                <br />
                                <a
                                    onClick={openLink}
                                    href="https://twitter.com/defineeditor"
                                >
                                    Twitter
                                </a>
                                <br />
                                <a
                                    onClick={openLink}
                                    href="mailto:info@defineeditor.com"
                                >
                                    E-mail
                                </a>
                            </Typography>
                        </CardContent>
                    </Box>
                </Card>
                <Card sx={styles.card}>
                    <Box sx={styles.cardContent}>
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                Development Team
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ marginBottom: '16px' }}
                            >
                                <a
                                    onClick={openLink}
                                    href="https://www.linkedin.com/in/dmitry-kolosov-91751413/"
                                >
                                    Dmitry Kolosov
                                </a>
                            </Typography>
                        </CardContent>
                    </Box>
                </Card>
                <Card sx={styles.card}>
                    <Box sx={styles.cardContent}>
                        <CardContent>
                            <Typography variant="h6" color="primary">
                                Source Code and Development
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{ marginBottom: '16px' }}
                            >
                                <a
                                    onClick={openLink}
                                    href="https://github.com/defineEditor/vde-dataset-viewer"
                                >
                                    GitHub
                                </a>
                                <br />
                                <a
                                    onClick={openLink}
                                    href="https://trello.com/b/UKjKhRZA"
                                >
                                    Trello (development)
                                </a>
                                <br />
                            </Typography>
                        </CardContent>
                    </Box>
                </Card>
            </Stack>
        </Stack>
    );
};

export default About;
