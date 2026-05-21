import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PULSE — Gestão de Eleitores",
    short_name: "PULSE",
    description: "Cadastro e gestão de eleitores em campo",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#000000",
    theme_color: "#3b82f6",
    lang: "pt-BR",
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/logo-pulse.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-pulse.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
