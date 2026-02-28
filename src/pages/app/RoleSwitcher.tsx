import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function RoleSwitcher() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const roles = [
    {
      title: t("roleSwitcher.careWorker"),
      subtitle: t("roleSwitcher.careWorkerDesc"),
      icon: "fa-user-nurse",
      path: "/app/mobile/chat",
    },
    {
      title: t("roleSwitcher.admin"),
      subtitle: t("roleSwitcher.adminDesc"),
      icon: "fa-user-tie",
      path: "/app/admin/policy-hub",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-sp-16">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-sp-24 text-center">
        <div className="space-y-sp-8">
          <h1 className="text-2xl font-heading font-medium text-foreground">
            {t("roleSwitcher.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("roleSwitcher.subtitle")}
          </p>
        </div>

        <div className="space-y-sp-12">
          {roles.map((role) => (
            <button
              key={role.path}
              onClick={() => navigate(role.path)}
              className="w-full rounded-lg border border-border bg-surface p-sp-24 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <div className="flex items-center gap-sp-16">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <i
                    className={`fa-solid ${role.icon} text-xl text-primary`}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{role.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {role.subtitle}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
