import React from 'react';
import {
    TablePagination,
    Stack,
    IconButton,
    Box,
    Collapse,
    Tooltip,
} from '@mui/material';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { useAppSelector, useAppDispatch } from 'renderer/redux/hooks';
import { setBottomSection } from 'renderer/redux/slices/ui';
import DatasetNavigation from 'renderer/components/ViewDataset/DatasetNavigation';
import IssueNavigation from './IssueNavitation';

const styles = {
    container: {
        width: '100%',
        display: 'flex',
        backgroundColor: '#FFF',
    },
    mainStack: {
        width: '100%',
    },
    leftSection: {
        maxWidth: '100%',
        flex: '1 1 auto',
    },
    navigationSectionExpanded: {
        height: '100%',
        flex: '1 0 auto',
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
    },
    navigationSectionCollapsed: {
        height: '100%',
        flex: '0 1 auto',
        display: 'flex',
        alignItems: 'center',
    },
    pagination: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    iconButton: {
        color: 'grey.600',
        mx: 1,
        height: 32,
    },
};

interface BottomToolbarProps {
    totalRecords: number;
    page: number;
    pageSize: number;
    records: number;
    onPageChange: (
        _event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => void;
    issuesByRow:
        | { row: number; ruleId: string; column: string; text: string }[]
        | null;
    showIssues: boolean;
    disablePagination?: boolean;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
    totalRecords,
    page,
    pageSize,
    records,
    onPageChange,
    issuesByRow,
    showIssues,
    disablePagination = false,
}) => {
    const section = useAppSelector((state) => state.ui.viewer.bottomSection);
    const dispatch = useAppDispatch();

    const disableIssues =
        !showIssues || !issuesByRow || issuesByRow.length === 0;

    const handleSectionToggle = (clickedSection: 'dataset' | 'issues') => {
        if (section !== clickedSection) {
            dispatch(setBottomSection(clickedSection));
        }
        if (section === clickedSection) {
            dispatch(
                setBottomSection(
                    clickedSection === 'dataset' && !disableIssues
                        ? 'issues'
                        : 'dataset',
                ),
            );
        }
    };

    return (
        <Box sx={styles.container}>
            <Stack
                direction="row"
                alignItems="space-between"
                spacing={1}
                sx={styles.mainStack}
            >
                <Stack
                    direction="row"
                    sx={styles.leftSection}
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    spacing={1}
                >
                    {/* Dataset Navigation Section */}
                    <Box
                        sx={
                            section === 'dataset'
                                ? styles.navigationSectionExpanded
                                : styles.navigationSectionCollapsed
                        }
                    >
                        <Tooltip title="Dataset Navigation">
                            <IconButton
                                size="small"
                                onClick={() => handleSectionToggle('dataset')}
                                sx={styles.iconButton}
                            >
                                <TableViewOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                        <Collapse
                            in={section === 'dataset' || disableIssues}
                            orientation="horizontal"
                        >
                            <DatasetNavigation />
                        </Collapse>
                    </Box>

                    {/* Issues Navigation Section */}
                    <Box
                        sx={
                            section === 'issues'
                                ? styles.navigationSectionExpanded
                                : styles.navigationSectionCollapsed
                        }
                    >
                        <Tooltip title="Issues Navigation">
                            <span>
                                <IconButton
                                    size="small"
                                    disabled={disableIssues}
                                    onClick={() =>
                                        handleSectionToggle('issues')
                                    }
                                    sx={styles.iconButton}
                                >
                                    <FactCheckIcon />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Collapse
                            in={section === 'issues' && !disableIssues}
                            orientation="horizontal"
                        >
                            <IssueNavigation issuesByRow={issuesByRow} />
                        </Collapse>
                    </Box>
                </Stack>

                {/* Pagination */}
                {pageSize < records && (
                    <Box sx={styles.pagination}>
                        <TablePagination
                            component="div"
                            count={totalRecords}
                            page={page}
                            disabled={disablePagination}
                            onPageChange={onPageChange}
                            rowsPerPage={pageSize}
                            rowsPerPageOptions={[-1]}
                        />
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default BottomToolbar;
