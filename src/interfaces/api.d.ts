import DatasetJson from 'js-stream-dataset-json';
import { InputFileExtension } from 'interfaces/main';

export type DatasetJsonMetadata = Awaited<
    ReturnType<InstanceType<typeof DatasetJson>['getMetadata']>
>;
export type DatasetJsonData = Awaited<
    ReturnType<InstanceType<typeof DatasetJson>['getData']>
>;

export {
    BasicFilter,
    Connector,
    FilterCondition,
    ColumnMetadata,
} from 'js-array-filter';

export type DatasetType = 'json' | 'xpt' | 'sas7bdat';
export type DatasetMode = 'local' | 'remote';

export interface ApiOpenedFile {
    fileId: string;
    name: string;
    mode: DatasetMode;
    path: string;
    type: DatasetType;
    lastModified?: number;
}

export interface ApiOpenedFileWithMetadata extends ApiOpenedFile {
    nCols: number;
    label: string;
    records: number;
    lastModified: number;
}

export interface IOpenFile {
    fileId: string;
    type: DatasetType;
    path: string;
    lastModified: number;
    datasetNames?: string[];
    errorMessage?: string;
}

export interface IOpenFileWithMetadata extends IOpenFile {
    metadata: DatasetJsonMetadata;
}

export interface IApiStudyDataset {
    itemGroupOID: string;
    name: string;
    label: string;
    standard: string;
    records: number;
    href: string;
    datasetJSONCreationDateTime: string;
    filename: string;
}

export interface IApiStudy {
    studyOID: string;
    name: string;
    label: string;
    standards: string[];
    href: string;
    path: string;
    studyCreationDateTime: string;
    datasets?: IApiStudyDataset[];
}

export interface IApiAbout {
    lastUpdated: string;
    author: string;
    repo: string;
    links: {
        name: string;
        href: string;
    }[];
}

export interface IFetchResponse {
    status: number;
    response: Record<string, unknown>;
    errorMessage: string | null;
}

export interface ValidationTaskFile {
    filePath: string;
    fileName: string;
    extension: InputFileExtension;
}
