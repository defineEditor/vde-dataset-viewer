import { ParsedValidationReport } from 'interfaces/common';

const removeExtensions = (dataset: string) =>
    dataset.replace(/\.[^/\\.]+$/, '').toUpperCase();

// Transform report to properly show it
const transformReport = (
    report: ParsedValidationReport,
): ParsedValidationReport => {
    // Split records with multiple datasets into separate lines;
    const transformedSummary = report.Issue_Summary.flatMap((issue) => {
        // Split dataset names that contain commas
        const datasets = issue.dataset.split(',');
        return datasets.map((dataset) => ({
            ...issue,
            dataset: removeExtensions(dataset.trim()), // Remove any extra whitespace
        }));
    });

    // Remove extensions from dataset names
    const transformedDetailed = report.Issue_Details.map((issue) => ({
        ...issue,
        dataset: removeExtensions(issue.dataset),
    }));

    return {
        ...report,
        Issue_Summary: transformedSummary,
        Issue_Details: transformedDetailed,
    };
};

export default transformReport;
