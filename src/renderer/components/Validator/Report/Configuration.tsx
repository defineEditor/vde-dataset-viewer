import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Tooltip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ParsedValidationReport, ValidationRunReport } from 'interfaces/common';

const styles = {
    container: {
        p: 2,
    },
    subContainer: {
        flex: 1,
        backgroundColor: 'grey.300',
    },
    card: {
        flex: 1,
        backgroundColor: 'grey.200',
    },
    command: {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'auto',
        textOverflow: 'ellipsis',
        wordBreak: 'break-word',
    },
    copyIcon: {
        color: 'primary.main',
        width: 24,
        height: 24,
        m: 1,
    },
};

const Command: React.FC<{
    command: string;
    onCopyToClipboard: (text: string) => void;
}> = ({ command, onCopyToClipboard }) => {
    return (
        <Stack direction="row" alignItems="center">
            <Typography variant="caption" sx={styles.command}>
                {command}
            </Typography>
            <IconButton
                size="small"
                onClick={() => onCopyToClipboard(command)}
                sx={styles.copyIcon}
            >
                <Tooltip title="Copy to clipboard">
                    <ContentCopyIcon />
                </Tooltip>
            </IconButton>
        </Stack>
    );
};

interface ConfigurationProps {
    report: ParsedValidationReport;
    runReport: ValidationRunReport;
    onCopyToClipboard: (text: string) => void;
}

const Configuration: React.FC<ConfigurationProps> = ({
    report,
    runReport,
    onCopyToClipboard,
}) => {
    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch {
            return dateString;
        }
    };

    const conformanceDetails = report.Conformance_Details;

    const conformanceData = [
        {
            label: 'Report Generation',
            value: formatDateTime(conformanceDetails.Report_Generation),
        },
        { label: 'Total Runtime', value: conformanceDetails.Total_Runtime },
        {
            label: 'CORE Engine Version',
            value: conformanceDetails.CORE_Engine_Version,
        },
    ];

    const executionData = [{ label: 'Command', value: runReport.command }];

    const standardsData = [
        { label: 'Standard', value: conformanceDetails.Standard },
        {
            label: 'Sub-Standard',
            value: conformanceDetails.Substandard || 'Not specified',
        },
        { label: 'Version', value: conformanceDetails.Version },
        {
            label: 'CT Version',
            value: conformanceDetails.CT_Version || 'Not configured',
        },
        {
            label: 'Define-XML Version',
            value: conformanceDetails.Define_XML_Version || 'Not configured',
        },
        {
            label: 'UNII Version',
            value: conformanceDetails.UNII_Version || 'Not configured',
        },
        {
            label: 'Med-RT Version',
            value: conformanceDetails['Med-RT_Version'] || 'Not configured',
        },
        {
            label: 'MedDRA Version',
            value: conformanceDetails.Meddra_Version || 'Not configured',
        },
        {
            label: 'WHODRUG Version',
            value: conformanceDetails.WHODRUG_Version || 'Not configured',
        },
        {
            label: 'SNOMED Version',
            value: conformanceDetails.SNOMED_Version || 'Not configured',
        },
    ];

    return (
        <Stack
            spacing={3}
            direction={{ xs: 'column', md: 'row' }}
            sx={styles.container}
        >
            <Stack sx={styles.subContainer} spacing={3}>
                {/* Conformance Details */}
                <Card sx={styles.card}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Conformance Details
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    {conformanceData.map((row) => (
                                        <TableRow key={row.label}>
                                            <TableCell
                                                component="th"
                                                scope="row"
                                                sx={{
                                                    fontWeight: 'medium',
                                                    borderBottom: 'none',
                                                }}
                                            >
                                                {row.label}
                                            </TableCell>
                                            <TableCell
                                                sx={{ borderBottom: 'none' }}
                                            >
                                                {row.value}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
                {/* Execution Details */}
                <Card sx={styles.card}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Execution Details
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    {executionData.map((row) => (
                                        <TableRow key={row.label}>
                                            <TableCell
                                                component="th"
                                                scope="row"
                                                sx={{
                                                    fontWeight: 'medium',
                                                    borderBottom: 'none',
                                                }}
                                            >
                                                {row.label}
                                            </TableCell>
                                            <TableCell
                                                sx={{ borderBottom: 'none' }}
                                            >
                                                {row.label === 'Command' ? (
                                                    <Command
                                                        command={row.value}
                                                        onCopyToClipboard={
                                                            onCopyToClipboard
                                                        }
                                                    />
                                                ) : (
                                                    row.value
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Stack>

            {/* Standards Details */}
            <Card sx={styles.card}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Standards Details
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableBody>
                                {standardsData.map((row) => (
                                    <TableRow key={row.label}>
                                        <TableCell
                                            component="th"
                                            scope="row"
                                            sx={{
                                                fontWeight: 'medium',
                                                borderBottom: 'none',
                                            }}
                                        >
                                            {row.label}
                                        </TableCell>
                                        <TableCell
                                            sx={{ borderBottom: 'none' }}
                                        >
                                            {row.value}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Stack>
    );
};

export default Configuration;
