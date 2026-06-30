import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button, Input } from "@/shared/ui";
import { useGreetingStore } from "../model/use-greeting-store";

type PlaygroundFieldKey = "pages.playground.nameMin";

const schema = z.object({
  name: z.string().min(2, "pages.playground.nameMin" satisfies PlaygroundFieldKey),
});

type FormValues = z.infer<typeof schema>;

export function PlaygroundPage() {
  const { name, setName } = useGreetingStore();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => setName(data.name);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Sparkles size={24} />
        {t("pages.playground.title")}
      </h1>
      <p className="mt-2 text-foreground/70">{t("pages.playground.subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            {t("pages.playground.nameLabel")}
          </label>
          <Input id="name" placeholder={t("pages.playground.namePlaceholder")} {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{t(errors.name.message as PlaygroundFieldKey)}</p>
          )}
        </div>
        <Button type="submit" className="w-fit">
          {t("pages.playground.submit")}
        </Button>
      </form>

      {name && <p className="mt-6 text-lg font-semibold">{t("pages.playground.greeting", { name })}</p>}
    </main>
  );
}
