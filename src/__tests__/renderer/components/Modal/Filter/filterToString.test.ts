import filterToString from 'renderer/components/Modal/Filter/filterToString';
import { Filter } from 'interfaces/common';

describe('filterToString', () => {
    it('should convert a filter object to a filter string', () => {
        const filter: Filter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['and'],
        };
        const expectedString = 'name = "John" and age > 30';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle multiple values for "in" operator', () => {
        const filter: Filter = {
            conditions: [
                { variable: 'age', operator: 'in', value: [25, 30, 35] },
            ],
            connectors: [],
        };
        const expectedString = 'age in (25, 30, 35)';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle boolean values', () => {
        const filter: Filter = {
            conditions: [{ variable: 'isActive', operator: 'eq', value: true }],
            connectors: [],
        };
        const expectedString = 'isActive = true';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should return an empty string for an empty filter object', () => {
        const filter: Filter = { conditions: [], connectors: [] };
        const expectedString = '';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "!=" operator', () => {
        const filter: Filter = {
            conditions: [{ variable: 'name', operator: 'ne', value: 'John' }],
            connectors: [],
        };
        const expectedString = 'name != "John"';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "<" operator', () => {
        const filter: Filter = {
            conditions: [{ variable: 'age', operator: 'lt', value: 30 }],
            connectors: [],
        };
        const expectedString = 'age < 30';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "<=" operator', () => {
        const filter: Filter = {
            conditions: [{ variable: 'age', operator: 'le', value: 30 }],
            connectors: [],
        };
        const expectedString = 'age <= 30';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle ">=" operator', () => {
        const filter: Filter = {
            conditions: [{ variable: 'age', operator: 'ge', value: 30 }],
            connectors: [],
        };
        const expectedString = 'age >= 30';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "notin" operator', () => {
        const filter: Filter = {
            conditions: [
                { variable: 'age', operator: 'notin', value: [25, 30, 35] },
            ],
            connectors: [],
        };
        const expectedString = 'age notin (25, 30, 35)';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "contains" operator', () => {
        const filter: Filter = {
            conditions: [
                { variable: 'name', operator: 'contains', value: 'John' },
            ],
            connectors: [],
        };
        const expectedString = 'name ? "John"';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "notcontains" operator', () => {
        const filter: Filter = {
            conditions: [
                { variable: 'name', operator: 'notcontains', value: 'John' },
            ],
            connectors: [],
        };
        const expectedString = 'name !? "John"';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "starts" operator', () => {
        const filter: Filter = {
            conditions: [{ variable: 'name', operator: 'starts', value: 'Jo' }],
            connectors: [],
        };
        const expectedString = 'name =: "Jo"';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "ends" operator', () => {
        const filter: Filter = {
            conditions: [{ variable: 'name', operator: 'ends', value: 'hn' }],
            connectors: [],
        };
        const expectedString = 'name := "hn"';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "regex" operator', () => {
        const filter: Filter = {
            conditions: [
                { variable: 'name', operator: 'regex', value: 'J.*n' },
            ],
            connectors: [],
        };
        const expectedString = 'name =~ "J.*n"';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "and" connector', () => {
        const filter: Filter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['and'],
        };
        const expectedString = 'name = "John" and age > 30';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle "or" connector', () => {
        const filter: Filter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['or'],
        };
        const expectedString = 'name = "John" or age > 30';
        expect(filterToString(filter)).toBe(expectedString);
    });

    it('should handle all operators and various connectors in one string', () => {
        const filter: Filter = {
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
        const expectedString =
            'name = "John" and age > 30 or age < 50 and isActive = true or name != "Doe" and age in (25, 30) or age notin (40, 45) and name ? "Jo" or name !? "hn" and name =: "Jo" or name := "hn" and name =~ "J.*n"';
        expect(filterToString(filter)).toBe(expectedString);
    });
});
