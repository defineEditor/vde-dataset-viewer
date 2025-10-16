import { ParsedValidationReport, ITableData, IMask } from 'interfaces/common';

/**
 * Get issue annotations for table view
 */

const getIssueAnnotations = (
    report: ParsedValidationReport | null,
    table: ITableData | null,
    currentMask: IMask | null,
    filteredIssues: string[],
    page: number,
    pageSize: number,
): {
    annotations: Map<string, { text: string; color: string }>;
    byRow: { row: number; ruleId: string; column: string; text: string }[];
} | null => {
    if (!table || !report) {
        return null;
    }

    const issueAnnotations = new Map();
    const byRow: {
        row: number;
        ruleId: string;
        column: string;
        text: string;
    }[] = [];
    // Select all issues, related to the current dataset;
    const issues = report.Issue_Details.filter((detail) => {
        return (
            detail.dataset.toLowerCase() === table?.metadata.name.toLowerCase()
        );
    }).filter((detail) => {
        return filteredIssues.includes(detail.core_id);
    });

    // Calculate index of each variable
    const variableIndices = new Map<string, number>();
    table.header
        .filter((col) => {
            if (currentMask !== null) {
                return currentMask.columns.includes(col.id);
            }
            return true;
        })
        .forEach((col, index) => {
            // Add +1 to index to account for row number column
            variableIndices.set(col.id, index + 1);
        });

    issues.forEach((issue) => {
        const vars = issue.variables;
        let rowIndex: number;
        if (typeof issue.row === 'number') {
            rowIndex = issue.row - 1;
        } else {
            return;
        }

        let variableFound = false;
        vars.forEach((variable) => {
            // Check the variable is present
            if (!variableIndices.has(variable)) {
                return;
            }
            if (!variableFound) {
                // Mark the first variable for the byRow mapping
                byRow.push({
                    row: rowIndex,
                    ruleId: issue.core_id,
                    column: variable,
                    text: issue.message,
                });
                variableFound = true;
            }
            const colIndex = variableIndices.get(variable);
            // Recalculate row index based on pagination
            rowIndex -= page * pageSize;
            // Check if there is already an annotation present
            const existingAnnotation = issueAnnotations.get(
                `${rowIndex}#${colIndex}`,
            );
            if (existingAnnotation) {
                // If an annotation exists, update it
                existingAnnotation.text = `${existingAnnotation.text}\n${issue.core_id}: ${issue.message}`;
            } else {
                // If no annotation exists, create a new one
                issueAnnotations.set(`${rowIndex}#${colIndex}`, {
                    text: `${issue.core_id}: ${issue.message}`,
                    color: '',
                });
            }
        });
    });

    // Sort byRow by row number
    byRow.sort((a, b) => a.row - b.row);

    return { annotations: issueAnnotations, byRow };
};

export default getIssueAnnotations;
