// Function to calculate column width;

import { IHeaderCell, ITableData } from 'interfaces/table';
import estimateWidth from 'renderer/utils/estimateWidth';

const calculateColumnWidth = (
    columns: IHeaderCell[],
    fitInContainer?: 'expand' | 'fit' | 'no',
    containerWidth?: number,
    maxColWidth?: number,
    widthEstimateRows?: number,
    showTypeIcons?: boolean,
    data?: ITableData,
): { [id: string]: number } => {
    let result = {};
    // First estimate width based on the content
    let estimateWidths: { [id: string]: number } = {};
    if (
        data &&
        widthEstimateRows &&
        showTypeIcons !== undefined &&
        maxColWidth !== undefined &&
        containerWidth
    ) {
        estimateWidths = estimateWidth(
            data,
            widthEstimateRows,
            maxColWidth,
            showTypeIcons,
            true,
        );
        // Convert to px
        Object.keys(estimateWidths).forEach((key) => {
            // 9px per character + 18px padding
            estimateWidths[key] = estimateWidths[key] * 9 + 18;
        });
        // Keep track of fixed width;
        const fixedWidthColumns: string[] = [];
        let totalFixedWidth = 0;
        for (const col of columns) {
            const colId = col.id;
            // Add padding if specified
            if (col.padding) {
                estimateWidths[colId] += col.padding;
            }
            // Check if any of the columns are wider than the max width
            if (
                estimateWidths[colId] &&
                col.maxSize &&
                estimateWidths[colId] > col.maxSize
            ) {
                estimateWidth[colId] = col.maxSize;
                totalFixedWidth += col.maxSize;
                fixedWidthColumns.push(colId);
            }
            // Check if any of the columns are smaller than the min width
            if (
                estimateWidths[colId] &&
                col.minSize &&
                estimateWidths[colId] < col.minSize
            ) {
                estimateWidths[colId] = col.minSize;
            }
            // Check if size is provided
            if (col.size) {
                estimateWidths[colId] = col.size;
                totalFixedWidth += col.size;
                fixedWidthColumns.push(colId);
            }
        }
        // Get total width
        const totalWidth = Object.values(estimateWidths).reduce(
            (a: number, b: number) => a + b,
            0,
        );

        // Scale if required to fit on page
        if (
            fitInContainer &&
            ['expand', 'fit'].includes(fitInContainer) &&
            containerWidth
        ) {
            const scaleFactor =
                (containerWidth - totalFixedWidth) /
                (totalWidth - totalFixedWidth);
            // If expanding, allow columns only to grow
            if (
                (fitInContainer === 'expand' && scaleFactor > 1) ||
                fitInContainer === 'fit'
            ) {
                for (const colId in estimateWidths) {
                    if (!fixedWidthColumns.includes(colId)) {
                        estimateWidths[colId] = Math.floor(
                            estimateWidths[colId] * scaleFactor,
                        );
                    }
                }
            }
            // Fit the last column for the full width
            const newTotalWidth = Object.values(estimateWidths).reduce(
                (a: number, b: number) => a + b,
                0,
            );
            const lastColId = columns[columns.length - 1].id;
            estimateWidths[lastColId] += Math.max(
                containerWidth - newTotalWidth,
                0,
            );
        }
        result = estimateWidths;
    }

    return result;
};

export default calculateColumnWidth;
