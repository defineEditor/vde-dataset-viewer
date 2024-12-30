const getFolderName = (filePath: string): string => {
    // Normalize the path to handle both forward and backward slashes
    let isWindows = true;
    if (window?.electron) {
        isWindows = window.electron?.isWindows;
    } else if (process !== undefined) {
        isWindows = process?.platform === 'win32';
    }
    const delimiter = isWindows ? '\\' : '/';
    const parts = filePath.split(delimiter);

    // Remove the filename
    parts.pop();

    let folderPath = '';
    // Determine the platform and return the appropriate path format
    if (isWindows) {
        folderPath = parts.join('\\');
    } else {
        folderPath = parts.join('/');
    }
    return folderPath;
};

export default getFolderName;
