import DatasetJson from 'js-stream-dataset-json';

export type DatasetJsonMetadata = Awaited<
    ReturnType<InstanceType<typeof DatasetJson>['getMetadata']>
>;
export type DatasetJsonData = Awaited<
    ReturnType<InstanceType<typeof DatasetJson>['getData']>
>;

export { Filter, Connector, FilterCondition } from 'js-stream-dataset-json';

export type DatasetType = 'json' | 'xpt';

export interface IOpenFile {
    fileId: string;
    type: DatasetType;
    path: string;
    datasetNames?: string[];
    errorMessage?: string;
}

export interface IOpenFileWithMetadata extends IOpenFile {
    metadata: DatasetJsonMetadata;
}
