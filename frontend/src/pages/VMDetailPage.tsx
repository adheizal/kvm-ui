import { useParams, useSearchParams } from 'react-router-dom';
import { useVMList } from '@/hooks/useVMList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VMStatusBadge } from '@/components/vm/VMStatusBadge';
import { Loader2, ArrowLeft, Server, HardDrive, Network, Settings, Trash2, AlertCircle, Play, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UpdateIPForm } from '@/components/forms/UpdateIPForm';
import { ResizeDiskForm } from '@/components/forms/ResizeDiskForm';
import { ExposeSSHForm } from '@/components/forms/ExposeSSHForm';
import { ExposeServiceForm } from '@/components/forms/ExposeServiceForm';
import { DeleteVMDialog } from '@/components/forms/DeleteVMDialog';
import { toast } from 'sonner';
import { vmApi } from '@/lib/api';

type DialogType = 'update-ip' | 'resize-disk' | 'expose-ssh' | 'expose-service' | 'delete' | null;

export function VMDetailPage() {
  const { name } = useParams<{ name: string }>();
  const [searchParams] = useSearchParams();
  const liveMode = searchParams.get('mode') === 'live';
  const { data: vms = [], isLoading } = useVMList(liveMode);
  const [dialogOpen, setDialogOpen] = useState<DialogType>(null);

  const vm = vms.find((v) => v.name === name);
  const isUnmanaged = vm?.in_database === false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/vms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to VMs
          </Link>
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">VM not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDialogClose = () => {
    setDialogOpen(null);
  };

  const handleQuickAction = async (action: string) => {
    toast.info(`${action} ${vm.name}...`);

    try {
      if (action === 'Start') {
        await vmApi.start({ vmName: vm.name });
        toast.success(`${action} completed`);
        // Trigger refetch via WebSocket event will happen automatically
      } else if (action === 'Stop') {
        await vmApi.stop({ vmName: vm.name });
        toast.success(`${action} completed`);
        // Trigger refetch via WebSocket event will happen automatically
      }
    } catch (error: any) {
      toast.error(`${action} failed: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/vms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{vm.name}</h1>
            <p className="text-muted-foreground">
              Virtual Machine Details
              {isUnmanaged && ' (Unmanaged)'}
            </p>
          </div>
        </div>
        <VMStatusBadge status={vm.status} />
      </div>

      {/* Unmanaged VM Warning */}
      {isUnmanaged && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning">Unmanaged VM</p>
              <p className="text-sm text-muted-foreground mt-1">
                This VM is not in the database. Some information and operations may be limited.
                {vm.status === 'running' && ' Only basic controls are available.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VM Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP Address</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vm.ip || 'Not assigned'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSH Port</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vm.ssh_port || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Ports</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{vm.service_ports || 'None'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Start/Stop - Available for all VMs */}
          <div className="grid gap-2 md:grid-cols-2">
            {vm.status?.toLowerCase() === 'running' ? (
              <Button
                variant="outline"
                onClick={() => handleQuickAction('Stop')}
                className="justify-start"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop VM
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => handleQuickAction('Start')}
                className="justify-start"
              >
                <Play className="mr-2 h-4 w-4" />
                Start VM
              </Button>
            )}
          </div>

          {/* Managed VM Actions */}
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => setDialogOpen('update-ip')}
              className="justify-start"
            >
              <Network className="mr-2 h-4 w-4" />
              Update IP Address
              {isUnmanaged && <span className="ml-auto text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Adopts VM</span>}
            </Button>

            <Button
              variant="outline"
              onClick={() => setDialogOpen('resize-disk')}
              className="justify-start"
            >
              <HardDrive className="mr-2 h-4 w-4" />
              Resize Disk
              {isUnmanaged && <span className="ml-auto text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">Adopts VM</span>}
            </Button>

            <Button
              variant="outline"
              onClick={() => setDialogOpen('expose-ssh')}
              className="justify-start"
              disabled={isUnmanaged}
            >
              <Server className="mr-2 h-4 w-4" />
              Expose SSH
              {isUnmanaged && <span className="ml-auto text-xs text-muted-foreground">(Requires IP)</span>}
            </Button>

            <Button
              variant="outline"
              onClick={() => setDialogOpen('expose-service')}
              className="justify-start"
              disabled={isUnmanaged}
            >
              <Settings className="mr-2 h-4 w-4" />
              Expose Service
              {isUnmanaged && <span className="ml-auto text-xs text-muted-foreground">(Requires IP)</span>}
            </Button>

            <Button
              variant="destructive"
              onClick={() => setDialogOpen('delete')}
              className="justify-start"
              disabled={isUnmanaged}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete VM
              {isUnmanaged && <span className="ml-auto text-xs text-muted-foreground">(Managed only)</span>}
            </Button>
          </div>

          {/* Unmanaged VM Info */}
          {isUnmanaged && (
            <div className="text-sm text-muted-foreground p-3 bg-primary/5 rounded border border-primary/20">
              <p className="font-medium text-primary mb-1">Unmanaged VM Actions</p>
              <p className="text-xs">
                • <strong>Update IP</strong> and <strong>Resize Disk</strong> will adopt this VM into the database<br />
                • <strong>Expose SSH/Service</strong> and <strong>Delete</strong> require the VM to be managed (have an IP in database)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleDialogClose} />
          <div className="relative bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <DialogHeader>
                  <DialogTitle>
                    {dialogOpen === 'update-ip' && 'Update IP Address'}
                    {dialogOpen === 'resize-disk' && 'Resize Disk'}
                    {dialogOpen === 'expose-ssh' && 'Expose SSH'}
                    {dialogOpen === 'expose-service' && 'Expose Service'}
                    {dialogOpen === 'delete' && 'Delete VM'}
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="mt-4">
                {dialogOpen === 'update-ip' && (
                  <UpdateIPForm vmName={vm.name} onSuccess={handleDialogClose} />
                )}
                {dialogOpen === 'resize-disk' && (
                  <ResizeDiskForm vmName={vm.name} onSuccess={handleDialogClose} />
                )}
                {dialogOpen === 'expose-ssh' && (
                  <ExposeSSHForm vmName={vm.name} onSuccess={handleDialogClose} />
                )}
                {dialogOpen === 'expose-service' && (
                  <ExposeServiceForm vmName={vm.name} onSuccess={handleDialogClose} />
                )}
                {dialogOpen === 'delete' && (
                  <DeleteVMDialog vmName={vm.name} onSuccess={handleDialogClose} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
