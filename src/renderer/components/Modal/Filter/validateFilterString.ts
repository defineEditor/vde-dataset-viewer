import filterRegex from 'renderer/components/Modal/Filter/filterRegex';
import makeRegexStrict from 'renderer/components/Modal/Filter/makeRegexStrict';

// Validate filter string
const validateFilterString = (
    filterStringRaw: string,
    columnNames: string[],
    colTypes: { [name: string]: 'string' | 'number' | 'boolean' },
) => {
    try {
        // Trim leading and trailing spaces;
        const filterString = filterStringRaw.trim();
        // Quick checks
        if (filterString === '') {
            return true;
        }
        if (filterRegex.filter.test(filterString) === false) {
            return false;
        }
        const result: boolean[] = [];
        // Detailed check: check that proper variables are specified
        const rawFilter = filterRegex.filter.exec(filterString);
        if (rawFilter === null) {
            return false;
        }
        // Remove all undefined conditions (coming from (AND condition) part) and connectors
        const rawFilterUpdated = rawFilter.filter(
            (element) =>
                element !== undefined &&
                makeRegexStrict(filterRegex.conditionConnector).test(
                    element,
                ) === false,
        );
        // If there is more than one condition, extract them one by one;
        const rawConditionChecks: string[] = [];
        if (rawFilterUpdated.length >= 3) {
            let rawConditions = filterString;
            let rawConditionCheck =
                filterRegex.conditionExtract.exec(rawConditions);
            const nextConditionCheckRegex = new RegExp(
                `${filterRegex.condition.source}${filterRegex.conditionConnector.source}?(.*)$`,
                'i',
            );
            while (rawConditionCheck !== null) {
                rawConditionChecks.push(rawConditionCheck[1]);
                rawConditions = rawConditions.replace(
                    nextConditionCheckRegex,
                    '$1',
                );
                rawConditionCheck =
                    filterRegex.conditionExtract.exec(rawConditions);
            }
        } else {
            // Only 1 condition is provided;
            rawConditionChecks.push(rawFilterUpdated[1]);
        }
        // Extract variable names
        rawConditionChecks.forEach((rawConditionCheck, index) => {
            // Default to failed
            result[index] = false;
            let conditionElements = (
                filterRegex.conditionParse.exec(rawConditionCheck) as string[]
            ).slice(1);
            // Remove all undefined elements (come from the (in|notin) vs (eq,ne,...) fork)
            conditionElements = conditionElements.filter(
                (element) => element !== undefined,
            );
            const columnName = conditionElements[0].toLowerCase();
            const comparator = conditionElements[1].toLowerCase();
            const value = conditionElements[2];

            if (
                columnNames
                    .map((name) => name.toLowerCase())
                    .includes(columnName)
            ) {
                // Get type of the variable
                const type = colTypes[columnName];
                if (type === 'number') {
                    if (
                        makeRegexStrict(filterRegex.comparatorNumeric).test(
                            comparator,
                        ) &&
                        (!Number.isNaN(Number(value)) || value === 'null')
                    ) {
                        result[index] = true;
                    } else if (
                        makeRegexStrict(filterRegex.comparatorMultiple).test(
                            comparator,
                        ) &&
                        makeRegexStrict(filterRegex.itemMultiple).test(value)
                    ) {
                        result[index] = true;
                    }
                } else if (type === 'string') {
                    if (
                        makeRegexStrict(filterRegex.comparatorString).test(
                            comparator,
                        ) &&
                        makeRegexStrict(filterRegex.itemString).test(value)
                    ) {
                        result[index] = true;
                    } else if (
                        makeRegexStrict(filterRegex.comparatorMultiple).test(
                            comparator,
                        ) &&
                        makeRegexStrict(filterRegex.itemMultiple).test(value)
                    ) {
                        result[index] = true;
                    }
                } else if (type === 'boolean') {
                    if (
                        makeRegexStrict(filterRegex.comparatorBoolean).test(
                            comparator,
                        ) &&
                        makeRegexStrict(filterRegex.itemBoolean).test(value)
                    ) {
                        result[index] = true;
                    }
                }
            }
        });
        // Return true only if all results are true;
        return result.reduce((acc, value) => acc && value, true);
    } catch (error) {
        return false;
    }
};

export default validateFilterString;
