import { AllowedPathnames } from 'interfaces/store';

export const modals = {
    GOTO: 'GOTO',
    DATASETINFO: 'DATASETINFO',
    FILTER: 'FILTER',
    APPUPDATE: 'APPUPDATE',
};

export const paths: { [name: string]: AllowedPathnames } = {
    SELECT: '/select',
    VIEWFILE: '/viewFile',
    API: '/api',
    SETTINGS: '/settings',
    ABOUT: '/about',
    CONVERTER: '/converter',
};
