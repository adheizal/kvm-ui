import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateIPSchema, type UpdateIPFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vmApi } from '@/lib/api';
import { toast } from 'sonner';
import { Select } from '@/components/ui/select';

interface UpdateIPFormProps {
  vmName: string;
  onSuccess?: () => void;
}

export function UpdateIPForm({ vmName, onSuccess }: UpdateIPFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateIPFormData>({
    resolver: zodResolver(updateIPSchema),
    defaultValues: { vmName, osName: 'ubuntu22' },
  });

  const mutation = useMutation({
    mutationFn: vmApi.updateIP,
    onSuccess: () => {
      toast.success('IP updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vms'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update IP');
    },
  });

  const onSubmit = async (data: UpdateIPFormData) => {
    await mutation.mutateAsync({
      vmName: data.vmName,
      osName: data.osName,
      newIp: data.newIp,
      hostname: data.hostname,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="osName">OS Type</Label>
        <Select id="osName" {...register('osName')} disabled={mutation.isPending}>
          <option value="ubuntu">Ubuntu</option>
          <option value="centos">CentOS</option>
        </Select>
        {errors.osName && (
          <p className="text-sm text-destructive">{errors.osName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newIp">New IP Address</Label>
        <Input
          id="newIp"
          type="text"
          placeholder="192.168.1.100"
          disabled={mutation.isPending}
          {...register('newIp')}
        />
        {errors.newIp && (
          <p className="text-sm text-destructive">{errors.newIp.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hostname">Hostname (Optional)</Label>
        <Input
          id="hostname"
          type="text"
          placeholder="vm-ubuntu-01"
          disabled={mutation.isPending}
          {...register('hostname')}
        />
        {errors.hostname && (
          <p className="text-sm text-destructive">{errors.hostname.message}</p>
        )}
        <p className="text-xs text-muted-foreground">Leave empty to keep current hostname</p>
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
              Updating...
            </>
          ) : (
            'Update IP'
          )}
        </Button>
      </div>
    </form>
  );
}
