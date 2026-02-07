import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resizeDiskSchema, type ResizeDiskFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vmApi } from '@/lib/api';
import { toast } from 'sonner';

interface ResizeDiskFormProps {
  vmName: string;
  onSuccess?: () => void;
}

export function ResizeDiskForm({ vmName, onSuccess }: ResizeDiskFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResizeDiskFormData>({
    resolver: zodResolver(resizeDiskSchema),
    defaultValues: { vmName },
  });

  const mutation = useMutation({
    mutationFn: vmApi.resizeDisk,
    onSuccess: () => {
      toast.success('Disk resized successfully');
      queryClient.invalidateQueries({ queryKey: ['vms'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resize disk');
    },
  });

  const onSubmit = async (data: ResizeDiskFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newSize">Additional Disk Size (GB)</Label>
        <Input
          id="newSize"
          type="number"
          placeholder="50"
          min="1"
          max="1000"
          disabled={mutation.isPending}
          {...register('newSize')}
        />
        {errors.newSize && (
          <p className="text-sm text-destructive">{errors.newSize.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter the size to add in GB (gigabytes). Example: 50 adds 50GB to the current disk size.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resizing...
            </>
          ) : (
            'Resize Disk'
          )}
        </Button>
      </div>
    </form>
  );
}
