type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;

  return (
    <section>
      <h1>Request {id}</h1>
      <p>Request details, status history, and workflow actions will be implemented next.</p>
    </section>
  );
}
