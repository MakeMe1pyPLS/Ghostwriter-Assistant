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
import SupportPage from "@/pages/support";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import CheckoutSuccessPage from "@/pages/checkout-success";
import CheckoutCancelPage from "@/pages/checkout-cancel";
import CheckoutStripeMockPage from "@/pages/checkout-stripe-mock";

import BuilderPage from "@/pages/builder";
import DashboardPage from "@/pages/dashboard";
import InsightsPage from "@/pages/insights";
import HubPage from "@/pages/hub";
import ConnectorsPage from "@/pages/connectors";
import ExportsPage from "@/pages/exports";
import DataSourcesPage from "@/pages/data-sources";
import GeneratePage from "@/pages/generate";
import EnhancePage from "@/pages/enhance";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/request-setup" component={ContactPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/checkout/cancel" component={CheckoutCancelPage} />
      <Route path="/checkout/stripe-mock" component={CheckoutStripeMockPage} />
      <Route path="/demo" component={BuilderPage} />

      <Route path="/generate" component={GeneratePage} />
      <Route path="/enhance" component={EnhancePage} />
      <Route path="/builder" component={BuilderPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/insights" component={InsightsPage} />
      <Route path="/hub" component={HubPage} />
      <Route path="/connectors" component={ConnectorsPage} />
      <Route path="/exports" component={ExportsPage} />
      <Route path="/data" component={DataSourcesPage} />
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