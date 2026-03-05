import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, FileText, Download, FileJson } from "lucide-react";

export default function ExportsPage() {
  const { toast } = useToast();

  const handleExportCSV = () => {
    // Generate mock CSV data
    const headers = ["Date", "Sector", "Perfect Order Rate", "Inventory Level", "Delay Risk"];
    const rows = [
      ["2023-10-01", "E-commerce", "98.5%", "12400", "Low"],
      ["2023-10-01", "Logistics", "92.1%", "N/A", "Medium"],
      ["2023-10-01", "Manufacturing", "99.2%", "54000", "Low"],
      ["2023-10-02", "E-commerce", "98.2%", "11800", "Medium"],
      ["2023-10-02", "Logistics", "88.4%", "N/A", "High"],
    ];
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "chain_inside_iq_export.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "CSV file has been downloaded.",
    });
  };

  const handleStubExport = (type: string) => {
    toast({
      title: `${type} Export Initiated`,
      description: `This feature is mocked in the demo version.`,
    });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Data Exports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Download your unified supply chain metrics for external reporting.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          
          {/* CSV Export - Fully Working */}
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader>
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <FileJson className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Export CSV</CardTitle>
              <CardDescription>
                Raw data dump of all current KPIs and timeseries data. Fully functional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportCSV} className="w-full gap-2">
                <Download className="w-4 h-4" /> Download CSV
              </Button>
            </CardContent>
          </Card>

          {/* Excel Export - Stub */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center mb-2 text-green-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Export Excel</CardTitle>
              <CardDescription>
                Formatted .xlsx workbook with pre-built pivot tables and charts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleStubExport('Excel')} variant="secondary" className="w-full gap-2">
                <Download className="w-4 h-4" /> Download .xlsx
              </Button>
            </CardContent>
          </Card>

          {/* PDF Export - Stub */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center mb-2 text-red-700">
                <FileText className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Export PDF</CardTitle>
              <CardDescription>
                Executive summary report with layout snapshots and AI insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleStubExport('PDF')} variant="secondary" className="w-full gap-2">
                <Download className="w-4 h-4" /> Generate PDF
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
