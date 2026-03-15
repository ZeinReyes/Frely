'use client';

import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeleteClient } from '@/hooks/useClients';

interface DeleteClientModalProps {
  clientId:   string;
  clientName: string;
  onClose:    () => void;
}

export function DeleteClientModal({ clientId, clientName, onClose }: DeleteClientModalProps) {
  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    await deleteClient.mutateAsync(clientId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Delete client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{clientName}</span>?
              This will also delete all their projects, invoices, and files. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={deleteClient.isPending} onClick={handleDelete}>
              Delete client
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}