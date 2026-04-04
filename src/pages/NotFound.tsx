import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="h-24 w-24 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow">
          <span className="text-5xl">🔍</span>
        </div>
        <h1 className="text-6xl font-display font-bold text-foreground mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">Oops! This page doesn't exist</p>
        <Button 
          onClick={() => navigate('/')} 
          className="bg-gradient-primary hover:opacity-90 rounded-xl px-6 shadow-md"
        >
          <Home className="h-4 w-4 mr-2" />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
