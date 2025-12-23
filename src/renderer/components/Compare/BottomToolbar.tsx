import React from 'react';
import { TablePagination, Stack, Box } from '@mui/material';
import { useAppDispatch } from 'renderer/redux/hooks';
import IssueNavigation from 'renderer/components/ViewDataset/IssueNavigation';

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
    disablePagination?: boolean;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
    totalRecords,
    page,
    pageSize,
    records,
    onPageChange,
    issuesByRow,
    disablePagination = false,
}) => {
    const dispatch = useAppDispatch();

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
                    <IssueNavigation issuesByRow={issuesByRow} />
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
