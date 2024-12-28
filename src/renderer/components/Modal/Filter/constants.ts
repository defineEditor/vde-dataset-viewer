export const operatorLabels = {
    '=': 'eq',
    '!=': 'ne',
    '<': 'lt',
    '<=': 'le',
    '>': 'gt',
    '>=': 'ge',
    in: 'in',
    notin: 'notin',
    '?': 'contains',
    '!?': 'notcontains',
    '=:': 'starts',
    ':=': 'ends',
    '=~': 'regex',
};

export const operatorLabelsInverse = Object.fromEntries(
    Object.entries(operatorLabels).map(([key, value]) => [value, key]),
);
