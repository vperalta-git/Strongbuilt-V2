import { Container } from "@/components/ui/container"

export default function TruckDetailLoading() {
  return (
    <div className="bg-paper pb-24 pt-44">
      <Container>
        <div className="grid border border-line lg:grid-cols-2">
          <div className="aspect-[4/3] animate-pulse bg-sail" />
          <div className="p-8 lg:p-12">
            <div className="h-5 w-32 animate-pulse bg-sail" />
            <div className="mt-8 h-28 animate-pulse bg-sail" />
            <div className="mt-8 h-24 animate-pulse bg-sail" />
          </div>
        </div>
      </Container>
    </div>
  )
}
