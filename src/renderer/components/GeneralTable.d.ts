import { ItemDataArray } from 'interfaces/datasetJson';
import { DatasetJsonMetadata } from 'interfaces/api.d';

export type SortOrder = 'asc' | 'desc';
export type AlignType = 'left' | 'center' | 'right' | 'justify';
export type StyleObject = { [name: string]: string | number };
export type GeneralTableDataCellFormatter = ({
    id,
    row,
}: {
    id: string;
    row: IGeneralTableDataCell;
}) => JSX.Element;

export interface IGeneralTableDataCell {
    /** Property containing column value */
    [name: string]: string | number | boolean | StyleObject;
}

export interface IGeneralTableHeaderCell {
    /** Property containing column value */
    id: string;
    /** Column label */
    label: string;
    /** Column is hidden */
    hidden?: boolean;
    /** True for the id variable, required in case of selection */
    key?: boolean;
    /** Custom formatter for the column */
    formatter?: GeneralTableDataCellFormatter;
    /** Disable sorting for the column */
    disableSort?: boolean;
    /** Controls whether padding is enabled */
    disablePadding?: boolean;
    /** Align column: right, left, ... */
    align?: AlignType;
    /** Controls whether the column should be searchable */
    searchable?: boolean;
    /** Use that column as an order column, possible values: asc, desc */
    defaultOrder?: SortOrder;
    /** Style applied to the column */
    style?: StyleObject;
    /** Whether a filter is created for the column in the general toolbar */
    filter?: boolean;
}

export interface ISearchInTableProps {
    header: Array<IGeneralTableHeaderCell>;
    onSearchUpdate?: (text: string) => void;
    searchStyles?: {
        searchField?: {
            [name: string]:
                | string
                | number
                | { [name: string]: string | number };
        };
        inputField?: {
            [name: string]:
                | string
                | number
                | { [name: string]: string | number };
        };
        inputAdornment?: {
            [name: string]:
                | string
                | number
                | { [name: string]: string | number };
        };
    };
    width?: number;
    margin?: 'normal' | 'none' | 'dense';
    disabled?: boolean;
}

export interface ITableData {
    header: IGeneralTableHeaderCell[];
    metadata: DatasetJsonMetadata;
    data: ItemDataArray[];
}
