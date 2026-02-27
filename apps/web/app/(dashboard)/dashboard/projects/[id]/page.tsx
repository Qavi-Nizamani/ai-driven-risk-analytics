import { ProjectDetailPage } from "@/components/dashboard/ProjectDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ProjectDetailPage projectId={id} />;
}
