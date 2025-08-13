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

const IssueSummary: React.FC<{ report: ParsedValidationReport }> = ({
    report,
}) => (
    <Box sx={{ width: '100%', overflow: 'auto' }}>
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Dataset</TableCell>
                        <TableCell>Rule</TableCell>
                        <TableCell>Message</TableCell>
                        <TableCell>Issues</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {report.Issue_Summary.map((item) => (
                        <TableRow key={item.dataset + item.core_id}>
                            <TableCell>{item.dataset}</TableCell>
                            <TableCell>{item.core_id}</TableCell>
                            <TableCell>{item.message}</TableCell>
                            <TableCell>{item.issues}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

export default IssueSummary;
