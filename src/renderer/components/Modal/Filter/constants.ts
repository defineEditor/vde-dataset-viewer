import { FilterCondition } from 'js-stream-dataset-json';

type OperatorLabels = {
    [key in FilterCondition['operator']]: string;
};

export const operatorLabels: OperatorLabels = {
    eq: '=',
    ne: '!=',
    lt: '<',
    le: '<=',
    gt: '>',
    ge: '>=',
    in: 'in',
    notin: 'notin',
    contains: '?',
    notcontains: '!?',
    starts: '=:',
    ends: ':=',
    regex: '=~',
};

export const operatorHumanFriendlyLabels: OperatorLabels = {
    eq: '=',
    ne: '!=',
    lt: '<',
    le: '<=',
    gt: '>',
    ge: '>=',
    in: 'in',
    notin: 'not in',
    contains: 'contains',
    notcontains: 'not contains',
    starts: 'starts with',
    ends: 'ends with',
    regex: 'regex',
};

export const stringOperators = Object.keys(operatorLabels);

export const numberOperators = [
    'eq',
    'ne',
    'lt',
    'le',
    'gt',
    'ge',
    'in',
    'notin',
];
export const booleanOperators = ['eq', 'ne'];

export const operatorLabelsInverse: {
    [name: string]: FilterCondition['operator'];
} = Object.fromEntries(
    Object.entries(operatorLabels).map(([key, value]) => [
        value,
        key as FilterCondition['operator'],
    ]),
);
