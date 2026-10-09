'use client';
import { Card as MuiCard, CardContent, CardHeader, type CardProps } from '@mui/material';
type Props = Omit<CardProps, 'title'> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};
export function Card({ title, description, action, children, ...props }: Props) {
  return (
    <MuiCard variant="outlined" {...props}>
      {(title || description || action) && (
        <CardHeader
          title={title}
          subheader={description}
          action={action}
          slotProps={{ title: { variant: 'h4', component: 'h2' } }}
          sx={{ p: 3, pb: 0 }}
        />
      )}
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>{children}</CardContent>
    </MuiCard>
  );
}
