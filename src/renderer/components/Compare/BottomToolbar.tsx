import React from 'react';
import { TablePagination, Stack, Box } from '@mui/material';
import DiffNavigation from 'renderer/components/Compare/DiffNavigation';
import { IUiControl } from 'interfaces/common';

const styles = {
    container: {
        width: '100%',
        display: 'flex',
        backgroundColor: '#FFF',
        flex: '1 1 auto',
    },
    mainStack: {
        width: '100%',
        overflow: 'hidden',
        height: 52,
    },
    leftSection: {
        maxWidth: '100%',
        flex: '1 1 auto',
    },
    navigationSectionExpanded: {
        height: '100%',
        flex: '1 1 auto',
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        overflow: 'auto',
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
        flex: '0 0 auto',
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
    diffs: Map<
        number,
        {
            column?: {
                baseValue: string;
                compValue: string;
                diff: React.ReactElement;
            };
        }
    >;
    onSetGoTo: (goTo: Partial<IUiControl['goTo']>) => void;
    disablePagination?: boolean;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
    totalRecords,
    page,
    pageSize,
    records,
    onPageChange,
    diffs,
    onSetGoTo,
    disablePagination = false,
}) => {
    return (
        <Box sx={styles.container}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={styles.mainStack}
            >
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <DiffNavigation diffs={diffs} onSetGoTo={onSetGoTo} />
                </Box>

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
