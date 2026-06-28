# 0.7.0
### Improvements
* Add color themes and dark mode [#124](https://github.com/defineEditor/vde-dataset-viewer/issues/124)
* Add compact mode [#142](https://github.com/defineEditor/vde-dataset-viewer/issues/142)
* Add command line [#125](https://github.com/defineEditor/vde-dataset-viewer/issues/125)
* Add ID column [#106](https://github.com/defineEditor/vde-dataset-viewer/issues/106)
* Add autocomplete in filter and commands [#127](https://github.com/defineEditor/vde-dataset-viewer/issues/127)
* Show labels instead of variable names [#119](https://github.com/defineEditor/vde-dataset-viewer/issues/119)
* Add better sorting capabilities [#116](https://github.com/defineEditor/vde-dataset-viewer/issues/116)
* Auto-reload functionality [#123](https://github.com/defineEditor/vde-dataset-viewer/issues/123)
* Add initial support for Stata (DTA) and SPSS (SAV, ZSAV, POR) [#163](https://github.com/defineEditor/vde-dataset-viewer/issues/163)
* Optimize table rendering performance by using GPU [#159](https://github.com/defineEditor/vde-dataset-viewer/issues/159)
* Show number of rows for all tables [#158](https://github.com/defineEditor/vde-dataset-viewer/issues/158)
* Add developer modal [#156](https://github.com/defineEditor/vde-dataset-viewer/issues/156)
* Add ability to create lock files for open files [#152](https://github.com/defineEditor/vde-dataset-viewer/issues/152)
* Allow showing all values inside value selection popup in interactive filter [#145](https://github.com/defineEditor/vde-dataset-viewer/issues/145)
* Add ability to add negative filter from the right click menu [#144](https://github.com/defineEditor/vde-dataset-viewer/issues/144)
* Update shortcuts [#138](https://github.com/defineEditor/vde-dataset-viewer/issues/138)
* Add ability to disable GPU by --disable-gpu flag [#139](https://github.com/defineEditor/vde-dataset-viewer/issues/139)
* Add basic commands [#126](https://github.com/defineEditor/vde-dataset-viewer/issues/126)
* Update CSV setting description [#122](https://github.com/defineEditor/vde-dataset-viewer/issues/122)
* Add ability to close all opened datasets [#113](https://github.com/defineEditor/vde-dataset-viewer/issues/113)

### Fixes
* Pagination control can become hidden [#170](https://github.com/defineEditor/vde-dataset-viewer/issues/170)
* Cell context filter does not use case sensitivity [#165](https://github.com/defineEditor/vde-dataset-viewer/issues/165)
* Transparent row number background [#160](https://github.com/defineEditor/vde-dataset-viewer/issues/160)
* Adding condition via cell context may result in incorrect filter [#150](https://github.com/defineEditor/vde-dataset-viewer/issues/150)
* Going to line on a page further than 1st when filter is applied [#148](https://github.com/defineEditor/vde-dataset-viewer/issues/148)
* Interactive filter issues [#143](https://github.com/defineEditor/vde-dataset-viewer/issues/143)
* Keep columns visible when switching between datasets [#141](https://github.com/defineEditor/vde-dataset-viewer/issues/141)
* Cell context menu filtering selects incorrect value when sorting was used before [#112](https://github.com/defineEditor/vde-dataset-viewer/issues/112)

## Technical Changes
* Update Electron version [#135](https://github.com/defineEditor/vde-dataset-viewer/issues/135)
* Replace Toolpad with MUI components [#133](https://github.com/defineEditor/vde-dataset-viewer/issues/133)
* Upgrade to MUI 9 [#132](https://github.com/defineEditor/vde-dataset-viewer/issues/132)

# 0.6.5
### Improvements
* Filtering using column headers [#100](https://github.com/defineEditor/vde-dataset-viewer/issues/100)
* Open datasets from compare summary [#85](https://github.com/defineEditor/vde-dataset-viewer/issues/85)
* Option to ignore case when comparing string values [#107](https://github.com/defineEditor/vde-dataset-viewer/issues/107)
* Option to ignore leading and trailing in differences [#105](https://github.com/defineEditor/vde-dataset-viewer/issues/105)
* Ctrl + Arrows to navigate to dataset borders [#101](https://github.com/defineEditor/vde-dataset-viewer/issues/101)


### Fixes
* Cannot compile binary for Mac in GitHub [#104](https://github.com/defineEditor/vde-dataset-viewer/issues/104)
* When comparing datasets with a different number of records, show that data is different [#102](https://github.com/defineEditor/vde-dataset-viewer/issues/102)
* Numeric Datetime variables are incorrectly shown in Unique Values section of Variable info [#103](https://github.com/defineEditor/vde-dataset-viewer/issues/103)

# 0.6.4
### Core Changes
* Dataset compare functionality [#96](https://github.com/defineEditor/vde-dataset-viewer/issues/96)

### Improvements
* Better handling of invalid JSON files [#95](https://github.com/defineEditor/vde-dataset-viewer/issues/95)

### Fixes
* Conversion/Validation freezes [#97](https://github.com/defineEditor/vde-dataset-viewer/issues/97)

## Technical Changes
* Update to React 19 [70](https://github.com/defineEditor/vde-dataset-viewer/issues/70)
* Update to MUI 7/Toolpad 16 [71](https://github.com/defineEditor/vde-dataset-viewer/issues/71)

# 0.6.3
### Improvements
* Improved handling of invalid Define-XML files and adding Open File button to the Define-XML screen [#92](https://github.com/defineEditor/vde-dataset-viewer/issues/92)

### Fixes
* Fix TIG substandard selection for CORE 0.14 [#90](https://github.com/defineEditor/vde-dataset-viewer/issues/90)
* Drag and dropping SAS7BDAT does not open the dataset  [#91](https://github.com/defineEditor/vde-dataset-viewer/issues/91)

# 0.6.2
### Core Changes
* Render Define-XML 2.0 and 2.1 in a format similar to the stylesheet [#83](https://github.com/defineEditor/vde-dataset-viewer/issues/83)

### Improvements
* Add substandards support for validation [#79](https://github.com/defineEditor/vde-dataset-viewer/issues/79)
* Keep scroll position, when switching between datasets [#86](https://github.com/defineEditor/vde-dataset-viewer/issues/86)
* Add define.xml file drag and drop [#84](https://github.com/defineEditor/vde-dataset-viewer/issues/84)

### Fixes
* Open Dataset Button is now shown in some cases [#78](https://github.com/defineEditor/vde-dataset-viewer/issues/78)
* When conversion target and destination are the same, the file is rewritten with blank  [#77](https://github.com/defineEditor/vde-dataset-viewer/issues/77)

# 0.6.1
### Improvements
* Open datasets in a new window from the bottom navigation [#57](https://github.com/defineEditor/vde-dataset-viewer/issues/57)
* Save "Only dataset issues" flag state [#65](https://github.com/defineEditor/vde-dataset-viewer/issues/65)
* Add ability to repeat a validation [#66](https://github.com/defineEditor/vde-dataset-viewer/issues/66)
* Prevent validation when it is not supposed to be executable [#69](https://github.com/defineEditor/vde-dataset-viewer/issues/69)
* MacOS executables, thanks to Charles Shadles for suggesting how to do it without Mac. MacOS version is not thoroughly tested.

### Fixes
* Failed validation status is not reset [#58](https://github.com/defineEditor/vde-dataset-viewer/issues/58)
* Sidebar navigation does not update [#56](https://github.com/defineEditor/vde-dataset-viewer/issues/56)
* Bottom navigation sometimes does not fit vertical container [#62](https://github.com/defineEditor/vde-dataset-viewer/issues/62)
* XLSX report cannot be downloaded [#68](https://github.com/defineEditor/vde-dataset-viewer/issues/68)
* Incorrect autoupdate link to DEB [#73](https://github.com/defineEditor/vde-dataset-viewer/issues/73)

# 0.6.0
### Core Changes
* Add CORE configuration. ([#78](https://trello.com/c/ez2Hcayg))
* Add CORE settings. ([#77](https://trello.com/c/qBhGFXFm))
* Add CORE result dataset view. ([#81](https://trello.com/c/LxJkbATT))
* Add CORE summary result view. ([#80](https://trello.com/c/GtL55U1z))
* Add CORE validation support. ([#76](https://trello.com/c/CKuiUyLj))
* Add CORE result filters. ([#82](https://trello.com/c/qhc1WPx5))
* Add CORE execution. ([#79](https://trello.com/c/ekZLn8fI))
* View Issues along with the data. ([#169](https://trello.com/c/y46RtgRC))
* Add issue navigation in the indata view. ([#178](https://trello.com/c/lZ6yiwe3))
* Add Global Validation section. ([#153](https://trello.com/c/OD2FPacT))
* Add ability to see unique values across the whole dataset in Variable Info. ([#152](https://trello.com/c/N6LSPGhp))
* Open Dataset in a new Window. ([#157](https://trello.com/c/rIQCAnmM))

### Improvements
* Add filter shortcuts. ([#132](https://trello.com/c/Bhuuw33i))
* Show dataset type in the toolbar. ([#101](https://trello.com/c/rpne9aHs))
* Add button to refresh current dataset. ([#129](https://trello.com/c/jN7YBPaO))
* Add search in Variable Info. ([#150](https://trello.com/c/W8DXH2Wo))
* Add XPT Round Precision in settings. ([#148](https://trello.com/c/mmrow5Hv))
* Store compressed report. ([#177](https://trello.com/c/IrpWzKVJ))
* Show leading spaces. ([#166](https://trello.com/c/uu7Ynv7s))
* Add bottom dataset navigation. ([#179](https://trello.com/c/nBxNN8xJ))
* Show validation CLI command. ([#173](https://trello.com/c/6HwKZtbA))
* When opening a dataset using a command line, if it is currently open refresh it. ([#143](https://trello.com/c/UCSmpCPL))
* Add report download. ([#167](https://trello.com/c/U0ofYBmD))
* Add a setting to always copy values with headers. ([#163](https://trello.com/c/lNdT4eaD))
* Add ContextMenu with filter actions in Variable Info. ([#151](https://trello.com/c/IvqPBzeo))
* Add shortcut to reset filter. ([#160](https://trello.com/c/Ln5q8lTv))
* Select the whole dataset by clicking on #. ([#158](https://trello.com/c/IlkG9iLj))
* Instead of datatype, show the file folder in the dataset list sidebar. ([#155](https://trello.com/c/a49SanjK))
* Right-align numeric values. ([#165](https://trello.com/c/MDgY6IXG))
* Add logging in case of CORE errors. ([#176](https://trello.com/c/8JAgidVR))
* Column selection using Mouse. ([#136](https://trello.com/c/Ax6hkWZX))
* Add search in validation results. ([#168](https://trello.com/c/V78iL4Cd))
* Add window splitting, when opening a new window with Ctrl or Shift pressed. ([#161](https://trello.com/c/gEx9gufv))
* Show path in the dataset info tab. ([#156](https://trello.com/c/A4cMAkeL))
* Add refresh button. ([#142](https://trello.com/c/3KYleX7U))
* Add ability to change zoom level with Ctrl + Mouse up/down/+/-/0. ([#162](https://trello.com/c/dsLkxoR7))
* Improve tool window sizes depending on screen size. ([#149](https://trello.com/c/787hYo6c))
* js-stream-dataset-json improve writing speed. ([#144](https://trello.com/c/FUm6CTys))
* Save previous validation. ([#172](https://trello.com/c/q7tEr3Wt))
* Copy values with headers. ([#159](https://trello.com/c/tENmESeY))
* Add define.xml to validation. ([#174](https://trello.com/c/3Jax5Pru))

### Fixes
* Filter type cannot be switched after cleaning it. ([#141](https://trello.com/c/uErn8y6b))
* Converted DJSC cannot be open. ([#140](https://trello.com/c/vHimgX0B))
* Filter values in Reports. ([#170](https://trello.com/c/9Jm9M9SF))
* When columns are resized, last columns can be hidden. ([#114](https://trello.com/c/HNhr3gFy))
* When converting to compressed dataset, unexpected end of file error appears. ([#91](https://trello.com/c/h72C8a0d))
* Dataset is read twice when switching back to a dataset with an active filter. ([#113](https://trello.com/c/KVHa4Kmi))
* In filter Clear button does not remove selected values when IN/NOTIN is used. ([#135](https://trello.com/c/8VqjGlKt))
* When drag&drop a new dataset with records > pagesize, record count is not updated. ([#146](https://trello.com/c/rHnA4vxw))
* js-steam-sas7bdat Add *1000 for creation/modification date times. ([#133](https://trello.com/c/sDh30uMA))
* Missing numeric values are shown as 0 in XPT. ([#96](https://trello.com/c/6eh71C9p))
* Handling of null values in interactive filter. ([#47](https://trello.com/c/GVrVOARz))
* Filter with interactive datetime value does not work. ([#139](https://trello.com/c/zqeBY4Vi))
* Error when switching interactive filter with an empty variable. ([#147](https://trello.com/c/NbvOlQem))
* When hiding columns, a right click filter results in incorrect filter. ([#154](https://trello.com/c/Prb8mXyL))
* When dragging an object which is not a file, the drag&drop animation does not exit. ([#175](https://trello.com/c/PJ8TRSy0))
* Filters like var in ("val1, val2") are not handled corretly. ([#180](https://trello.com/c/nTJvgji2))
* Null value in Values in Reports. ([#171](https://trello.com/c/vyObStvc))
* SAS7BDAT dataset labels are not shown in the dataset info. ([#164](https://trello.com/c/LbVJ0ku3))
* Error: Error invoking remote method 'read:getObservations': reply was never sen. ([#65](https://trello.com/c/XGcwPlSQ))
* When filter is used, columns width are shown incorrectly. ([#97](https://trello.com/c/qE6203HH))
* When XPT is converted, numeric values are not rounded. ([#92](https://trello.com/c/VQsNUaRX))

# 0.5.0
## Core Updates
* SAS7BDAT support. ([#108](https://trello.com/c/iVUskjcN))
* DJSC write. ([#89](https://trello.com/c/blJRpX4F))
* DJSC read. ([#88](https://trello.com/c/zlxxjpge))
* Add column visibility tool. ([#130](https://trello.com/c/meKRvk9X))
* Add column header context menu. ([#93](https://trello.com/c/u7nvL9t8))
* Add ability to open datasets via Open With. ([#102](https://trello.com/c/rgTa252c))
* Add variable info modal. ([#94](https://trello.com/c/Spy7tGc5))
* Sidebar with open datasets. ([#83](https://trello.com/c/xBpdyuEH))
## Improvements
* Add csv output format in converter. ([#105](https://trello.com/c/SAoFD7T8))
* Add setting to show variable type icon in the header. ([#120](https://trello.com/c/1dfV2HBR))
* Add compression to js-stream-dataset-json. ([#90](https://trello.com/c/HrqVvejq))
* Add var:row pointer in GoTo. ([#86](https://trello.com/c/8zw7sC2T))
* Show unique values in variable info. ([#99](https://trello.com/c/BXVp8eNR))
* Add IconButton to select among opened datasets. ([#100](https://trello.com/c/f9GP24BU))
* Save filters when switching datasets. ([#84](https://trello.com/c/KAg0TJ6x))
* Add ability to select column. ([#98](https://trello.com/c/FH04yb8l))
* Change 1.1 to 1.1.0 in the converted Dataset-JSON. ([#106](https://trello.com/c/HAm9dqW9))
* Add viewer settings to allow showing SAS7BDAT/XPT datetime formats as string dates. ([#111](https://trello.com/c/1Jt4DJC0))
* Correctly set width for numeric variables represented as date strings. ([#116](https://trello.com/c/eHaU4DRI))
* Add hints for action icons in the dataset metadata. ([#128](https://trello.com/c/F3uicaWS))
* When filtering converted datetime numeric values, convert them back to numbers. ([#117](https://trello.com/c/VmC3DLBJ))
* Fix formats like DATE9 to be treated as DATE. ([#126](https://trello.com/c/JZTY3JPm))
* Add search Box in the dataset metadata. ([#123](https://trello.com/c/nuIMOgRw))
* Add button to see variable info from the dataset metadata. ([#124](https://trello.com/c/qkEdtjyn))
* Add ability to close dataset from a dataset sidebar menu. ([#122](https://trello.com/c/NdspN7GG))
* Add ability to disable all UI animations. ([#118](https://trello.com/c/YkB50qee))
* If the second instance of the app is opened, focus on the current window. ([#121](https://trello.com/c/uy1OAOmI))
* Rename DSJC to DJSC. ([#109](https://trello.com/c/pDoAlwi0))
* When current dataset is closed from sidebar, close the sidebar. ([#127](https://trello.com/c/3s02BFLf))
## Technical Changes
### Fixes
* When filtering by value and pressing Ctrl+C to copy an error occurs. ([#119](https://trello.com/c/rGDXb4Il))
* File is named NDJSON when output format is CSV. ([#107](https://trello.com/c/MnB2frBR))
* Cell menu on the first row opens as a header menu. ([#110](https://trello.com/c/ACOnjVl6))
* Loading animation is not centered when the table is scrolled horizontally. ([#125](https://trello.com/c/GpaugC7P))

# 0.4.0
## Core Updates
- Added Converter (XPT -> JSON, XPT -> NDJSON, JSON <-> NDJSON)
- Added dataset drag & drop functionality

## Improvements
- Added ability to build filter from the cell data by a right click
- Added filter indication to a column which is used in a filter
- Show App version in the About section

## Technical Changes
- Update electron to v34

## Bug fixes
- When viewing XPT datasets > page size rows, there is one extra record loaded
- Filter fail in case of numeric variables
- Null values from XPT are shown as 0

# 0.3.3
## Core Updates
- Add XPORT support
- Add error handling
- Adding filtering to API
- Add new filter operators: missing, notMissing

## Improvements
- When going to row or column, the screen is centered
- Add dataset types to current datasets
- Increased number of recent filters to 100

## Technical Changes
- Add filter functionality to js-array-filter
- Update xport-js to use methods of js-stream-dataset-json
- Update filter functionality to use js-array-filter
- Improve fileId generation

## Bug fixes
- Cannot change operator for existing filter (change = to !=)
- When filter is loaded from recent, it is treated as valid in any case
- When filter is loaded from recent, it is treated as valid in any case
- When opening a new file, it always adds as a new dataset, even if open before


