// Constants for epoch conversion
// SAS epoch is January 1, 1960
// Unix epoch is January 1, 1970
const SECONDS_PER_DAY = 86400;
const MILLISECONDS_PER_DAY = SECONDS_PER_DAY * 1000;
const DAYS_BETWEEN_EPOCHS = 3653; // Days between 1960-01-01 and 1970-01-01 (10 years + 2 leap days)

// Convert SAS date (days since 1960-01-01) to JavaScript Date
export const sasDateToJsDate = (sasDate: number): Date => {
    // Convert SAS date (days since 1960-01-01) to days since Unix epoch (1970-01-01)
    const unixDays = sasDate - DAYS_BETWEEN_EPOCHS;
    // Convert days to milliseconds and create a JavaScript Date
    return new Date(unixDays * MILLISECONDS_PER_DAY);
};

// Convert JavaScript Date to SAS date (days since 1960-01-01)
export const jsDateToSasDate = (jsDate: Date): number => {
    // Convert milliseconds since Unix epoch to days since SAS epoch
    return (
        Math.floor(jsDate.getTime() / MILLISECONDS_PER_DAY) +
        DAYS_BETWEEN_EPOCHS
    );
};

// Convert SAS time (seconds since midnight) to JavaScript Date components
export const sasTimeToComponents = (
    sasTime: number,
): { hours: string; minutes: string; seconds: string } => {
    const totalSeconds = Math.round(sasTime);
    const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, '0');
    return { hours, minutes, seconds };
};

// Convert time components to SAS time (seconds since midnight)
export const componentsToSasTime = (
    hours: number | string,
    minutes: number | string,
    seconds: number | string,
): number => {
    const hoursNum = typeof hours === 'string' ? parseInt(hours, 10) : hours;
    const minutesNum =
        typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;
    const secondsNum =
        typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;

    return hoursNum * 3600 + minutesNum * 60 + secondsNum;
};

// Convert SAS datetime (seconds since 1960-01-01) to JavaScript Date
export const sasDatetimeToJsDate = (sasDatetime: number): Date => {
    // Convert SAS datetime (seconds since 1960-01-01) to milliseconds since Unix epoch
    const unixMilliseconds =
        (sasDatetime - DAYS_BETWEEN_EPOCHS * SECONDS_PER_DAY) * 1000;
    return new Date(unixMilliseconds);
};

// Convert JavaScript Date to SAS datetime (seconds since 1960-01-01)
export const jsDateToSasDatetime = (jsDate: Date): number => {
    // Convert milliseconds since Unix epoch to seconds since SAS epoch
    return jsDate.getTime() / 1000 + DAYS_BETWEEN_EPOCHS * SECONDS_PER_DAY;
};

export const formatDateToDDMONYYYY = (
    date: Date,
    addTime?: boolean,
): string => {
    const day = date.getUTCDate().toString().padStart(2, '0');
    const monthNames = [
        'JAN',
        'FEB',
        'MAR',
        'APR',
        'MAY',
        'JUN',
        'JUL',
        'AUG',
        'SEP',
        'OCT',
        'NOV',
        'DEC',
    ];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear().toString();
    if (addTime) {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${day}${month}${year} ${hours}:${minutes}:${seconds}`;
    }
    return `${day}${month}${year}`;
};

export const formatDDMONYYYYtoDate = (dateStr: string): Date => {
    // Check if string has time component
    const hasTime = dateStr.includes(' ');

    let datePart = dateStr;
    let timePart = '';

    if (hasTime) {
        [datePart, timePart] = dateStr.split(' ');
    }

    const day = parseInt(datePart.substring(0, 2), 10);
    const monthStr = datePart.substring(2, 5).toUpperCase();
    const year = parseInt(datePart.substring(5, 9), 10);

    const monthMap: { [key: string]: number } = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MAY: 4,
        JUN: 5,
        JUL: 6,
        AUG: 7,
        SEP: 8,
        OCT: 9,
        NOV: 10,
        DEC: 11,
    };

    const month = monthMap[monthStr];

    const date = new Date(year, month, day);

    // Handle time if present
    if (hasTime && timePart) {
        const tempDate = new Date(`2000-01-01T${timePart}Z`);
        date.setUTCHours(tempDate.getUTCHours());
        date.setUTCMinutes(tempDate.getUTCMinutes());
        date.setUTCSeconds(tempDate.getUTCSeconds());
    }

    return date;
};
