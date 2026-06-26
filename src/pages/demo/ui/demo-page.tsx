import { useRepo } from "@/pages/demo/api/use-repo";

export function DemoPage() {
  const { data, isPending, isError } = useRepo();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Demo：TanStack Query</h1>
      {isPending && <p className="mt-4">載入中…</p>}
      {isError && <p className="mt-4 text-destructive">載入失敗</p>}
      {data && (
        <p className="mt-4">
          {data.full_name} ⭐ {data.stargazers_count}
        </p>
      )}
    </main>
  );
}
