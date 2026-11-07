import type { Metadata, Viewport } from "next";
import ExperienceLandingClient from "@/components/landing/ExperienceLandingClient";

export const metadata: Metadata = {
  title: "Saboré — Insumos y suministros gastronómicos",
  description:
    "Catálogo con precios por mayor y detalle, listas guardadas y despacho coordinado para su negocio.",
};

export const viewport: Viewport = {
  themeColor: "#f3f2f0",
};

export default function LoginPage() {
  return <ExperienceLandingClient />;
}
