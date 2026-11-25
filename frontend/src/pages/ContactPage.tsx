import { zodResolver } from '@hookform/resolvers/zod';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import SendIcon from '@mui/icons-material/Send';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Alert, Avatar, Box, Button, Container, Grid2 as Grid, Link, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { company } from '../content/company';
import { errorMessage } from '../services/apiClient';
import { enquiryService } from '../services/bookingService';
import { contactSchema, type ContactValues } from '../utils/validation';

export function ContactPage() {
  const [params] = useSearchParams();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: params.get('type') === 'Quote' ? 'Quote' : 'Contact', name: '', email: '', phone: '', message: '' },
  });

  const onSubmit = async (v: ContactValues) => {
    setError(null);
    try {
      await enquiryService.submit({ ...v, phone: v.phone || null });
      setSent(true);
      reset({ ...v, message: '' });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const field = (name: 'name' | 'email' | 'phone' | 'message', label: string, props: Partial<React.ComponentProps<typeof TextField>> = {}) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => <TextField {...f} value={f.value ?? ''} label={label} error={!!fieldState.error} helperText={fieldState.error?.message ?? props.helperText} {...props} />}
    />
  );

  const contacts = [
    { icon: <PhoneOutlinedIcon />, label: 'Phone', value: company.phone, href: company.phoneHref },
    { icon: <WhatsAppIcon />, label: 'WhatsApp', value: company.phone, href: company.whatsappUrl },
    { icon: <EmailOutlinedIcon />, label: 'Email', value: company.email, href: `mailto:${company.email}` },
    { icon: <PlaceOutlinedIcon />, label: 'Office', value: company.address, href: company.mapUrl },
    { icon: <ScheduleOutlinedIcon />, label: 'Office hours', value: `${company.officeHours} · ${company.support}` },
  ];

  return (
    <>
      <PageHeader overline="Contact us" title="We are here to help" subtitle="Questions, a quote for a short rental or a special request: send us a message or call us any time." />
      <Container sx={{ py: { xs: 4, md: 7 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2}>
              {contacts.map((c) => (
                <Paper key={c.label} variant="outlined" sx={{ p: 2.25 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'rgba(11,79,138,.08)', color: 'primary.main' }}>{c.icon}</Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {c.label}
                      </Typography>
                      {c.href ? (
                        <Link href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener" underline="hover" sx={{ display: 'block', fontWeight: 600 }}>
                          {c.value}
                        </Link>
                      ) : (
                        <Typography fontWeight={600}>{c.value}</Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
              <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
                Send us a message
              </Typography>
              {sent ? (
                <Stack spacing={2}>
                  <Alert severity="success">Thank you, your message has been sent. We will reply by email, usually within a few hours.</Alert>
                  <Box>
                    <Button onClick={() => setSent(false)}>Send another message</Button>
                  </Box>
                </Stack>
              ) : (
                <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
                  <Stack spacing={2.5}>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field: f }) => (
                        <ToggleButtonGroup exclusive color="primary" value={f.value} onChange={(_, v) => v && f.onChange(v)} aria-label="Type of message">
                          <ToggleButton value="Contact">General question</ToggleButton>
                          <ToggleButton value="Quote">Request a quote</ToggleButton>
                        </ToggleButtonGroup>
                      )}
                    />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>{field('name', 'Your name', { required: true, autoComplete: 'name' })}</Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>{field('email', 'Email address', { required: true, type: 'email', autoComplete: 'email' })}</Grid>
                      <Grid size={12}>{field('phone', 'Phone / WhatsApp (optional)', { type: 'tel', placeholder: '+33 6 12 34 56 78', autoComplete: 'tel' })}</Grid>
                      <Grid size={12}>
                        {field('message', 'Message', {
                          required: true,
                          multiline: true,
                          minRows: 5,
                          placeholder: 'For a quote, tell us your dates, pickup place and the type of car you would like.',
                        })}
                      </Grid>
                    </Grid>
                    {error && <Alert severity="error">{error}</Alert>}
                    <Box>
                      <Button type="submit" variant="contained" size="large" endIcon={<SendIcon />} disabled={formState.isSubmitting}>
                        {formState.isSubmitting ? 'Sending…' : 'Send message'}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
