import ClientFoodPage from "./client-page";
import { getFoodSlugs } from "@/lib/data/nutrition-repo";

type FoodDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getFoodSlugs().map((slug) => ({ slug }));
}

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const { slug } = await params;
  return <ClientFoodPage slug={slug} />;
}
