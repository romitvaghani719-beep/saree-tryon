import { Suspense } from "react";
import TraceStudio from "@/components/TraceStudio";

export const metadata = {
  title: "Trace Studio · Saree Try On",
  description: "Trace the drape lines for a new pose and save them as a trace file.",
};

export default function TracePage() {
  return (
    <Suspense>
      <TraceStudio />
    </Suspense>
  );
}
