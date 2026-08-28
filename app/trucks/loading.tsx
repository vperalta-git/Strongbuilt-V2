import { Container } from "@/components/ui/container"

export default function TrucksLoading() {
  return (
    <div className="bg-paper pb-20 pt-48">
      <Container>
        <div className="h-24 max-w-3xl animate-pulse bg-sail" />
        <div className="mt-14 grid gap-8 lg:grid-cols-[265px_1fr]">
          <div className="hidden h-[560px] animate-pulse bg-sail lg:block" />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse bg-sail" />)}
          </div>
        </div>
      </Container>
    </div>
  )
}
