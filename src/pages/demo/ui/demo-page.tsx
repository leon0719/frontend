import { useTranslation } from "react-i18next";
import { useRepo } from "@/pages/demo/api/use-repo";

export function DemoPage() {
  const { data, isPending, isError } = useRepo();
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">{t("pages.demo.title")}</h1>
      {isPending && <p className="mt-4">{t("pages.demo.loading")}</p>}
      {isError && <p className="mt-4 text-destructive">{t("pages.demo.error")}</p>}
      {data && (
        <p className="mt-4">
          {data.full_name} ⭐ {data.stargazers_count}
        </p>
      )}
    </main>
  );
}
