import React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { ParsedValidationReport } from 'interfaces/core.report';

const RuleReports: React.FC<{ report: ParsedValidationReport }> = ({
    report,
}) => (
    <Box sx={{ width: '100%', overflow: 'auto' }}>
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Rule</TableCell>
                        <TableCell>CDISC Rule ID</TableCell>
                        <TableCell>FDA Rule ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Message</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {report.Rules_Report.map((rule) => (
                        <TableRow
                            key={
                                rule.core_id +
                                rule.cdisc_rule_id +
                                rule.fda_rule_id
                            }
                        >
                            <TableCell>{rule.core_id}</TableCell>
                            <TableCell>{rule.cdisc_rule_id}</TableCell>
                            <TableCell>{rule.fda_rule_id}</TableCell>
                            <TableCell>{rule.status}</TableCell>
                            <TableCell>{rule.message}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

export default RuleReports;
