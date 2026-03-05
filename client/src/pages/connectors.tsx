import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  FileSpreadsheet, 
  BarChart, 
  CloudCog,
  CheckCircle2,
  Plug,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const connectors = [
  {
    id: "excel",
    name: "Microsoft Excel",
    description: "Connect via OneDrive or upload static files directly.",
    icon: FileSpreadsheet,
    color: "text-green-600 bg-green-100",
    status: "connected",
    lastSync: "2 hours ago"
  },
  {
    id: "gsheets",
    name: "Google Sheets",
    description: "Live sync your Google Workspace spreadsheets.",
    icon: FileSpreadsheet,
    color: "text-emerald-600 bg-emerald-100",
    status: "available",
    lastSync: null
  },
  {
    id: "powerbi",
    name: "Power BI",
    description: "Import datasets from your Power BI workspaces.",
    icon: BarChart,
    color: "text-yellow-600 bg-yellow-100",
    status: "available",
    lastSync: null
  },
  {
    id: "tableau",
    name: "Tableau",
    description: "Connect your Tableau Cloud data sources.",
    icon: CloudCog,
    color: "text-indigo-600 bg-indigo-100",
    status: "available",
    lastSync: null
  },
  {
    id: "sql",
    name: "SQL Database",
    description: "Direct connection to PostgreSQL, MySQL, or SQL Server.",
    icon: Database,
    color: "text-blue-600 bg-blue-100",
    status: "available",
    lastSync: null
  }
];

export default function ConnectorsPage() {
  const { toast } = useToast();

  const handleConnect = (name: string) => {
    toast({
      title: "Connection Initiated",
      description: `Opening OAuth flow for ${name}... (Demo)`,
    });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Data Connectors</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Connect external data sources to power your supply chain dashboards.
            </p>
          </div>
          <Button className="gap-2">
            <Plug className="w-4 h-4" />
            Custom API Request
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectors.map((connector) => (
            <Card key={connector.id} className="border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              {connector.status === 'connected' && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 text-emerald-600 flex justify-end items-start p-2 rounded-bl-3xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg ${connector.color} flex items-center justify-center mb-4`}>
                  <connector.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {connector.name}
                  {connector.status === 'connected' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  {connector.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {connector.status === 'connected' ? (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Sync: {connector.lastSync}
                    </span>
                    <Button variant="outline" size="sm" className="h-8">Configure</Button>
                  </div>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="w-full mt-2 group">
                        Connect <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connect to {connector.name}</DialogTitle>
                        <DialogDescription>
                          You are about to authorize ChainInsideIQ to access your {connector.name} data.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                         <div className={`w-16 h-16 rounded-xl ${connector.color} flex items-center justify-center`}>
                           <connector.icon className="w-8 h-8" />
                         </div>
                         <p className="text-sm text-slate-600 max-w-xs">
                           In a live environment, this would open a secure OAuth window or ask for database credentials.
                         </p>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => handleConnect(connector.name)}>
                          Mock Connection
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

// Quick inline component to avoid another import for clock
function Clock({className}: {className?: string}) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
