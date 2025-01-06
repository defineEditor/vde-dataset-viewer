// Estimate width based on data
import { ITableData } from 'interfaces/common';

export default function estimateWidth(
    data: ITableData,
    widthEstimateRows: number,
    maxColWidth: number,
): { [id: string]: number } {
    const { header, data: tableData } = data;
    const result = {};
    // For each column get the first rows and calculate the maximum width/longest word
    const dataSlice = tableData.slice(0, widthEstimateRows);
    header
        .filter((column) => !column.hidden)
        .forEach((column) => {
            const { id } = column;
            const columnData = dataSlice.map((row) => row[column.id]);
            let columnWidth = 0;
            let longestWord = 0;
            if (
                !['integer', 'float', 'boolean', 'double'].includes(
                    column.type || '',
                )
            ) {
                // String
                // Get the maximum width of the column
                columnWidth = Math.max(
                    ...columnData.map((value) => {
                        if (typeof value === 'string') {
                            return value.length;
                        }
                        return 0;
                    }),
                );
                // Get the longest word in the column
                longestWord = Math.max(
                    ...columnData.map((value) => {
                        if (typeof value === 'string') {
                            const words = value.split(' ');
                            return Math.max(
                                ...words.map((word) => word.length),
                            );
                        }
                        return 0;
                    }),
                );
            } else if (
                ['integer', 'float', 'double'].includes(column.type || '')
            ) {
                // Number
                columnWidth = 8;
                longestWord = 8;
            } else {
                // Boolean
                columnWidth = 4;
                longestWord = 4;
            }
            // Id.length - label length + 2 characters for sorting icon
            result[id] = Math.min(
                Math.round(
                    Math.max(columnWidth, longestWord, id.length * 1.3 + 2),
                ),
                maxColWidth,
            );
        });

    return result;
}
