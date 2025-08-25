import { DatasetJsonMetadata } from 'interfaces/api.d';
import { SettingsViewer } from 'interfaces/store.d';
import { ItemType } from 'interfaces/datasetJson.d';
import { BasicFilter } from 'js-array-filter';

export type SortOrder = 'asc' | 'desc';
export type AlignType = 'left' | 'center' | 'right' | 'justify';
export type StyleObject = { [name: string]: string | number };

export interface IHeaderCell {
    /** Property containing column value */
    id: string;
    /** Column label */
    label: string;
    /** Column is hidden */
    hidden?: boolean;
    /** True for the id variable, required in case of selection */
    key?: boolean;
    /** Custom formatter for the column */
    /** Disable sorting for the column */
    disableSort?: boolean;
    /** Align column: right, left, ... */
    align?: AlignType;
    /** Controls whether the column should be searchable */
    searchable?: boolean;
    /** Use that column as an order column, possible values: asc, desc */
    defaultOrder?: SortOrder;
    /** Size in px */
    size?: number;
    /** Type */
    type?: ItemType;
    /** Filter is applied to the column */
    isFiltered?: boolean;
    /** Numeric variable with datetime format */
    numericDatetimeType?: 'date' | 'time' | 'datetime';
    /** Cell render */
    cell?: (cell: any) => React.JSX.Element;
}

export type TableRowValue = string | number | boolean | null;

export interface ITableRow {
    [key: string]: TableRowValue;
}

export interface ITableData {
    header: IHeaderCell[];
    metadata: DatasetJsonMetadata;
    data: ITableRow[];
    appliedFilter: BasicFilter | null;
    fileId: string;
}

export interface TableSettings extends SettingsViewer {
    hideRowNumbers?: boolean;
    showLabel?: boolean;
    height?: number;
}
