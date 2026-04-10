import { Suspense } from "react";
import { JournalDashboard } from "@/components/journal-dashboard";

export default function JournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalDashboard />
    </Suspense>
  );
}
