import { RouterProvider } from "@tanstack/react-router";
import router from "./router";

export default function AdminApp() {
  return <RouterProvider router={router} />;
}
