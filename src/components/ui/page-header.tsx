'use client';
import Link from 'next/link';
import { Box, Breadcrumbs, Link as MuiLink, Stack, Typography } from '@mui/material';
type Props = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
};
export function PageHeader({ title, description, action, breadcrumbs }: Props) {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && (
        <Breadcrumbs aria-label="Đường dẫn" sx={{ mb: 2 }}>
          {breadcrumbs.map((item) =>
            item.href ? (
              <MuiLink
                component={Link}
                href={item.href}
                key={item.label}
                underline="hover"
                color="inherit"
              >
                {item.label}
              </MuiLink>
            ) : (
              <Typography variant="body2" key={item.label}>
                {item.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          gap: 2,
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            component="h1"
            variant="h2"
            sx={{
              fontSize: { xs: '1.875rem', md: '2.25rem' },
              lineHeight: { xs: '2.25rem', md: '2.5rem' },
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
    </Box>
  );
}
