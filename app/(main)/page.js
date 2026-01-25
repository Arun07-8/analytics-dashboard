import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

// You might need to move data.json or import it correctly. 
// Assuming it is in the same directory or check where it was generated.
// If it is strictly for this page, we can keep it here or mocking it.
// I will assume for now it was generated alongside page.js by shadcn command.

// We need to fetch data or import it.
// Since the previous file imported data from "./data.json", I will assume it exists there.
// If not, I'll create a mockup.
import data from "./data.json"

export default function Page() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        {/* Ensure DataTable handles the data structure correctly */}
        <DataTable data={data} />
      </div>
    </div>
  )
}
