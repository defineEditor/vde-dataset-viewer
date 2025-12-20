export const modals = {
    GOTO: 'GOTO',
    DATASETINFO: 'DATASETINFO',
    FILTER: 'FILTER',
    APPUPDATE: 'APPUPDATE',
    EDITAPI: 'EDITAPI',
    ERROR: 'ERROR',
    VARIABLEINFO: 'VARIABLEINFO',
    MASK: 'MASK',
    VALIDATOR: 'VALIDATOR',
    SELECTCOMPARE: 'SELECTCOMPARE',
} as const;

export const paths = {
    SELECT: '/select',
    VIEWFILE: '/viewFile',
    API: '/api',
    SETTINGS: '/settings',
    ABOUT: '/about',
    CONVERTER: '/converter',
    VALIDATOR: '/validator',
    DEFINEXML: '/definexml',
    COMPARE: '/compare',
} as const;

export const mainTaskTypes = {
    CONVERT: 'convert',
    VALIDATE: 'validate',
} as const;

export type ModalType = (typeof modals)[keyof typeof modals];
export type AllowedPathnames = (typeof paths)[keyof typeof paths];
export type MainTaskType = (typeof mainTaskTypes)[keyof typeof mainTaskTypes];
