import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";

import { useEffect } from "react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { MotionConfig } from "framer-motion";
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

const pageLoaders = {
  BuilderPage: () => import("@/pages/builder"),
  DashboardPage: () => import("@/pages/dashboard"),
  InsightsPage: () => import("@/pages/insights"),
  BottlenecksPage: () => import("@/pages/bottlenecks"),
  RecommendationsPage: () => import("@/pages/recommendations"),
  PipelinePage: () => import("@/pages/pipeline"),
  HubPage: () => import("@/pages/hub"),
  ConnectorsPage: () => import("@/pages/connectors"),
  ExportsPage: () => import("@/pages/exports"),
  DataSourcesPage: () => import("@/pages/data-sources"),
  GeneratePage: () => import("@/pages/generate"),
  EnhancePage: () => import("@/pages/enhance"),
  SettingsPage: () => import("@/pages/settings"),
  OnboardingPage: () => import("@/pages/onboarding"),
  PlanPage: () => import("@/pages/plan"),
  CollabsPage: () => import("@/pages/collabs"),
  KpiLibraryPage: () => import("@/pages/kpi-library"),
  ConsultPage: () => import("@/pages/consult"),
  ClientsPage: () => import("@/pages/clients"),
  ClientReportPage: () => import("@/pages/client-report"),
};
const BuilderPage = lazy(pageLoaders.BuilderPage);
const DashboardPage = lazy(pageLoaders.DashboardPage);
const InsightsPage = lazy(pageLoaders.InsightsPage);
const BottlenecksPage = lazy(pageLoaders.BottlenecksPage);
const RecommendationsPage = lazy(pageLoaders.RecommendationsPage);
const PipelinePage = lazy(pageLoaders.PipelinePage);
const HubPage = lazy(pageLoaders.HubPage);
const ConnectorsPage = lazy(pageLoaders.ConnectorsPage);
const ExportsPage = lazy(pageLoaders.ExportsPage);
const DataSourcesPage = lazy(pageLoaders.DataSourcesPage);
const GeneratePage = lazy(pageLoaders.GeneratePage);
const EnhancePage = lazy(pageLoaders.EnhancePage);
const SettingsPage = lazy(pageLoaders.SettingsPage);
const OnboardingPage = lazy(pageLoaders.OnboardingPage);
const PlanPage = lazy(pageLoaders.PlanPage);
const CollabsPage = lazy(pageLoaders.CollabsPage);
const KpiLibraryPage = lazy(pageLoaders.KpiLibraryPage);
const ConsultPage = lazy(pageLoaders.ConsultPage);
const ClientsPage = lazy(pageLoaders.ClientsPage);
const ClientReportPage = lazy(pageLoaders.ClientReportPage);

const MARKETING = ["/", "/pricing", "/features", "/contact", "/support", "/privacy", "/terms", "/request-setup"];

/**
 * Once someone is inside the app, warm the other pages' code in the background
 * so moving between pages is instant. Marketing visitors don't download it.
 */
function usePrefetchPages() {
  const [location] = useLocation();
  const inApp = !MARKETING.includes(location);
  useEffect(() => {
    if (!inApp) return;
    const run = () => Object.values(pageLoaders).forEach((load) => { load().catch(() => {}); });
    const w = window as any;
    const id = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 4000 }) : window.setTimeout(run, 2500);
    return () => (w.cancelIdleCallback ? w.cancelIdleCallback(id) : clearTimeout(id));
  }, [inApp]);
}

function DemoEntry({ children }: { children: React.ReactNode }) {
  const enterDemoMode = useDashboardStore(s => s.enterDemoMode);
  useEffect(() => {
    enterDemoMode();
  }, [enterDemoMode]);
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="min-h-[100dvh] bg-[#F4F7FA]" role="status" aria-label="Loading">
      <div className="fixed inset-x-0 top-0 h-[3px] overflow-hidden bg-teal-600/10">
        <div className="ciq-loadbar h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
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
      <Route path="/welcome">
        <Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>
      </Route>
      <Route path="/onboarding">
        <Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>
      </Route>
      <Route path="/plan">
        <Suspense fallback={<PageLoader />}><PlanPage /></Suspense>
      </Route>
      <Route path="/app">
        <Suspense fallback={<PageLoader />}><PlanPage /></Suspense>
      </Route>
      <Route path="/collabs">
        <Suspense fallback={<PageLoader />}><CollabsPage /></Suspense>
      </Route>
      <Route path="/consult">
        <Suspense fallback={<PageLoader />}><ConsultPage /></Suspense>
      </Route>
      <Route path="/consult/:kind">
        <Suspense fallback={<PageLoader />}><ConsultPage /></Suspense>
      </Route>
      <Route path="/clients">
        <Suspense fallback={<PageLoader />}><ClientsPage /></Suspense>
      </Route>
      <Route path="/clients/:id/report">
        <Suspense fallback={<PageLoader />}><ClientReportPage /></Suspense>
      </Route>
      <Route path="/kpis">
        <Suspense fallback={<PageLoader />}><KpiLibraryPage /></Suspense>
      </Route>
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
      <Route path="/bottlenecks">
        <Suspense fallback={<PageLoader />}><BottlenecksPage /></Suspense>
      </Route>
      <Route path="/recommendations">
        <Suspense fallback={<PageLoader />}><RecommendationsPage /></Suspense>
      </Route>
      <Route path="/pipeline">
        <Suspense fallback={<PageLoader />}><PipelinePage /></Suspense>
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
  usePrefetchPages();
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
