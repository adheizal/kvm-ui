import { useVMList } from '@/hooks/useVMList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VMStatusBadge } from '@/components/vm/VMStatusBadge';
import { StatsSkeleton, VMSkeletonCompact } from '@/components/vm/VMSkeleton';
import { Server, Activity, AlertCircle, PauseCircle, ArrowRight, Plus, Settings, RefreshCw, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export function DashboardPage() {
  const { data: vms = [], isLoading, error } = useVMList();

  const stats = {
    total: vms.length,
    running: vms.filter((vm) => vm.status && vm.status.toLowerCase() === 'running').length,
    stopped: vms.filter((vm) => vm.status && vm.status.toLowerCase() === 'stopped').length,
    error: vms.filter((vm) => vm.status && vm.status.toLowerCase() === 'error').length,
  };

  const recentVMs = vms.slice(0, 5);

  if (error) {
    return (
      <div className="space-y-6 fade-in">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome to KVM-UI</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-destructive font-semibold">Error loading data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome to KVM-UI - Your virtual machine management dashboard
        </p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total VMs</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                <Server className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all environments
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <div className="rounded-lg bg-success/10 p-2 group-hover:bg-success/20 transition-colors">
                <Activity className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.running}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {`${Math.round((stats.running / stats.total) * 100) || 0}% of total`}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stopped</CardTitle>
              <div className="rounded-lg bg-muted/50 p-2 group-hover:bg-muted transition-colors">
                <PauseCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.stopped}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {`${Math.round((stats.stopped / stats.total) * 100) || 0}% of total`}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <div className="rounded-lg bg-error/10 p-2 group-hover:bg-error/20 transition-colors">
                <AlertCircle className="h-4 w-4 text-error" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.error}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="hover-lift bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="default" asChild className="w-full sm:w-auto hover-lift btn-glow">
            <Link to="/vms" className="flex items-center justify-center gap-2">
              <Server className="h-4 w-4" />
              View All VMs
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent VMs */}
      <Card className="hover-lift">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Recent Virtual Machines</CardTitle>
          <Button variant="ghost" size="sm" asChild className="hover-lift">
            <Link to="/vms">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-6">
          {isLoading ? (
            <VMSkeletonCompact />
          ) : recentVMs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No VMs found</p>
              <p className="text-sm mt-1">Get started by creating your first virtual machine</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentVMs.map((vm) => (
                <div
                  key={vm.name}
                  className="flex items-center justify-between rounded-lg border bg-card/50 p-4 transition-all hover:bg-accent/50 hover:shadow-md"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="rounded-lg bg-primary/10 p-2.5 flex-shrink-0">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{vm.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {vm.ip || 'No IP assigned'} · SSH: {vm.ssh_port || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <VMStatusBadge status={vm.status} />
                    <Button variant="ghost" size="sm" asChild className="hover-lift">
                      <Link to={`/vms/${vm.name}`}>Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
