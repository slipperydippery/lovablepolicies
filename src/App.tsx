import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ActiveLocationProvider } from "@/contexts/ActiveLocationContext";
import NotFound from "./pages/NotFound";

// App pages
const RoleSwitcher = lazy(() => import("./pages/app/RoleSwitcher"));
const MobileLayout = lazy(() => import("./pages/app/mobile/MobileLayout"));
const ChatView = lazy(() => import("./pages/app/mobile/ChatView"));
const PurchasesView = lazy(() => import("./pages/app/mobile/PurchasesView"));
const ProfileView = lazy(() => import("./pages/app/mobile/ProfileView"));
const AdminLayout = lazy(() => import("./pages/app/admin/AdminLayout"));
const ValidationView = lazy(() => import("./pages/app/admin/ValidationView"));
const BudgetView = lazy(() => import("./pages/app/admin/BudgetView"));
const InsightsView = lazy(() => import("./pages/app/admin/InsightsView"));
const PolicyHubView = lazy(() => import("./pages/app/admin/PolicyHubView"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ActiveLocationProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />

            {/* Policy as a Service app */}
            <Route path="/app" element={<RoleSwitcher />} />
            <Route path="/app/mobile" element={<MobileLayout />}>
              <Route index element={<Navigate to="chat" replace />} />
              <Route path="chat" element={<ChatView />} />
              <Route path="purchases" element={<PurchasesView />} />
              <Route path="profile" element={<ProfileView />} />
            </Route>
            <Route path="/app/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="policy-hub" replace />} />
              <Route path="validation" element={<ValidationView />} />
              <Route path="budget" element={<BudgetView />} />
              <Route path="policy-hub" element={<PolicyHubView />} />
              <Route path="insights" element={<InsightsView />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ActiveLocationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
