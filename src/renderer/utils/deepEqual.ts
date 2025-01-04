/* eslint-disable @typescript-eslint/no-explicit-any */
// Deep compare two objects
const deepEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) {
        return true;
    }

    if (
        typeof obj1 !== 'object' ||
        obj1 === null ||
        typeof obj2 !== 'object' ||
        obj2 === null
    ) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    if (
        !keys1.every(
            (key) => keys2.includes(key) && deepEqual(obj1[key], obj2[key]),
        )
    ) {
        return false;
    }

    return true;
};

export default deepEqual;
