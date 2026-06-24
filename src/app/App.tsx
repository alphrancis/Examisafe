import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from "../context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}