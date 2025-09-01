import {
    ITableData,
    ParsedValidationReport,
    DatasetJsonMetadata,
} from 'interfaces/common';
import renderRuleStatus from 'renderer/components/Validator/Report/Formatters/RuleStatus';
import renderExecutability from 'renderer/components/Validator/Report/Formatters/Executable';
import renderRow from 'renderer/components/Validator/Report/Formatters/Row';
import renderVariables from 'renderer/components/Validator/Report/Formatters/Variables';
import columnDefs from 'renderer/components/Validator/Report/columnDefs';

const convertToDataset = (
    data: ParsedValidationReport,
    type: 'Issue_Details' | 'Issue_Summary' | 'Rules_Report',
    onOpenFile: (id: string) => void,
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
            return col;
        });
        header = columnDefs.details.map((col) => {
            const item = col;
            if (col.id === 'executability') {
                item.cell = renderExecutability;
            }
            if (col.id === 'variables') {
                item.cell = renderVariables(onOpenFile);
            }
            if (col.id === 'row') {
                item.cell = renderRow(onOpenFile);
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
            return col;
        });
    } else if (type === 'Rules_Report') {
        metadata.columns = columnDefs.rules.map((col) => ({
            itemOID: col.id,
            name: col.id,
            label: col.label,
            dataType: col.type || 'string',
        }));
        header = columnDefs.rules.map((col) => {
            const item = col;
            if (col.id === 'status') {
                item.cell = renderRuleStatus;
            }
            return item;
        });
    }

    // Add row number
    const updatedData = data[type].map((row, index) => ({
        ...row,
        '#': index + 1,
    }));

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
