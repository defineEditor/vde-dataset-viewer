import { ParsedValidationReport, ITableData, IMask } from 'interfaces/common';

/**
 * Get issue annotations for table view
 */

const getIssueAnnotationststs = (
    report: ParsedValidationReport | null,
    table: ITableData | null,
    currentMask: IMask | null,
    filteredIssues: string[],
): Map<string, { text: string; color: string }> | null => {
    if (!table || !report) {
        return null;
    }

    const issueAnnotations = new Map();
    // Select all issues, related to the current dataset;
    const issues = report.Issue_Details.filter((detail) => {
        return detail.dataset === table?.metadata.name;
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

        vars.forEach((variable) => {
            // Check the variable is present
            if (!variableIndices.has(variable)) {
                return;
            }
            const colIndex = variableIndices.get(variable);
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

    return issueAnnotations;
};

export default getIssueAnnotationststs;
