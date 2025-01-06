const filterRegex = {
    variable: /\w+/,
    variableParse: /(\w+)/,
    itemString: /["][^"]*?["]|['][^']*?[']|null/,
    itemNumber: /[^'",][^,\s]*|null/,
    itemBoolean: /True|False|null/,
    item: / /,
    itemParse: / /,
    itemMultiple: / /,
    itemMultipleParse: / /,
    comparatorBoolean: /(?:=|!=)/,
    comparatorNumeric: /(?:=|!=|<=|>=|<|>)/,
    comparatorString: /(?:!=|<=|>=|<|>|\?|!\?|=:|:=|=~|=)/,
    comparatorSingle: /(?:!=|<=|>=|<|>|\?|!\?|=:|:=|=~|=)/,
    comparatorSingleParse: /((?:!=|<=|>=|<|>|\?|!\?|=:|:=|=~|=))/,
    comparatorMultiple: /(?:in|notin)/,
    comparatorMultipleParse: /(in|notin)/,
    condition: / /,
    conditionExtract: / /,
    conditionParse: / /,
    conditionConnector: /(?:and|or)/,
    filter: / /,
};

filterRegex.item = new RegExp(
    `(?:${filterRegex.itemString.source}|${filterRegex.itemNumber.source}|${filterRegex.itemBoolean.source})`,
    'i',
);

filterRegex.itemParse = new RegExp(`(${filterRegex.item.source})`, 'i');

filterRegex.itemMultiple = new RegExp(
    `\\(\\s*${filterRegex.item.source}\\s*(?:,\\s*${filterRegex.item.source})*\\s*\\)`,
    'i',
);

filterRegex.itemMultipleParse = new RegExp(
    `(${filterRegex.itemMultiple.source})`,
    'i',
);

filterRegex.condition = new RegExp(
    `${filterRegex.variable.source}\\s*(?:${
        filterRegex.comparatorSingle.source
    }\\s*${
        filterRegex.item.source
    }|${filterRegex.comparatorMultiple.source}\\s+${
        filterRegex.itemMultiple.source
    })`,
    'i',
);

filterRegex.conditionExtract = new RegExp(
    `(${filterRegex.condition.source})`,
    'i',
);

filterRegex.conditionParse = new RegExp(
    `${filterRegex.variableParse.source}\\s*(?:${
        filterRegex.comparatorSingleParse.source
    }\\s*${
        filterRegex.itemParse.source
    }|${filterRegex.comparatorMultipleParse.source}\\s+${
        filterRegex.itemMultipleParse.source
    })`,
    'i',
);

filterRegex.filter = new RegExp(
    `^(${filterRegex.condition.source})((?:\\s+${filterRegex.conditionConnector.source}\\s+${filterRegex.condition.source}))*$`,
    'i',
);

export default filterRegex;
