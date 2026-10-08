import HomePage from "@/components/home/HomePage";
import { filtersFromSearchParams } from "@/lib/filters";

export default async function Home(props: PageProps<"/">) {
  const initialFilters = filtersFromSearchParams(await props.searchParams);
  // Keyed so new filters in the URL start a fresh page state.
  return <HomePage initialFilters={initialFilters} key={JSON.stringify(initialFilters)} />;
}
