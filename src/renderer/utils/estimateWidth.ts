// Estimate width based on data
import { ITableData } from 'interfaces/common';

export default function estimateWidth(
    data: ITableData,
    widthEstimateRows: number
): { [id: string]: number } {
    const { header, data: tableData } = data;
    const result = {};
    // For each column get the first 100 rows and calculate the maximum width/longest word
    const dataSlice = tableData.slice(0, widthEstimateRows);
    header
        .filter((column) => !column.hidden)
        .forEach((column, columnIndex) => {
            const { id } = column;
            const columnData = dataSlice.map((row) => row[columnIndex]);
            let columnWidth = 0;
            let longestWord = 0;
            if (typeof columnData[0] === 'string') {
                // Get the maximum width of the column
                columnWidth = Math.max(
                    ...columnData.map((value) => {
                        if (typeof value === 'string') {
                            return value.length;
                        }
                        return 0;
                    })
                );
                // Get the longest word in the column
                longestWord = Math.max(
                    ...columnData.map((value) => {
                        if (typeof value === 'string') {
                            const words = value.split(' ');
                            return Math.max(
                                ...words.map((word) => word.length)
                            );
                        }
                        return 0;
                    })
                );
            }
            result[id] = Math.max(
                columnWidth / 3,
                longestWord,
                id.length * 1.5
            );
        });

    return result;
}
