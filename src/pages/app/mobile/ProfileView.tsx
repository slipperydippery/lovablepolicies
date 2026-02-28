import { useTranslation } from "react-i18next";

export default function ProfileView() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-sp-16 py-sp-24">
      <i className="fa-solid fa-user text-4xl text-muted-foreground/40 mb-sp-16" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-foreground">{t("profile.title")}</h2>
      <p className="text-sm text-muted-foreground mt-sp-8">{t("profile.comingSoon")}</p>
    </div>
  );
}
