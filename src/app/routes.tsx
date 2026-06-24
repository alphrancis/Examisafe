import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import JuniorHighSchool from "./pages/JuniorHighSchool";
import SeniorHighSchool from "./pages/SeniorHighSchool";
import GradePage from "./pages/GradePage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/junior-high",
    Component: JuniorHighSchool,
  },
  {
    path: "/senior-high",
    Component: SeniorHighSchool,
  },
  {
    path: "/grade/:gradeLevel",
    Component: GradePage,
  },
  {
    path: "/admin",
    Component: AdminLogin,
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
