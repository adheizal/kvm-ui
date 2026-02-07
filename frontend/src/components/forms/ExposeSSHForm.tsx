import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vmApi } from '@/lib/api';
import { toast } from 'sonner';

interface ExposeSSHFormProps {
  vmName: string;
  onSuccess?: () => void;
}

export function ExposeSSHForm({ vmName, onSuccess }: ExposeSSHFormProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: vmApi.exposeSSH,
    onSuccess: () => {
      toast.success('SSH exposed successfully');
      queryClient.invalidateQueries({ queryKey: ['vms'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to expose SSH');
    },
  });

  const onSubmit = async () => {
    await mutation.mutateAsync({ vmName });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This will expose SSH access for this VM. Are you sure?
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
        <Button onClick={onSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exposing...
            </>
          ) : (
            'Expose SSH'
          )}
        </Button>
      </div>
    </div>
  );
}
