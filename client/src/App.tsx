import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";

import { useEffect } from "react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
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
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import VerifyEmailPage from "@/pages/verify-email";
import WelcomePage from "@/pages/welcome";

const BuilderPage = lazy(() => import("@/pages/builder"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const InsightsPage = lazy(() => import("@/pages/insights"));
const HubPage = lazy(() => import("@/pages/hub"));
const ConnectorsPage = lazy(() => import("@/pages/connectors"));
const ExportsPage = lazy(() => import("@/pages/exports"));
const DataSourcesPage = lazy(() => import("@/pages/data-sources"));
const GeneratePage = lazy(() => import("@/pages/generate"));
const EnhancePage = lazy(() => import("@/pages/enhance"));
const SettingsPage = lazy(() => import("@/pages/settings"));

function DemoEntry({ children }: { children: React.ReactNode }) {
  const enterDemoMode = useDashboardStore(s => s.enterDemoMode);
  useEffect(() => {
    enterDemoMode();
  }, [enterDemoMode]);
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading</p>
      </div>
    </div>
  );
}

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
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/login" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/signup" component={SignUpPage} />
      <Route path="/register" component={SignUpPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/welcome" component={WelcomePage} />
      <Route path="/demo">
        <DemoEntry>
          <Suspense fallback={<PageLoader />}><BuilderPage /></Suspense>
        </DemoEntry>
      </Route>
      <Route path="/generate">
        <Suspense fallback={<PageLoader />}><GeneratePage /></Suspense>
      </Route>
      <Route path="/enhance">
        <Suspense fallback={<PageLoader />}><EnhancePage /></Suspense>
      </Route>
      <Route path="/builder">
        <Suspense fallback={<PageLoader />}><BuilderPage /></Suspense>
      </Route>
      <Route path="/dashboard">
        <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>
      </Route>
      <Route path="/insights">
        <Suspense fallback={<PageLoader />}><InsightsPage /></Suspense>
      </Route>
      <Route path="/hub">
        <Suspense fallback={<PageLoader />}><HubPage /></Suspense>
      </Route>
      <Route path="/connectors">
        <Suspense fallback={<PageLoader />}><ConnectorsPage /></Suspense>
      </Route>
      <Route path="/exports">
        <Suspense fallback={<PageLoader />}><ExportsPage /></Suspense>
      </Route>
      <Route path="/data">
        <Suspense fallback={<PageLoader />}><DataSourcesPage /></Suspense>
      </Route>
      <Route path="/settings">
        <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
      </Route>
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
