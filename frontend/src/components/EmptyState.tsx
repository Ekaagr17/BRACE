import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-[#1a1a2e] flex items-center justify-center mb-4 text-[#3d3d56]">
      {icon || <Inbox size={28} />}
    </div>
    <h3 className="text-lg font-semibold text-[#a0a0b8] mb-1">{title}</h3>
    {description && <p className="text-sm text-[#6b6b80] max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
