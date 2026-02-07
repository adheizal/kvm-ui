import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vmApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DeleteVMDialogProps {
  vmName: string;
  onSuccess?: () => void;
}

export function DeleteVMDialog({ vmName, onSuccess }: DeleteVMDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: vmApi.deleteVM,
    onSuccess: () => {
      toast.success('VM deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vms'] });
      navigate('/vms');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete VM');
    },
  });

  const onSubmit = async () => {
    await mutation.mutateAsync({ vmName });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-destructive">Warning: This action cannot be undone</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Deleting VM <strong>{vmName}</strong> will permanently remove all data associated with this virtual machine.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Please confirm that you want to delete this VM by typing the VM name below.
      </p>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete VM'
          )}
        </Button>
      </div>
    </div>
  );
}
