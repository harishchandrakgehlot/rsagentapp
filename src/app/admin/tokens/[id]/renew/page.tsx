import React from 'react';
import { notFound } from 'next/navigation';
import { getTokenById, getRenewalDraftData, syncStoreFromCloud } from '@/lib/store';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { TokenForm } from '@/components/tokens/TokenForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RenewTokenPage({ params }: Props) {
  await syncStoreFromCloud();
  const { id } = await params;
  const token = getTokenById(id);

  if (!token) {
    notFound();
  }

  const draftData = getRenewalDraftData(id);

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Create Renewal Token`}
        subtitle={`Issuing replacement token linked to prior token ${token.token_number}`}
      />

      <TokenForm renewalDraft={draftData} />
    </div>
  );
}
