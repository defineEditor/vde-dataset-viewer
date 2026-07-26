import React from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
} from '@mui/material';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { useAppDispatch } from '@redux/hooks';
import { IUiModalHelp } from '@interfaces/common';
import { closeModal } from '@redux/slices/ui';
import { HELP_CONTENT } from '@/misc/help';
import ModalTitle from '@components/Modal/ModalTitle';
import { modals } from '@/misc/constants';

const styles = {
    dialog: {
        minWidth: { xs: '95%', sm: '90%', md: '70%', lg: '60%', xl: '55%' },
        maxHeight: '90vh',
    },
    title: {
        backgroundColor: 'primary.main',
        color: 'grey.100',
    },
    actions: {
        m: 1,
    },
    markdown: {
        '& h4': {
            mt: 2.5,
            mb: 1,
            fontSize: '1rem',
            fontWeight: 700,
        },
        '& p': {
            my: 1.25,
            lineHeight: 1.6,
        },
        '& strong': {
            fontWeight: 700,
        },
        '& pre': {
            my: 1.5,
            p: 1.5,
            borderRadius: 1,
            overflowX: 'auto',
            backgroundColor: 'grey.100',
            fontSize: '0.875rem',
        },
        '& code': {
            fontFamily: 'Roboto Mono, monospace',
        },
    },
    media: {
        width: '100%',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
    },
};

interface MarkdownImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
    alt?: string;
}

const MarkdownImage = ({ src = '', alt = '' }: MarkdownImageProps) => {
    if (!src) {
        return null;
    }

    const isVideo = src.endsWith('.mp4');

    if (!isVideo) {
        return <Box component="img" src={src} alt={alt} sx={styles.media} />;
    }

    return (
        <Box component="video" sx={styles.media} autoPlay loop muted>
            <Box component="source" src={`media:/${src}`} type="video/mp4" />
        </Box>
    );
};

const markdownComponents: Components = {
    img: MarkdownImage as Components['img'],
};

const Help: React.FC<IUiModalHelp> = ({ data }) => {
    const dispatch = useAppDispatch();
    const help = HELP_CONTENT[data.helpId];

    const handleClose = () => {
        dispatch(closeModal({ type: modals.HELP }));
    };

    if (!help) {
        return null;
    }

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: styles.dialog } }}
        >
            <ModalTitle
                onClose={handleClose}
                title={help.title}
                sx={styles.title}
            />
            <DialogContent dividers>
                <Box sx={styles.markdown}>
                    <ReactMarkdown components={markdownComponents}>
                        {help.content}
                    </ReactMarkdown>
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Help;
