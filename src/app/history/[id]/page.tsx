import ProfileDetailPage from "@/components/history/ProfileDetailPage";

export const metadata = { title: "Profile — Pocket Jane" };

export default async function ProfileDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfileDetailPage id={id} />;
}
