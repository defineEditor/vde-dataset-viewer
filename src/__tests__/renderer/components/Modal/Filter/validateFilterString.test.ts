import validateFilterString from 'renderer/components/Modal/Filter/validateFilterString';

describe('validateFilterString', () => {
    const columnNames = ['name', 'age', 'isActive', 'RACe'];
    const colTypes: Record<string, 'string' | 'number' | 'boolean'> = {
        name: 'string',
        age: 'number',
        isActive: 'boolean',
        RACe: 'string',
    };

    it('should return true for a valid filter string', () => {
        const filterString = 'name = "John" and age > 30';
        expect(validateFilterString(filterString, columnNames, colTypes)).toBe(
            true,
        );
    });

    it('should return false for an invalid filter string', () => {
        const filterString = 'name = "John" and age > "thirty"';
        expect(validateFilterString(filterString, columnNames, colTypes)).toBe(
            false,
        );
    });

    it('should return true for an empty filter string', () => {
        const filterString = '';
        expect(validateFilterString(filterString, columnNames, colTypes)).toBe(
            true,
        );
    });

    it('should return false for a filter string with an unknown column', () => {
        const filterString = 'unknown = "value"';
        expect(validateFilterString(filterString, columnNames, colTypes)).toBe(
            false,
        );
    });

    it('should return true for a valid filter string with IN clause', () => {
        const filterString = 'RACE in ("WHITE", "BLACKOR AFRICAN AMERICAN")';
        expect(validateFilterString(filterString, columnNames, colTypes)).toBe(
            true,
        );
    });
});
