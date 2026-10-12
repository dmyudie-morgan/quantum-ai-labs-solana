import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/Primitives";

export default function NotFound() {
  return (
    <div data-testid="not-found-page">
      <PageHeader eyebrow="404" title="This coordinate is empty." intro="The page you requested does not exist. It may have moved, or the link may be mistyped.">
        <Link to="/" className="btn-primary mt-8" data-testid="not-found-home-btn">Return home <ArrowRight size={14} /></Link>
      </PageHeader>
      <div className="h-24" />
    </div>
  );
}
