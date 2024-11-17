/* eslint-disable react/no-array-index-key */
/* eslint-disable object-shorthand */
// @ts-ignore
import { TableVirtuoso } from 'react-virtuoso';
import React, {
    forwardRef,
    useRef,
    useState,
    useCallback,
    useEffect,
} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Draggable from 'react-draggable';
import {
    IGeneralTableHeaderCell,
    ITableData,
    ItemDataArray,
} from 'interfaces/common';
import { Stack, Typography } from '@mui/material';

const styles = {
    table: {
        borderCollapse: 'separate',
        tableLayout: 'fixed',
    },
    lineNumber: {
        width: 45,
        background: 'white',
        fontSize: '12px',
        fontFamily: 'monospace',
        color: 'black',
        backgroundColor: '#ebebeb',
        fontWeight: 'bold',
        padding: 0.5,
    },
    cell: {
        fontFamily: 'monospace',
        border: '1px solid #ebebeb',
        overflow: 'hidden',
        lineHeight: '1em',
        p: 0.5,
    },
    headerCell: {
        padding: 0,
        textOverflow: 'ellipsis',
        backgroundColor: 'white',
    },
    headerLabel: {
        pl: 1,
        pt: 1,
        pb: 1,
    },
    dragCell: {
        width: 3,
        backgroundColor: 'grey.400',
        '&:hover': {
            backgroundColor: 'grey.600',
            cursor: 'col-resize',
        },
    },
};

const TablePlaceHolder = ({ height }: { height: number }) => (
    <div
        style={{
            height,
            padding: '8px',
            boxSizing: 'border-box',
            overflow: 'hidden',
        }}
    >
        Test
    </div>
);

const TableComponents = {
    Scroller: forwardRef((props, ref) => (
        <TableContainer
            component={Paper}
            {...props}
            ref={ref as React.RefObject<HTMLDivElement>}
        />
    )),
    ScrollSeekerPlaceholder: TablePlaceHolder,
    Table: (props) => <Table {...props} style={styles.table} />,
    TableHead: TableHead,
    TableRow: TableRow,
    TableBody: forwardRef((props, ref) => (
        <TableBody
            {...props}
            ref={ref as React.RefObject<HTMLTableSectionElement>}
        />
    )),
};

const GeneralTableHeader: React.FC<{
    header: IGeneralTableHeaderCell[];
    onResize: (resizing: boolean) => void;
}> = ({
    header,
    onResize,
}: {
    header: IGeneralTableHeaderCell[];
    onResize: (resizing: boolean) => void;
}) => {
    const result: React.ReactElement[] = [];

    const [widths, setWidths] = useState({} as { [key: string]: string });

    const resizeCol = (itemId: string, deltaX: number) => {
        const newWidths = { ...widths };
        const newWidth = parseInt(newWidths[itemId], 10) + deltaX;
        newWidths[itemId] = `${newWidth}px`;
        setWidths(newWidths);
    };

    useEffect(() => {
        const initialWidths = {};
        header.forEach((item) => {
            initialWidths[item.id] = item.style?.width || '100px';
        });
        setWidths(initialWidths);
    }, [header]);

    header.forEach((item, index) => {
        if (index === 0) {
            result.push(
                <TableCell key={item.id} style={styles.lineNumber}>
                    {item.id}
                </TableCell>
            );
        } else {
            const columnStyle = {
                ...styles.headerCell,
                width: widths[item.id],
            };
            result.push(
                <TableCell key={item.id} sx={columnStyle}>
                    <Stack
                        direction="row"
                        spacing={0}
                        alignContent="space-between"
                        justifyContent="space-between"
                    >
                        <Typography component="span" sx={styles.headerLabel}>
                            {item.id}
                        </Typography>
                        <Draggable
                            axis="x"
                            onStart={() => onResize(true)}
                            onStop={(_e, { x }) => {
                                resizeCol(item.id, x);
                                onResize(false);
                            }}
                            position={{ x: 0, y: 0 }}
                        >
                            <Box component="span" sx={styles.dragCell} />
                        </Draggable>
                    </Stack>
                </TableCell>
            );
        }
    });
    return <TableRow>{result}</TableRow>;
};

