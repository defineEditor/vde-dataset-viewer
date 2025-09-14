import {
    ITableData,
    ParsedValidationReport,
    DatasetJsonMetadata,
    BasicFilter,
    IUiValidationPage,
} from 'interfaces/common';
import Filter from 'js-array-filter';
import renderRuleStatus from 'renderer/components/Validator/Report/Formatters/RuleStatus';
import renderExecutability from 'renderer/components/Validator/Report/Formatters/Executable';
import renderRow from 'renderer/components/Validator/Report/Formatters/Row';
import renderVariables from 'renderer/components/Validator/Report/Formatters/Variables';
import renderSummaryIssues from 'renderer/components/Validator/Report/Formatters/SummaryIssues';
import columnDefs from 'renderer/components/Validator/Report/columnDefs';

const convertToDataset = (
    data: ParsedValidationReport,
    type: 'Issue_Details' | 'Issue_Summary' | 'Rules_Report',
    handlers: {
        onOpenFile: (id: string) => void;
        onFilterIssues: (
            filter: BasicFilter,
            reportTab: IUiValidationPage['currentReportTab'],
        ) => void;
    },
    filter: BasicFilter | null = null,
): ITableData => {
    // Implement conversion logic here
    const metadata: DatasetJsonMetadata = {
        datasetJSONCreationDateTime: new Date().toISOString(),
        datasetJSONVersion: '1.1',
        records: data[type].length,
        name: `core_report_${type}`,
        label: `CORE Report ${type}`,
        columns: [],
    };

    let filtertedColumns: string[] = [];
    if (filter) {
        filtertedColumns = filter.conditions.map((c) => c.variable);
    }
    let header: ITableData['header'] = [];
    // Get columns metadata
    if (type === 'Issue_Details') {
        metadata.columns = columnDefs.details.map((col) => ({
            itemOID: col.id,
            name: col.id,
            label: col.label,
            dataType: col.type || 'string',
        }));
        header = columnDefs.details.map((col) => {
            let item = col;
            if (filtertedColumns.includes(col.id)) {
                item = { ...item, isFiltered: true };
            }
            if (col.id === 'executability') {
                item.cell = renderExecutability;
            }
            if (col.id === 'variables') {
                item.cell = renderVariables(handlers.onOpenFile);
            }
            if (col.id === 'row') {
                item.cell = renderRow(handlers.onOpenFile);
            }
            return item;
        });
    } else if (type === 'Issue_Summary') {
        metadata.columns = columnDefs.summary.map((col) => ({
            itemOID: col.id,
            name: col.id,
            label: col.label,
            dataType: col.type || 'string',
        }));
        header = columnDefs.summary.map((col) => {
            let item = col;
            if (filtertedColumns.includes(col.id)) {
                item = { ...item, isFiltered: true };
            }
            if (col.id === 'issues') {
                item.cell = renderSummaryIssues(handlers.onFilterIssues);
            }
            return item;
        });
    } else if (type === 'Rules_Report') {
        metadata.columns = columnDefs.rules.map((col) => ({
            itemOID: col.id,
            name: col.id,
            label: col.label,
            dataType: col.type || 'string',
        }));
        header = columnDefs.rules.map((col) => {
            let item = col;
            if (filtertedColumns.includes(col.id)) {
                item = { ...item, isFiltered: true };
            }
            if (col.id === 'status') {
                item.cell = renderRuleStatus;
            }
            return item;
        });
    }

    // Add row number
    let updatedData = data[type].map((row, index) => ({
        ...row,
        '#': index + 1,
    }));
    // Filter records;
    if (filter) {
        const filterInstance = new Filter(
            'dataset-json1.1',
            metadata.columns,
            filter,
        );
        updatedData = updatedData.filter((row) => {
            // We need to covert row to array;
            const rowArray = metadata.columns.map((col) => row[col.name]);
            return filterInstance.filterRow(rowArray);
        });
    }

    const result: ITableData = {
        header,
        metadata,
        data: updatedData,
        appliedFilter: null,
        fileId: type,
    };

    return result;
};

export default convertToDataset;
