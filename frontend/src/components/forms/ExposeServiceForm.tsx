import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { exposeServiceSchema, type ExposeServiceFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vmApi } from '@/lib/api';
import { toast } from 'sonner';

interface ExposeServiceFormProps {
  vmName: string;
  onSuccess?: () => void;
}

export function ExposeServiceForm({ vmName, onSuccess }: ExposeServiceFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExposeServiceFormData>({
    resolver: zodResolver(exposeServiceSchema),
    defaultValues: { vmName, protocol: 'tcp' },
  });

  const mutation = useMutation({
    mutationFn: vmApi.exposeService,
    onSuccess: () => {
      toast.success('Service exposed successfully');
      queryClient.invalidateQueries({ queryKey: ['vms'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to expose service');
    },
  });

  const onSubmit = async (data: ExposeServiceFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="servicePort">Service Port</Label>
        <Input
          id="servicePort"
          type="text"
          placeholder="8080"
          disabled={mutation.isPending}
          {...register('servicePort')}
        />
        {errors.servicePort && (
          <p className="text-sm text-destructive">{errors.servicePort.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="protocol">Protocol</Label>
        <select
          id="protocol"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={mutation.isPending}
          {...register('protocol')}
        >
          <option value="tcp">TCP</option>
          <option value="udp">UDP</option>
        </select>
        {errors.protocol && (
          <p className="text-sm text-destructive">{errors.protocol.message}</p>
        )}
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
              Exposing...
            </>
          ) : (
            'Expose Service'
          )}
        </Button>
      </div>
    </form>
  );
}