const GeneralTableRow: React.FC<{
    row: ItemDataArray;
    rowIndex: number;
    selectCell: (x: number, y: number) => void;
    currentX: number;
    currentY: number;
}> = ({
    row,
    rowIndex,
    selectCell,
    currentX,
    currentY,
}: {
    row: ItemDataArray;
    rowIndex: number;
    selectCell: (x: number, y: number) => void;
    currentX: number;
    currentY: number;
}) => {
    const result: React.ReactElement[] = [];
    row.forEach((item, columnIndex) => {
        if (columnIndex === 0) {
            result.push(
                <TableCell
                    key={columnIndex}
                    padding="normal"
                    size="small"
                    sx={styles.lineNumber}
                >
                    {item}
                </TableCell>
            );
        } else {
            result.push(
                <TableCell
                    key={columnIndex}
                    padding="normal"
                    size="small"
                    onClick={() => {
                        selectCell(columnIndex, rowIndex);
                    }}
                    sx={styles.cell}
                    style={{
                        backgroundColor:
                            columnIndex === currentX && rowIndex === currentY
                                ? '#006EFF12'
                                : 'transparent',
                    }}
                >
                    {item}
                </TableCell>
            );
        }
    });
    return <>{result}</>;
};

const GeneralTable: React.FC<{ table: ITableData; pageSize: number }> = ({
    table,
    pageSize,
}: {
    table: ITableData;
    pageSize: number;
}) => {
    const ref = useRef<TableVirtuoso>(null);
    const listRef = useRef(null);
    const numVars = table.header.length;

    const [currentY, setCurrentY] = useState(-1);
    const [currentX, setCurrentX] = useState(-1);

    const keyDownCallback = useCallback(
        (event) => {
            let nextY = -1;
            let nextX = -1;

            if (event.code === 'ArrowUp') {
                nextY = Math.max(0, currentY - 1);
            } else if (event.code === 'ArrowDown') {
                nextY = Math.min(pageSize, currentY + 1);
            } else if (event.code === 'ArrowRight') {
                nextX = Math.min(numVars, currentX + 1);
            } else if (event.code === 'ArrowLeft') {
                nextX = Math.max(1, currentX - 1);
            } else if (event.code === 'PageDown') {
                nextY = Math.min(pageSize, currentY + 10);
            } else if (event.code === 'PageUp') {
                nextY = Math.max(0, currentY - 10);
            }

            if (nextY !== -1 && nextY !== currentY && ref.current !== null) {
                ref.current.scrollIntoView({
                    index: nextY,
                    behavior: 'auto',
                    done: () => {
                        setCurrentY(nextY);
                    },
                });
                event.preventDefault();
            }
            if (nextX !== -1 && nextX !== currentX) {
                setCurrentX(nextX);
                event.preventDefault();
            }
        },
        [ref, currentY, setCurrentY, currentX, setCurrentX, numVars, pageSize]
    );

    const scrollerRef = useCallback(
        (element) => {
            if (element) {
                element.addEventListener('keydown', keyDownCallback);
                listRef.current = element;
            } else if (listRef.current !== null) {
                (listRef.current as any).removeEventListener(
                    'keydown',
                    keyDownCallback
                );
            }
        },
        [keyDownCallback]
    );

    const selectCell = (x: number, y: number) => {
        setCurrentX(x);
        setCurrentY(y);
    };

    const [resizing, setResizing] = useState(false);

    const handleResize = (isResizing: boolean) => {
        if (isResizing) {
            setResizing(true);
        } else {
            setResizing(false);
        }
    };

    return (
        <TableVirtuoso
            ref={ref}
            scrollerRef={scrollerRef}
            data={table.data}
            overscan={50}
            components={TableComponents}
            increaseViewportBy={1000}
            scrollSeekConfiguration={{
                enter: (velocity) => Math.abs(velocity) > 50,
                exit: (velocity) => Math.abs(velocity) < 10,
            }}
            fixedHeaderContent={() => (
                <GeneralTableHeader
                    header={table.header}
                    onResize={handleResize}
                />
            )}
            itemContent={(rowIndex: number, row: ItemDataArray) =>
                resizing ? (
                    row.map(() => <TableCell />)
                ) : (
                    <GeneralTableRow
                        row={row}
                        rowIndex={rowIndex}
                        currentX={currentX}
                        currentY={currentY}
                        selectCell={selectCell}
                    />
                )
            }
        />
    );
};

export default GeneralTable;
