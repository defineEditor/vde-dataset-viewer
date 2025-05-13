import React from 'react';
import {
    TextField,
    Stack,
    Typography,
    FormControlLabel,
    Checkbox,
    Autocomplete,
    RadioGroup,
    Radio,
} from '@mui/material';
import { ISettings } from 'interfaces/common';
import { styles } from 'renderer/components/Settings/styles';

interface ConverterProps {
    settings: ISettings;
    onSettingChange: (
        event: React.ChangeEvent<
            HTMLInputElement | { name?: string; value: unknown }
        >,
    ) => void;
}

export const Converter: React.FC<ConverterProps> = ({
    settings,
    onSettingChange,
}) => {
    return (
        <Stack spacing={2}>
            <Typography variant="h6">Converter Settings</Typography>
            <TextField
                label="Threads"
                name="converter.threads"
                helperText="Number of processes used during the conversion"
                type="number"
                value={settings.converter.threads}
                onChange={onSettingChange}
                slotProps={{ htmlInput: { min: 1, max: 16 } }}
                sx={styles.inputField}
            />
            <Typography variant="h6">
                SAS7BDAT/XPT Conversion Settings
            </Typography>
            <Typography variant="caption">
                When a variable has one of the following display formats
                applied, it will be converted as a numeric variable with a
                date/time/datetime value.
            </Typography>
            <Typography variant="caption">
                When adding a new format, do not use W.D part of the format. For
                example, to handle &quot;DATE9.&quot; or &quot;DATE11.&quot;
                formats use the &quot;DATE&quot; value.
            </Typography>
            <Autocomplete
                multiple
                freeSolo
                options={[
                    'B8601DA',
                    'B8601DN',
                    'DATE',
                    'DATEAMPM',
                    'DDMMYY',
                    'DOWNAME',
                    'DTDATE',
                    'DTMONYY',
                    'DTWKDATX',
                    'DTYEAR',
                    'E8601DA',
                    'E8601DN',
                    'JULDAY',
                    'JULIAN',
                    'MMDDYY',
                    'MMYY',
                    'MONNAME',
                    'MONTH',
                    'MONYY',
                    'NENGO',
                    'QTR',
                    'QTRR',
                    'WEEKDATE',
                    'WEEKDATX',
                    'WEEKDAY',
                    'WORDDATE',
                    'WORDDATX',
                    'YEAR',
                    'YYMM',
                    'YYMMDD',
                    'YYMON',
                    'YYQ',
                    'YYQR',
                    'PDJULG',
                    'PDJULI',
                    'NLDATE',
                    'NLDATEL',
                ]}
                value={settings.converter.dateFormats}
                onChange={(_e, value) => {
                    onSettingChange({
                        target: {
                            name: 'converter.dateFormats',
                            value,
                        },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Date Formats"
                        helperText="Date formats used for conversion"
                        sx={styles.inputField}
                    />
                )}
            />
            <Autocomplete
                multiple
                freeSolo
                options={[
                    'HHMM',
                    'HOUR',
                    'MMSS',
                    'TIME',
                    'TIMEAMPM',
                    'TOD',
                    'B8601TM',
                    'B8601TX',
                    'B8601TZ',
                    'E8601TM',
                    'E8601TX',
                    'E8601TZ',
                    'B8601LZ',
                    'E8601LZ',
                    'NLTIME',
                    'NLTIMAP',
                ]}
                value={settings.converter.timeFormats}
                onChange={(_e, value) => {
                    onSettingChange({
                        target: {
                            name: 'converter.timeFormats',
                            value,
                        },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Time Formats"
                        helperText="Time formats used for conversion"
                        sx={styles.inputField}
                    />
                )}
            />
            <Autocomplete
                multiple
                freeSolo
                options={[
                    'B8601DT',
                    'B8601DX',
                    'B8601DZ',
                    'B8601LX',
                    'DATETIME',
                    'E8601DT',
                    'E8601DX',
                    'E8601DZ',
                    'E8601LX',
                    'MDYAMPM',
                    'NLDATM',
                    'NLDATMAP',
                    'NLDATMDT',
                    'NLDATML',
                    'NLDATMM',
                    'NLDATMW',
                    'NLDATMWZ',
                ]}
                value={settings.converter.datetimeFormats}
                onChange={(_e, value) => {
                    onSettingChange({
                        target: {
                            name: 'converter.datetimeFormats',
                            value,
                        },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Datetime Formats"
                        helperText="Datetime formats used for conversion"
                        sx={styles.inputField}
                    />
                )}
            />
            <Typography variant="caption">
                When a variable has one of the following suffixes applied, it
                will be converted as a numeric variable with a
                date/time/datetime value.
            </Typography>
            <Stack spacing={0}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={settings.converter.convertSuffixDt}
                            onChange={onSettingChange}
                            name="converter.convertSuffixDt"
                        />
                    }
                    label="Convert --DT variables as date"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={settings.converter.convertSuffixTm}
                            onChange={onSettingChange}
                            name="converter.convertSuffixTm"
                        />
                    }
                    label="Convert --TM variables as time"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={settings.converter.convertSuffixDtm}
                            onChange={onSettingChange}
                            name="converter.convertSuffixDtm"
                        />
                    }
                    label="Convert --DTM variables as datetime"
                />
            </Stack>
            <Typography variant="h6">CSV Conversion Settings</Typography>
            <Typography variant="caption">
                Epoch used to convert date/time/datetime values.
            </Typography>
            <RadioGroup
                name="converter.csvEpoch"
                value={settings.converter.csvEpoch}
                onChange={onSettingChange}
            >
                <FormControlLabel
                    control={<Radio />}
                    value="1960-01-01"
                    label="1960-01-01 (used in SAS)"
                />
                <FormControlLabel
                    control={<Radio />}
                    value="1970-01-01"
                    label="1970-01-01 (used in R/Python)"
                />
                <FormControlLabel
                    control={<Radio />}
                    value=""
                    label="Do not convert to numeric value"
                />
            </RadioGroup>
        </Stack>
    );
};
