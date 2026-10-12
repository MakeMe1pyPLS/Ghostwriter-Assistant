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
import { applyMeta } from "@/lib/page-meta";
import HomePage from "@/pages/home";
// The main funnel pages ship with the app so a direct visit renders at once.
import PricingPage from "@/pages/pricing";
import FeaturesPage from "@/pages/features";
import SupportPage from "@/pages/support";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";


// Less-visited pages (legal, contact, checkout, email links) load on demand.
const marketingLoaders = {
  ContactPage: () => import("@/pages/contact"),
  PrivacyPage: () => import("@/pages/privacy"),
  TermsPage: () => import("@/pages/terms"),
  CheckoutSuccessPage: () => import("@/pages/checkout-success"),
  CheckoutCancelPage: () => import("@/pages/checkout-cancel"),
  CheckoutStripeMockPage: () => import("@/pages/checkout-stripe-mock"),
  VerifyEmailPage: () => import("@/pages/verify-email"),
  ResetPasswordPage: () => import("@/pages/reset-password"),
};
const ContactPage = lazy(marketingLoaders.ContactPage);
const PrivacyPage = lazy(marketingLoaders.PrivacyPage);
const TermsPage = lazy(marketingLoaders.TermsPage);
const CheckoutSuccessPage = lazy(marketingLoaders.CheckoutSuccessPage);
const CheckoutCancelPage = lazy(marketingLoaders.CheckoutCancelPage);
const CheckoutStripeMockPage = lazy(marketingLoaders.CheckoutStripeMockPage);
const VerifyEmailPage = lazy(marketingLoaders.VerifyEmailPage);
const ResetPasswordPage = lazy(marketingLoaders.ResetPasswordPage);

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
    // Marketing visitors get the other marketing pages warmed once the page is idle.
    const loaders = inApp ? Object.values(pageLoaders) : Object.values(marketingLoaders);
    const w = window as any;
    // Skip on data-saver or slow connections, and never compete with the page's own loading.
    const conn = (navigator as any).connection;
    if (conn?.saveData || /(^|-)2g|3g/.test(conn?.effectiveType ?? '')) return;
    let done = false;
    const run = () => { if (done) return; done = true; loaders.forEach((load) => { load().catch(() => {}); }); };
    let id: any = 0;
    if (inApp) {
      const schedule = () => { id = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 8000 }) : window.setTimeout(run, 3000); };
      if (document.readyState === 'complete') schedule(); else window.addEventListener('load', schedule, { once: true });
      return () => { window.removeEventListener('load', schedule); w.cancelIdleCallback ? w.cancelIdleCallback(id) : clearTimeout(id); };
    }
    // Marketing: warm the other pages when the visitor shows intent (points at,
    // touches or tabs to a link), or after they've been reading for a while.
    const intent = (e: Event) => { if ((e.target as HTMLElement)?.closest?.('a')) run(); };
    const opts = { passive: true, capture: true } as AddEventListenerOptions;
    window.addEventListener('pointerover', intent, opts);
    window.addEventListener('touchstart', intent, opts);
    window.addEventListener('focusin', intent, opts);
    id = window.setTimeout(run, 12000);
    return () => {
      clearTimeout(id);
      window.removeEventListener('pointerover', intent, opts);
      window.removeEventListener('touchstart', intent, opts);
      window.removeEventListener('focusin', intent, opts);
    };
  }, [inApp]);
}

/** Title, description, canonical link and indexing rule for the current page. */
function RouteMeta() {
  const [location] = useLocation();
  useEffect(() => { applyMeta(location); }, [location]);
  return null;
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
    <Suspense fallback={<PageLoader />}>
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
      <Route path="/reset-password" component={ResetPasswordPage} />
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
    </Suspense>
  );
}

function App() {
  usePrefetchPages();
  // Accounts: restore the session, handle email links, keep workspaces synced.
  useEffect(() => { import("@/lib/cloud-sync").then((m) => m.startCloudSync()).catch(() => {}); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <Toaster />
          <RouteMeta />
          <Router />
        </TooltipProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
