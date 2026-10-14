import Link from "next/link";

function Custom404() {
  return (
    <div className="errorBoundary">
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link href="/" className="errorBoundaryBtn">
        Go Home
      </Link>
    </div>
  );
}

export default Custom404;
