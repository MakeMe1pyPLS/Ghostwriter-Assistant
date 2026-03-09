import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import PricingPage from "@/pages/pricing";
import FeaturesPage from "@/pages/features";
import ContactPage from "@/pages/contact";

import BuilderPage from "@/pages/builder";
import DashboardPage from "@/pages/dashboard";
import InsightsPage from "@/pages/insights";
import HubPage from "@/pages/hub";
import ConnectorsPage from "@/pages/connectors";
import ExportsPage from "@/pages/exports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/demo" component={BuilderPage} />

      <Route path="/builder" component={BuilderPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/insights" component={InsightsPage} />
      <Route path="/hub" component={HubPage} />
      <Route path="/connectors" component={ConnectorsPage} />
      <Route path="/exports" component={ExportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
