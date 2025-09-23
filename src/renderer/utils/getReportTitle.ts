import { ValidationReport } from 'interfaces/common';

const getTimeAgo = (date: number): string => {
    const now = new Date();
    const reportDate = new Date(date);
    const diffMs = now.getTime() - reportDate.getTime();

    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 31; // Average month length
    const year = day * 366; // Average year length with leap years

    if (diffMs < minute) {
        return 'just now';
    }
    if (diffMs < hour) {
        const minutes = Math.floor(diffMs / minute);
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    if (diffMs < day) {
        const hours = Math.floor(diffMs / hour);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    if (diffMs < week) {
        const days = Math.floor(diffMs / day);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    if (diffMs < month) {
        const weeks = Math.floor(diffMs / week);
        return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }
    if (diffMs < year) {
        const months = Math.floor(diffMs / month);
        return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.floor(diffMs / year);
    return `${years} year${years === 1 ? '' : 's'} ago`;
};

const getReportTitle = (report: ValidationReport): string => {
    const date = new Date(report.date);
    const reportDate =
        `${date.getFullYear()}` +
        `-${String(date.getMonth() + 1).padStart(2, '0')}` +
        `-${String(date.getDate()).padStart(2, '0')}` +
        ` ${String(date.getHours()).padStart(2, '0')}:` +
        `${String(date.getMinutes()).padStart(2, '0')}:` +
        `${String(date.getSeconds()).padStart(2, '0')}`;

    // Use first 5 dataset names and add (+ X more) if applicable
    const datasetNames = report.files
        ? report.files
              .slice(0, 5)
              .map((file) =>
                  file.file
                      .replace(/.*(?:\/|\\)(.*)\.\w+$/, '$1')
                      .toUpperCase(),
              )
              .join(', ')
        : '';
    const additionalCount =
        report.files && report.files.length > 5
            ? ` (+${report.files.length - 5} more)`
            : '';

    const reportTitle =
        `${datasetNames}${additionalCount || ''} ` +
            `${reportDate} (${getTimeAgo(report.date)} ago)` ||
        'Validation Report';
    return reportTitle;
};

export default getReportTitle;
