export interface HelpContentEntry {
    title: string;
    content: string;
}

export const HELP_CONTENT = {
    COMMANDLINE: {
        title: 'Command Line',
        content: `
#### About
Use the command line to update IDs, sorting, visible columns, filters, and navigation without leaving the keyboard.

#### Commands
- **id [selectors]** sets the ID columns.
- **idadd | ia [selectors]** adds columns to the current ID columns.
- **idrm [selectors]** removes columns from the current ID columns.
- **sort [selector] [asc|desc] ...** sets sorting. Ascending is the default if not specified.
- **sortadd | soa [selector] [asc|desc] ...** appends sorting columns.
- **sortrm [selector] ...** removes columns from the current sorting.
- **show [selectors]** shows only the selected columns.
- **showadd | sha [selectors]** adds columns to the current visible set.
- **hide [selectors]** hides the columns.
- **hideadd | ha [selectors]** removes additional columns from the current visible set.
- **info | i [column]** opens information for the specified column.
- **filter | f [expression]** replaces the current filter.
- **filteradd | fa [expression]** appends a filter with AND.
- **go [row] | [column] | [row:column] | [column:row]** go to a specific row, column, or cell.
- **reset | r** clears masks, filters, ID columns, and sorting.

#### Selectors
- Exact column names select a single column.
- **/regex/** selects every matching column, for example **/TRT/** will select all columns that contain "TRT".
- **COLUMN+** selects COLUMN and everything to its right.
- **COLUMN-** selects the first column through COLUMN.

#### Examples
~~~text
id USUBJID
idadd VISIT AVISITN
sort AVISITN asc AVAL desc
show USUBJID TRT01A /^A/
filter PARAMCD = "ALT" and AVAL > 3
id USUBJID /PARAM/; show AVAL AVALC; sort PARAMN AVAL desc
~~~

### Additional Notes
Multiple commands can be chained with a semicolon.
        `.trim(),
    },
    FILTER: {
        title: 'Filter Data',
        content: `
#### About
Allows to filter data based on column values, and supports both interactive and manual input modes.

#### Input Modes
- **Interactive** mode builds filters condition by condition.
- **Manual** mode lets you write the full expression yourself. Supports autocompletion.
- Switching between different modes requires a valid filter expression.

#### Available Operations [Column Types]
- Equal (=) [**String, Numeric, Boolean**]
- Not Equal (!=) [**String, Numeric, Boolean**]
- Less Than (<) [**Numeric, String**]
- Less Than or Equal (<=) [**Numeric, String**]
- Greater Than (>) [**Numeric, String**]
- Greater Than or Equal (>=) [**Numeric, String**]
- In (in) [**String, Numeric**]
- Not In (not in) [**String, Numeric**]
- Missing (missing) [**String, Numeric, Boolean**]
- Not Missing (not missing) [**String, Numeric, Boolean**]
- Contains (?) [**String**]
- Not Contains (!?) [**String**]
- Starts With (=:) [**String**]
- Ends With (:=) [**String**]
- Regex (=~) [**String**]


#### Possibilities
- **Case Insensitive** option applies case-insensitive matching to text comparisons, including regex.
- Values can be compared with another column of the same type instead of a literal value.
- In interactive mode, the value picker suggests unique values for the selected column.
- When the value list shows the prompt to load more values, press Tab to fetch all available suggestions (up to 1000 values).
- Regular expressions use JavaScript regex syntax.

#### Manual Mode Notes
- String and regex values must be quoted.
- Column-to-column comparisons use the other column name as the value (tagged with 'col').
- Combine conditions with **and** and **or**.
- Use parentheses to control evaluation order.

#### Examples
~~~text
USUBJID = "01-701-1015"
AVAL > BASE
TRT01A in ("Placebo", "Drug A")
VISIT =~ "SCREEN|BASELINE"
(PARAMCD = "ALT" or PARCAT = "HEM") and AVAL > 3
missing(DTHDT)
~~~
        `.trim(),
    },
    IDCOLUMNS: {
        title: 'ID Columns',
        content: `
#### About
ID Columns allow you to pin columns to the left.

#### Possibilities
- Save frequently used ID column sets for quick reuse.
- Use Ctrl+<X> to select previously saved column sets.

#### Additional Notes
- ID columns stay visible even when a column visibility mask would otherwise hide them.
        `.trim(),
    },
    MASK: {
        title: 'Column Visibility',
        content: `
#### About
Column Visibility controls which columns are shown in the current view.

#### Possibilities
- Save named column sets for quick reuse.
- Enable **Sticky** if the same visible-column set should remain active when you switch datasets.
- Use Ctrl+<X> to select previously saved column sets.

#### Additional Notes
ID columns remain visible even if they are not included in the selected mask.
        `.trim(),
    },
    SORTING: {
        title: 'Sorting',
        content: `
#### About
Sorting lets you choose one or more columns that determine the order of rows in the current table view.

#### Possibilities
- Add multiple columns to create a sorting priority.
- Toggle each selected column between ascending and descending.

#### Important Note
Sorting is applied only to the currently shown page of data.

![video](/help/sortingOrder.mp4)
        `.trim(),
    },
    GOTO: {
        title: 'Go To',
        content: `
#### About
Go to a specific row, column, or cell in the current dataset.


#### Supported Inputs
- Row number.
- Column name.
- Enter **COLUMN:ROW** to jump to a specific cell.

#### Examples
~~~text
123
AVAL
AVAL:123
~~~

#### Additional Notes
When filter is enabled, you cannot navigate beyond the current page.
        `.trim(),
    },
    SELECTCOMPARE: {
        title: 'Select Files for Comparison',
        content: `
#### About
This modal starts a dataset-to-dataset comparison by selecting the base file and the file to compare against it.

#### Possibilities
- **Base File** defines the reference side of the comparison.
- **Compare File** is checked against the base file.
- **Switch** swaps base and compare files.
- **Ignore White Spaces** ignores leading and trailing spaces during comparison.
- **Case Insensitive** ignores value letter case during comparison.
- **Recent Compares** shows the history of comparisons.
- Use Ctrl+<X> to select previously compared files.

#### Additional Notes
Compare is initiated in the background. You can continue working while the comparison is running.
Once the comparison is complete, you will be notified and the result will be available in **Compare** section.

        `.trim(),
    },
    VALIDATOR: {
        title: 'Data Validation',
        content: `
#### About
Data Validation runs the configured validator against the current dataset and lets you review the generated results.

#### Main Options
- **Standard** and **Version** choose the validation rule set. It is defined by the validator package.
- **CT Packages** add controlled terminology packages to the validation run against.
- **Define-XML** optionally links a Define-XML file for metadata-aware validation.
- **Options** opens validator switches:
  - **Use Custom Standard** Use a custom standard (uploaded to cache via update-cache in CDISC CORE).
  - **Validate XML** XML validation toggle (see CDISC CORE validate documentation).

#### Additional Options
- The **Dictionaries** section lets you provide WHODrug, MedDRA, LOINC, Med-RT, and UNII folders when they are relevant to the rule set.

#### Tabs
- **Validation** configures and runs the validation.
- **Results** shows saved validation reports for the current file.
- **Issues** lets you focus the viewer on the rows and columns referenced by report issues.

#### Additional Notes
Validation is initiated in the background. You can continue working while the validation is running.
        `.trim(),
    },
} satisfies Record<string, HelpContentEntry>;

export type HelpModalId = keyof typeof HELP_CONTENT;
