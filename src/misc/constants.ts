export const modals = {
    GOTO: 'GOTO',
    DATASETINFO: 'DATASETINFO',
    FILTER: 'FILTER',
    APPUPDATE: 'APPUPDATE',
    EDITAPI: 'EDITAPI',
    ERROR: 'ERROR',
} as const;

export const paths = {
    SELECT: '/select',
    VIEWFILE: '/viewFile',
    API: '/api',
    SETTINGS: '/settings',
    ABOUT: '/about',
    CONVERTER: '/converter',
} as const;

export type ModalType = (typeof modals)[keyof typeof modals];
export type AllowedPathnames = (typeof paths)[keyof typeof paths];
