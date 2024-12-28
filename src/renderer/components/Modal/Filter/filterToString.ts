import { Filter } from 'interfaces/common';
import { operatorLabelsInverse } from 'renderer/components/Modal/Filter/constants';

// Convert a filter object to a string
const filterToString = (filter: Filter): string => {
    const { conditions, connectors } = filter;
    let filterString = '';

    conditions.forEach((condition, index) => {
        const { variable, operator, value } = condition;
        let valueString = '';

        if (Array.isArray(value)) {
            valueString = `(${value.join(', ')})`;
        } else if (typeof value === 'string') {
            valueString = `"${value}"`;
        } else {
            valueString = String(value);
        }

        let comparator = 'eq';
        if (
            Object.prototype.hasOwnProperty.call(
                operatorLabelsInverse,
                operator,
            )
        ) {
            comparator = operatorLabelsInverse[operator];
        }

        filterString += `${variable} ${comparator} ${valueString}`;

        if (index < connectors.length) {
            filterString += ` ${connectors[index]} `;
        }
    });

    return filterString.trim();
};

export default filterToString;
