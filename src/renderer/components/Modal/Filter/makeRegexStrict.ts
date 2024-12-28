// A function to surround regex with ^$ for matching the whole line
const makeRegexStrict = (regex: RegExp): RegExp => {
    const { source } = regex;
    return new RegExp(`^${source}$`, regex.flags);
};

export default makeRegexStrict;
