import { Suspense } from "react";
import SareeTryOn from "@/components/SareeTryOn";

export default function ClassicPage() {
  return (
    <div className="godot-root">
      <Suspense>
        <SareeTryOn />
      </Suspense>
    </div>
  );
}


