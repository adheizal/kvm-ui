import { useVMList } from '@/hooks/useVMList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { VMStatusBadge } from '@/components/vm/VMStatusBadge';
import { VMSkeleton } from '@/components/vm/VMSkeleton';
import { RefreshCw, Search, Server, ChevronLeft, ChevronRight, Download, Play, Square, Trash2, Terminal, HardDrive, Cpu, Clock, Eye } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 12;

type StatusFilter = 'all' | 'running' | 'stopped' | 'error';

export function VMListPage() {
  const [liveMode, setLiveMode] = useState(false);
  const { data: vms = [], isLoading, error, refetch } = useVMList(liveMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredVMs = vms.filter((vm) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (vm.name && vm.name.toLowerCase().includes(searchLower)) ||
      (vm.ip && vm.ip.toLowerCase().includes(searchLower));

    const vmStatus = vm.status?.toLowerCase() || '';
    const matchesStatus =
      statusFilter === 'all' || vmStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredVMs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVMs = filteredVMs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to first page when search or filter changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'IP Address', 'SSH Port', 'Service Ports', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredVMs.map((vm) =>
        [
          vm.name,
          vm.ip || '',
          vm.ssh_port || '',
          vm.service_ports || '',
          vm.status,
          vm.created_at || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vms-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick actions
  const handleQuickAction = async (action: string, vmName: string) => {
    toast.info(`${action} ${vmName}...`);
    // TODO: Implement actual API calls
    setTimeout(() => {
      toast.success(`${action} completed`);
      refetch();
    }, 1000);
  };

  const stats = {
    total: vms.length,
    running: vms.filter((vm) => vm.status && vm.status.toLowerCase() === 'running').length,
    stopped: vms.filter((vm) => vm.status && vm.status.toLowerCase() === 'stopped').length,
    error: vms.filter((vm) => vm.status && vm.status.toLowerCase() === 'error').length,
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Virtual Machines</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Error loading VMs: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Virtual Machines</h1>
          <p className="text-muted-foreground">
            Manage and monitor your virtual machines
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total VMs</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.running}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stopped</CardTitle>
            <div className="h-2 w-2 rounded-full bg-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stopped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search VMs by name, IP..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as StatusFilter)}
                className="w-40 h-10"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="error">Error</option>
              </Select>
              <Button
                variant={liveMode ? "default" : "outline"}
                size="sm"
                onClick={() => setLiveMode(!liveMode)}
                className="h-10"
              >
                <Eye className="h-4 w-4 mr-2" />
                {liveMode ? 'Live View' : 'Managed'}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {filteredVMs.length} VM{filteredVMs.length !== 1 ? 's' : ''}
                {liveMode && ` (real-time from virsh)`}
              </span>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredVMs.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VM Grid */}
      {isLoading ? (
        <VMSkeleton />
      ) : filteredVMs.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Server className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No VMs Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search or filters.' : 'No virtual machines configured yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedVMs.map((vm) => (
            <Card key={vm.name} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate" title={vm.name}>
                      {vm.name}
                    </CardTitle>
                    {vm.ip && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{vm.ip}</p>
                    )}
                  </div>
                  <VMStatusBadge status={vm.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* VM Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Terminal className="h-3.5 w-3.5" />
                    <span className="font-mono text-xs">SSH: {vm.ssh_port || 'N/A'}</span>
                  </div>
                  {vm.service_ports && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Server className="h-3.5 w-3.5" />
                      <span className="text-xs truncate">{vm.service_ports}</span>
                    </div>
                  )}
                  {vm.created_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">{new Date(vm.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {vm.in_database === false && (
                    <div className="flex items-center gap-2 text-warning bg-warning/10 px-2 py-1 rounded">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Unmanaged</span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {vm.status?.toLowerCase() === 'running' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleQuickAction('Stop', vm.name)}
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleQuickAction('Start', vm.name)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 px-3"
                    onClick={() => handleQuickAction('Delete', vm.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3"
                    asChild
                  >
                    <Link to={`/vms/${vm.name}${liveMode ? '?mode=live' : ''}`}>
                      <Terminal className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredVMs.length)} of {filteredVMs.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-9 h-9"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
