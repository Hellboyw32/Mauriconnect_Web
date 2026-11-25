import { Autocomplete, Box, TextField } from '@mui/material';
import { COUNTRIES_POPULAR_FIRST, type CountryOption } from '../utils/countries';

const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

export function CountrySelect({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required,
  name,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  name?: string;
}) {
  const selected = COUNTRIES_POPULAR_FIRST.find((c) => c.code === value) ?? null;
  return (
    <Autocomplete<CountryOption>
      options={COUNTRIES_POPULAR_FIRST}
      value={selected}
      onChange={(_, option) => onChange(option?.code ?? '')}
      onBlur={onBlur}
      autoHighlight
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(a, b) => a.code === b.code}
      renderOption={({ key, ...props }, o) => (
        <Box component="li" key={key} {...props} sx={{ gap: 1 }}>
          <span aria-hidden>{flag(o.code)}</span>
          {o.name}
        </Box>
      )}
      renderInput={(params) => <TextField {...params} name={name} label={label} required={required} error={error} helperText={helperText} autoComplete="off" />}
    />
  );
}

export function DialCodeSelect({ value, onChange, error }: { value: string; onChange: (code: string) => void; error?: boolean }) {
  const selected = COUNTRIES_POPULAR_FIRST.find((c) => c.code === value) ?? null;
  return (
    <Autocomplete<CountryOption>
      options={COUNTRIES_POPULAR_FIRST}
      value={selected}
      onChange={(_, option) => onChange(option?.code ?? '')}
      autoHighlight
      disableClearable={!!selected as false}
      getOptionLabel={(o) => `${flag(o.code)} +${o.callingCode}`}
      filterOptions={(options, { inputValue }) => {
        const q = inputValue.replace(/^\+/, '').toLowerCase().trim();
        return q ? options.filter((o) => o.name.toLowerCase().includes(q) || o.callingCode.startsWith(q) || o.code.toLowerCase() === q) : options;
      }}
      isOptionEqualToValue={(a, b) => a.code === b.code}
      renderOption={({ key, ...props }, o) => (
        <Box component="li" key={key} {...props} sx={{ gap: 1 }}>
          <span aria-hidden>{flag(o.code)}</span>
          {o.name} <Box component="span" sx={{ color: 'text.secondary' }}>+{o.callingCode}</Box>
        </Box>
      )}
      slotProps={{ popper: { sx: { minWidth: 300 } } }}
      renderInput={(params) => <TextField {...params} label="Code" required error={error} autoComplete="off" />}
    />
  );
}
