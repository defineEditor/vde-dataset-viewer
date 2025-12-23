import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAppSelector } from 'renderer/redux/hooks';
import { diffChars } from 'diff';

const styles = {
    container: {
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        p: 2,
    },
    section: {
        mb: 4,
        flex: '1 1 auto',
    },
    title: {
        mb: 2,
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%',
    },
    tableContainer: {
        border: '1px solid #e0e0e0',
    },
    successMessage: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: 'success.main',
        mb: 2,
    },
};

const Metadata: React.FC = () => {
    const datasetDiff = useAppSelector(
        (state) => state.data.compare.datasetDiff,
    );

    const renderDiff = (base: string, compare: string) => {
        const diffParts = diffChars(String(base), String(compare));
        return (
            <span>
                {diffParts.map((part) => {
                    const style = {
                        backgroundColor: part.added
                            ? 'lightgreen'
                            : part.removed
                              ? 'salmon'
                              : 'transparent',
                    };
                    return <span style={style}>{part.value}</span>;
                })}
            </span>
        );
    };

    const dsAttributesData = useMemo(() => {
        if (
            !datasetDiff?.metadata.dsAttributeDiffs ||
            Object.keys(datasetDiff.metadata.dsAttributeDiffs).length === 0
        ) {
            return [];
        }

        return Object.entries(datasetDiff.metadata.dsAttributeDiffs).map(
            ([attribute, diff]) => ({
                attribute,
                base: String(diff.base),
                compare: String(diff.compare),
                diff: ['label', 'name'].includes(attribute)
                    ? renderDiff(String(diff.base), String(diff.compare))
                    : null,
            }),
        );
    }, [datasetDiff]);

    const colAttributesData = useMemo(() => {
        if (
            !datasetDiff?.metadata.attributeDiffs ||
            Object.keys(datasetDiff.metadata.attributeDiffs).length === 0
        ) {
            return [];
        }

        const data: {
            column: string;
            attribute: string;
            base: string;
            compare: string;
            diff: React.ReactElement | null;
        }[] = [];

        Object.entries(datasetDiff.metadata.attributeDiffs).forEach(
            ([columnName, attributes]) => {
                Object.entries(attributes).forEach(([attribute, diff]) => {
                    data.push({
                        column: columnName,
                        attribute,
                        base: String(diff.base),
                        compare: String(diff.compare),
                        diff: ['label', 'name', 'displayFormat'].includes(
                            attribute,
                        )
                            ? renderDiff(
                                  String(diff.base),
                                  String(diff.compare),
                              )
                            : null,
                    });
                });
            },
        );

        return data;
    }, [datasetDiff]);

    if (!datasetDiff) return null;

    return (
        <Box sx={styles.container}>
            <Box sx={styles.section}>
                <Typography variant="h6" sx={styles.title}>
                    Dataset Attributes Difference
                </Typography>
                {dsAttributesData.length > 0 ? (
                    <TableContainer
                        component={Paper}
                        sx={styles.tableContainer}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Attribute</TableCell>
                                    <TableCell>Base</TableCell>
                                    <TableCell>Compare</TableCell>
                                    <TableCell>Diff</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dsAttributesData.map((row) => (
                                    <TableRow key={row.attribute}>
                                        <TableCell>{row.attribute}</TableCell>
                                        <TableCell>{row.base}</TableCell>
                                        <TableCell>{row.compare}</TableCell>
                                        <TableCell>{row.diff}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={styles.successMessage}>
                        <CheckCircleIcon />
                        <Typography>Dataset attributes are equal.</Typography>
                    </Box>
                )}
            </Box>

            <Box sx={styles.section}>
                <Typography variant="h6" sx={styles.title}>
                    Column Attributes Difference
                </Typography>
                {colAttributesData.length > 0 ? (
                    <TableContainer
                        component={Paper}
                        sx={styles.tableContainer}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Column</TableCell>
                                    <TableCell>Attribute</TableCell>
                                    <TableCell>Base</TableCell>
                                    <TableCell>Compare</TableCell>
                                    <TableCell>Difference</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {colAttributesData.map((row) => (
                                    <TableRow key={row.column + row.attribute}>
                                        <TableCell>{row.column}</TableCell>
                                        <TableCell>{row.attribute}</TableCell>
                                        <TableCell>{row.base}</TableCell>
                                        <TableCell>{row.compare}</TableCell>
                                        <TableCell>{row.diff}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={styles.successMessage}>
                        <CheckCircleIcon />
                        <Typography>Column attributes are equal.</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Metadata;
