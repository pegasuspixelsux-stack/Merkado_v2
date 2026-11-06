import HomePage from '@/src/components/HomePage';
import { loadHomeData } from '@/src/lib/homeData';

// Rebuilt at most once a minute, so new or featured listings appear quickly
// without a database request for every visitor.
export const revalidate = 60;

export default async function Page() {
  const { properties } = await loadHomeData();
  return <HomePage initialProperties={properties} />;
}
