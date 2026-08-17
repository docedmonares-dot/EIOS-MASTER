import AppRouter from "./router/AppRouter";
import { AuthProvider } from "./modules/authentication/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
