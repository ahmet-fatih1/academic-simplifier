function Error({ statusCode }) {
  return (
    <div className="errorBoundary">
      <h2>{statusCode ? `Error ${statusCode}` : "An error occurred"}</h2>
      <p>
        {statusCode === 500
          ? "Internal server error. Please try again later."
          : "Something went wrong."}
      </p>
      <button
        className="errorBoundaryBtn"
        onClick={() => (window.location.href = "/")}
      >
        Go Home
      </button>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
