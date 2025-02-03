# 0.4.0
## Core Updates
- Added Converter (XPT -> JSON, XPT -> NDJSON, JSON <-> NDJSON)
- Added dataset drag & drop functionality

## Improvements
- Added ability to build filter from the cell data by a right click
- Added filter indication to a column which is used in a filter

## Technical Changes
- Update electron to v34

## Bug fixes
- When viewing XPT datasets > page size rows, there is one extra record loaded
- Filter fail in case of numeric variables

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


