import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Checkbox, Grid2 as Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import type { Extra, SelectedExtra } from '../types/api';
import { formatMoney } from '../utils/format';

function priceLabel(e: Extra) {
  const base = e.pricingType === 'PerDay' ? `${formatMoney(e.price)} per day` : `${formatMoney(e.price)} per rental`;
  return e.maxCharge !== null ? `${base}, max ${formatMoney(e.maxCharge)}` : base;
}

/** Optional extras. Prices shown are the published rates; the total always comes from the server. */
export function ExtrasSelector({ extras, value, onChange, disabled }: { extras: Extra[]; value: SelectedExtra[]; onChange: (v: SelectedExtra[]) => void; disabled?: boolean }) {
  const qty = (code: string) => value.find((v) => v.code === code)?.quantity ?? 0;
  const set = (code: string, quantity: number) => onChange([...value.filter((v) => v.code !== code), ...(quantity > 0 ? [{ code, quantity }] : [])]);

  return (
    <Grid container spacing={2}>
      {extras.map((e) => {
        const q = qty(e.code);
        return (
          <Grid key={e.code} size={{ xs: 12, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', borderColor: q > 0 ? 'primary.main' : undefined, bgcolor: q > 0 ? 'rgba(11,79,138,.03)' : undefined }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={600}>{e.name}</Typography>
                  {e.description && (
                    <Typography variant="body2" color="text.secondary">
                      {e.description}
                    </Typography>
                  )}
                  <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ mt: 0.5 }}>
                    {priceLabel(e)}
                  </Typography>
                </Box>
                {e.maxQuantity <= 1 ? (
                  <Checkbox checked={q > 0} onChange={(ev) => set(e.code, ev.target.checked ? 1 : 0)} disabled={disabled} inputProps={{ 'aria-label': `Add ${e.name}` }} />
                ) : (
                  <Stack direction="row" alignItems="center" spacing={0.5} role="group" aria-label={`${e.name} quantity`}>
                    <IconButton size="small" onClick={() => set(e.code, q - 1)} disabled={disabled || q === 0} aria-label={`Remove one ${e.name}`}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }} aria-live="polite">
                      {q}
                    </Typography>
                    <IconButton size="small" onClick={() => set(e.code, q + 1)} disabled={disabled || q >= e.maxQuantity} aria-label={`Add one ${e.name}`}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
