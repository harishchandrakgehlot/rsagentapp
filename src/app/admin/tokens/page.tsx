import React from 'react';
import { getTokens, syncStoreFromCloud } from '@/lib/store';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { TokenListTable } from '@/components/tokens/TokenListTable';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminTokensPage() {
  await syncStoreFromCloud();
  const tokens = getTokens({ includeArchived: false });

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Token Management"
        subtitle="Manage active, upcoming, and expired service tokens, search records, generate QR codes, and export data"
        action={{
          label: 'Create Token',
          href: '/admin/tokens/new',
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <TokenListTable initialTokens={tokens} isArchivedView={false} />
    </div>
  );
}
