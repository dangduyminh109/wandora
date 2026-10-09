'use client';
import Link from 'next/link';
import { Button, Container } from '@mui/material';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
export function SystemPage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Container component="main" id="main" maxWidth="sm" sx={{ py: 6 }}>
      <Card>
        <EmptyState
          title={title}
          description={description}
          action={
            action ?? (
              <Button component={Link} href="/" variant="contained">
                Về Wandora
              </Button>
            )
          }
        />
      </Card>
    </Container>
  );
}
