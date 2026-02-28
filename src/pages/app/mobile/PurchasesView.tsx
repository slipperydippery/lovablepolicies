import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type DeliveryStatus = "pending" | "received" | "hidden";

const historyItems = [
  { id: "h1", item: "Umbrella", vendor: "Blokker", amount: "€ 15.00", date: "Feb 18" },
  { id: "h2", item: "Coffee supplies", vendor: "Albert Heijn", amount: "€ 8.20", date: "Feb 15" },
  { id: "h3", item: "First aid refill", vendor: "Etos", amount: "€ 22.50", date: "Feb 10" },
];

export default function PurchasesView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"deliveries" | "history">("deliveries");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("pending");

  const handleMarkReceived = () => {
    setDeliveryStatus("received");
    toast.success(t("purchases.packageReceived"));
    setTimeout(() => setDeliveryStatus("hidden"), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-border shrink-0">
        {(["deliveries", "history"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-sp-12 text-sm font-medium text-center transition-colors border-b-2",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "deliveries" ? t("purchases.pendingDeliveries") : t("purchases.history")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-sp-16 py-sp-16">
        {activeTab === "deliveries" ? (
          deliveryStatus === "hidden" ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <i className="fa-solid fa-circle-check text-4xl text-green-500 mb-sp-12" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{t("purchases.allProcessed")}</p>
            </div>
          ) : (
            <div
              className={cn(
                "rounded-xl border p-sp-16 transition-all duration-500",
                deliveryStatus === "received"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-300"
                  : "border-border bg-background"
              )}
            >
              {deliveryStatus === "received" ? (
                <div className="flex flex-col items-center py-sp-16 text-green-600 dark:text-green-400">
                  <i className="fa-solid fa-circle-check text-4xl mb-sp-8" aria-hidden="true" />
                  <span className="text-lg font-semibold">{t("purchases.receivedLogged")}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-sp-12">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{t("purchases.silicone")}</h3>
                      <p className="text-xs text-muted-foreground mt-sp-4">{t("purchases.vendor")}</p>
                    </div>
                    <Badge colorScheme="warning" status label={t("purchases.expectedToday")} />
                  </div>
                  <div className="space-y-sp-4 mb-sp-16">
                    <div className="flex items-center gap-sp-8 text-xs text-muted-foreground">
                      <i className="fa-solid fa-location-dot w-4 text-center" aria-hidden="true" />
                      <span>{t("purchases.reception")}</span>
                    </div>
                    <div className="flex items-center gap-sp-8 text-xs text-muted-foreground">
                      <i className="fa-solid fa-tag w-4 text-center" aria-hidden="true" />
                      <span>{t("purchases.medicalException")}</span>
                    </div>
                  </div>
                  <Button variant="solid" className="w-full h-12 text-base" onClick={handleMarkReceived}>
                    <i className="fa-solid fa-box-open mr-sp-8" aria-hidden="true" />
                    {t("purchases.markReceived")}
                  </Button>
                </>
              )}
            </div>
          )
        ) : (
          <div className="space-y-sp-8">
            {historyItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-sp-16 py-sp-12">
                <div>
                  <span className="text-sm font-medium text-foreground">{item.item}</span>
                  <span className="text-xs text-muted-foreground ml-sp-8">{item.vendor}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">{item.amount}</span>
                  <span className="text-xs text-muted-foreground block">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
