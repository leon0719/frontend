import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Input } from "@/shared/ui";
import { useGreetingStore } from "../model/use-greeting-store";

const schema = z.object({
  name: z.string().min(2, "至少 2 個字"),
});

type FormValues = z.infer<typeof schema>;

export function PlaygroundPage() {
  const { name, setName } = useGreetingStore();

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
        Playground
      </h1>
      <p className="mt-2 text-foreground/70">
        Zustand · React Hook Form · Zod · lucide-react 示範。
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            你的名字
          </label>
          <Input id="name" placeholder="輸入至少 2 個字" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <Button type="submit" className="w-fit">
          送出
        </Button>
      </form>

      {name && <p className="mt-6 text-lg font-semibold">Hello, {name}</p>}
    </main>
  );
}
