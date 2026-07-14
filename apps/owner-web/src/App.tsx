import { RouterProvider } from "@tanstack/react-router";
import router from "./router";

export default function OwnerApp() {
  return <RouterProvider router={router} />;
}
