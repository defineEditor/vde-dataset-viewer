import stringToFilter from 'renderer/components/Modal/Filter/stringToFilter';
import { Filter } from 'interfaces/common';

describe('stringToFilter', () => {
    const colTypes: Record<string, 'string' | 'number' | 'boolean'> = {
        name: 'string',
        age: 'number',
        isactive: 'boolean',
    };

    it('should convert a valid filter string to a filter object', () => {
        const filterString = 'name = "John" and age > 30';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['and'],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle multiple values for "in" operator', () => {
        const filterString = 'age in (25, 30, 35)';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'age', operator: 'in', value: [25, 30, 35] },
            ],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle boolean values', () => {
        const filterString = 'isActive = True';
        const expectedFilter: Filter = {
            conditions: [{ variable: 'isActive', operator: 'eq', value: true }],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should return an empty filter object for an invalid filter string', () => {
        const filterString = 'invalid filter string';
        const expectedFilter: Filter = { conditions: [], connectors: [] };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "!=" operator', () => {
        const filterString = 'name != "John"';
        const expectedFilter: Filter = {
            conditions: [{ variable: 'name', operator: 'ne', value: 'John' }],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "<" operator', () => {
        const filterString = 'age < 30';
        const expectedFilter: Filter = {
            conditions: [{ variable: 'age', operator: 'lt', value: 30 }],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "<=" operator', () => {
        const filterString = 'age <= 30';
        const expectedFilter: Filter = {
            conditions: [{ variable: 'age', operator: 'le', value: 30 }],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle ">=" operator', () => {
        const filterString = 'age >= 30';
        const expectedFilter: Filter = {
            conditions: [{ variable: 'age', operator: 'ge', value: 30 }],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "notin" operator', () => {
        const filterString = 'age notin (25, 30, 35)';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'age', operator: 'notin', value: [25, 30, 35] },
            ],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "contains" operator', () => {
        const filterString = 'name ? "John"';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'name', operator: 'contains', value: 'John' },
            ],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "notcontains" operator', () => {
        const filterString = 'name !? "John"';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'name', operator: 'notcontains', value: 'John' },
            ],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "starts" operator', () => {
        const filterString = 'name =: "Jo"';
        const expectedFilter: Filter = {
            conditions: [{ variable: 'name', operator: 'starts', value: 'Jo' }],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "ends" operator', () => {
        const filterString = 'name := "hn"';
        const expectedFilter: Filter = {
            conditions: [{ variable: 'name', operator: 'ends', value: 'hn' }],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "regex" operator', () => {
        const filterString = 'name =~ "J.*n"';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'name', operator: 'regex', value: 'J.*n' },
            ],
            connectors: [],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "and" connector', () => {
        const filterString = 'name = "John" and age > 30';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['and'],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle "or" connector', () => {
        const filterString = 'name = "John" or age > 30';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['or'],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });

    it('should handle all operators and various connectors in one string', () => {
        const filterString =
            'name = "John" and age > 30 or age < 50 and isActive = True or name != "Doe" and age in (25, 30) or age notin (40, 45) and name ? "Jo" or name !? "hn" and name =: "Jo" or name := "hn" and name =~ "J.*n"';
        const expectedFilter: Filter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
                { variable: 'age', operator: 'lt', value: 50 },
                { variable: 'isActive', operator: 'eq', value: true },
                { variable: 'name', operator: 'ne', value: 'Doe' },
                { variable: 'age', operator: 'in', value: [25, 30] },
                { variable: 'age', operator: 'notin', value: [40, 45] },
                { variable: 'name', operator: 'contains', value: 'Jo' },
                { variable: 'name', operator: 'notcontains', value: 'hn' },
                { variable: 'name', operator: 'starts', value: 'Jo' },
                { variable: 'name', operator: 'ends', value: 'hn' },
                { variable: 'name', operator: 'regex', value: 'J.*n' },
            ],
            connectors: [
                'and',
                'or',
                'and',
                'or',
                'and',
                'or',
                'and',
                'or',
                'and',
                'or',
                'and',
            ],
        };
        expect(stringToFilter(filterString, colTypes)).toEqual(expectedFilter);
    });
});
