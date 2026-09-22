import React from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { TokenForm } from '@/components/tokens/TokenForm';

export default function NewTokenPage() {
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Create New Service Token"
        subtitle="Register a unique token, assign property and agent, configure validity dates, and attach public documents"
      />

      <TokenForm />
    </div>
  );
}
