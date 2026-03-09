import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

export default function ContactPage() {
  return (
    <MarketingLayout>
      <div className="pt-20 pb-32 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">Request Custom Setup.</h1>
          <p className="text-lg text-slate-500 font-medium">Let's build your analytics system. Tell us what you need and our experts will help you get started.</p>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Name</Label>
                <Input placeholder="John Doe" className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Company</Label>
                <Input placeholder="Acme Corp" className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email</Label>
                <Input type="email" placeholder="john@example.com" className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Industry</Label>
                <Select>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Select Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">What do you need help with?</Label>
              <Select>
                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Select Request Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom-dashboard">Custom Dashboard Build</SelectItem>
                  <SelectItem value="database-setup">Database Setup</SelectItem>
                  <SelectItem value="kpi-engineering">KPI Engineering</SelectItem>
                  <SelectItem value="general">General Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Preferred Tool/Software</Label>
              <Input placeholder="e.g. Power BI, Excel, Google Sheets" className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Message</Label>
              <Textarea placeholder="Tell us more about your project..." className="min-h-[120px] bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-xl resize-y" />
            </div>

            <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
              Request Setup Help <Send className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </MarketingLayout>
  );
}
