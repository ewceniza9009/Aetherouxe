import { RouterProvider } from "@tanstack/react-router";
import router from "./router";

export default function ResidentApp() {
  return <RouterProvider router={router} />;
}
