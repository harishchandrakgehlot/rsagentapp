import React from 'react';
import { getArchivedTokens } from '@/lib/store';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { TokenListTable } from '@/components/tokens/TokenListTable';
import { ShieldCheck } from 'lucide-react';


export const dynamic = 'force-dynamic';

export default async function AdminArchivePage() {
  const archivedTokens = getArchivedTokens();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Archived Tokens"
        subtitle="Archived tokens removed from operational lists and public tracking. History and documents remain preserved for restoration."
      />

      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
        <p>
          <strong>Archival Policy:</strong> Token numbers are permanently retained and cannot be reused by other tokens even when archived. Restoring an archived token recalculates its status in IST and reactivates future reminder evaluation without duplicate sends.
        </p>
      </div>

      <TokenListTable initialTokens={archivedTokens} isArchivedView={true} />
    </div>
  );
}
