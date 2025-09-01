import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
} from '@mui/material';
import { ParsedValidationReport } from 'interfaces/core.report';

const styles = {
    container: {
        p: 2,
    },
    card: {
        flex: 1,
        backgroundColor: 'grey.200',
    },
};

interface ConfigurationProps {
    report: ParsedValidationReport;
}

const Configuration: React.FC<ConfigurationProps> = ({ report }) => {
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
