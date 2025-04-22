import React from "react";
import ErrorContent from "./ErrorContent";
import SEOMeta from "./SEOMeta";

const NotFound: React.FC = () => {
  return (
    <div className="relative">
      <SEOMeta
        title="404 - Page Not Found"
        description="The page you are looking for does not exist."
        robots="noindex, nofollow"
      />

      <ErrorContent
        title="404 - Page Not Found"
        message="The page you're looking for doesn't exist or has been moved."
        showBackButton={true}
        backTo="/"
        backLabel="Back to Home"
      />
    </div>
  );
};

export default NotFound;
