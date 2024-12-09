import DatasetJson from 'js-stream-dataset-json';

export type DatasetJsonMetadata = Awaited<
    ReturnType<InstanceType<typeof DatasetJson>['getMetadata']>
>;
export type DatasetJsonData = Awaited<
    ReturnType<InstanceType<typeof DatasetJson>['getData']>
>;
