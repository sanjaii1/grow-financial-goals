// Update this page (the content is just a fallback if you fail to update the page)

import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground mb-4">
          Start building your amazing project here!
        </p>
        <Link
          to="/auth"
          className="inline-block mt-4 text-primary underline hover-scale transition-transform"
        >
          Sign up / Login
        </Link>
      </div>
    </div>
  );
};

export default Index;
