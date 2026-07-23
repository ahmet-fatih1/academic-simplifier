function Custom404() {
  return (
    <div className="errorBoundary">
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <button
        className="errorBoundaryBtn"
        onClick={() => (window.location.href = "/")}
      >
        Go Home
      </button>
    </div>
  );
}

export default Custom404;
