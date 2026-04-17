import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, requireCharacter = false }) {
  const { user } = useAuth();

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-screen">
        <div className="text-center">
          <p className="font-display text-2xl grad-text-amber flicker">ESTABLISHING LINK</p>
          <p className="mt-3 text-xs tracking-[0.3em] text-[#8A8A8A]">
            <span className="blink">◆</span> DECRYPTING SIGNAL
          </p>
        </div>
      </div>
    );
  }

  if (user === false) return <Navigate to="/auth" replace />;

  if (requireCharacter && !user.has_character) {
    return <Navigate to="/forge" replace />;
  }

  return children;
}
