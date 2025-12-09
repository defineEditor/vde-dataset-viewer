# VDE Dataset Viewer - AI Agent Guidelines

## Architecture Overview

This is an **Electron desktop application** for viewing and validating clinical trial datasets (Dataset-JSON, XPORT, SAS7BDAT). Key architectural components:

- **Main Process** (`src/main/`): Node.js backend with managers for files, networking, tasks, and reports
- **Renderer Process** (`src/renderer/`): React frontend with Redux state management
- **IPC Communication**: Main ↔ Renderer via `electron.api.d.ts` interfaces
- **Requests from Renderer to Main**: Handled via ApiService class in `src/renderer/services/ApiService.ts`
- **Workers**: Background processing for large dataset operations

## Critical Development Patterns

### TypeScript Path Aliases (Always Use)
```typescript
import Component from '@components/DatasetView/View';
import { useAppSelector } from '@redux/hooks';
import { ITableRow } from '@interfaces/common';
```
Defined in `tsconfig.json` - never use relative imports for these paths.

### Redux State Management
- **4 Main Slices**: `ui`, `data`, `settings`, `api` in `src/renderer/redux/slices/`
- **Typed Hooks**: Always use `useAppSelector` and `useAppDispatch` from `@redux/hooks`
- **State Persistence**: Redux state hydrates/dehydrates via `stateUtils.ts`

Example pattern:
```typescript
const currentDataset = useAppSelector(state => state.data.currentDataset);
const dispatch = useAppDispatch();
```

### Component Structure Conventions
- **Manager Classes**: Main process uses manager pattern (`FileManager`, `StoreManager`, etc.)
- **Component Organization**: Grouped by feature in `src/renderer/components/`
- **Material-UI Integration**: All UI uses MUI components with custom theming
- **Error Boundaries**: App-level error boundary redirects to error modal

### Dataset Processing Architecture
- **Large Files**: Use workers for parsing (`src/main/workers/`)
- **Virtualization**: Tables use `@tanstack/react-table` + `@tanstack/react-virtual`
- **File Types**: Dataset-JSON, NDJSON, compressed formats, XPORT, SAS7BDAT
- **Validation**: Core validation engine with report generation

## Essential Development Commands

```bash
# Development (hot reload)
npm run start

# Build for production
npm run build

# Platform-specific packaging
npm run package-linux    # Creates AppImage + .deb
npm run package-win      # Creates .exe installer
npm run package-all      # Builds all platforms

# Testing
npm test
```

## Critical File Locations

- **Main Entry**: `src/main/main.ts` - Electron app initialization
- **Renderer Entry**: `src/renderer/App.tsx` - React app with providers
- **State Definitions**: `src/interfaces/store.d.ts` - All Redux state types
- **Initial State Values**: `src/renderer/redux/initialState.ts` - Initial Redux state
- **Constants**: `src/misc/constants.ts` - Modal types, paths, enums
- **IPC Interface**: `src/renderer/services/ApiService.ts` - Main↔Renderer communication

## Key Integration Points

### File Opening Workflow
1. File drag/drop or menu selection
2. Main process validates and processes via `FileManager`
3. Data sent to renderer via IPC
4. Redux state updated, components re-render

### Validation Pipeline
1. `TaskManager` orchestrates validation tasks
2. `ReportManager` handles result persistence
3. Results stored in `userData/reports/` directory
4. UI displays via `ValidationResults` component

## Project-Specific Patterns

- **Modal System**: Centralized modal management via `ui` slice with type-safe modal data
- **Settings Persistence**: Local JSON store via `StoreManager` in userData directory  
- **Multi-Window Support**: Single instance with file association handling
- **Auto-Updates**: Built-in updater with release management in `release/` folder

## When Working With
- **Tables**: Always consider virtualization for performance with large datasets
- **File Processing**: Use main process workers, never block renderer
- **State Updates**: Batch related actions, prefer reducer patterns over individual setters
- **New Features**: Follow the manager pattern in main, slice pattern in renderer
