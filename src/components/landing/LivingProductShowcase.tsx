"use client";

import React, { useState, useRef, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { sound } from "@/components/audio/SoundEngine";
import { Sparkles, ArrowRight, ShieldCheck, Leaf, Flame, Layers } from "lucide-react";

interface ProductSpecimen {
  id: string;
  name: string;
  category: "cubiertos" | "papeles" | "envases" | "bolsas";
  categoryLabel: string;
  image: string;
  badge: string;
  tagline: string;
  specs: { label: string; value: string }[];
  highlight: string;
}

const SPECIMENS: ProductSpecimen[] = [
  {
    id: "cucharas-bio",
    name: "Cucharas Biodegradables Saboré",
    category: "cubiertos",
    categoryLabel: "Cubiertos Eco",
    image: "/brand/cucharas.jpg",
    badge: "100% Compostable",
    tagline: "Resistencia térmica superior con terminación natural de tacto suave.",
    specs: [
      { label: "Material", value: "Fécula / Madera" },
      { label: "Temp. Máx", value: "95°C" },
      { label: "Grado", value: "Alimentario Certificado" },
    ],
    highlight: "Alta rigidez estructural para alimentos fríos y calientes.",
  },
  {
    id: "tenedores-bio",
    name: "Tenedores Reforzados de Madera",
    category: "cubiertos",
    categoryLabel: "Cubiertos Eco",
    image: "/brand/tenedores.jpg",
    badge: "Grado Gastronómico",
    tagline: "Dientes perfilados con máxima rigidez sin astillamiento.",
    specs: [
      { label: "Acabado", value: "Pulido Mecánico" },
      { label: "Biodegradabilidad", value: "< 90 días" },
      { label: "Presentación", value: "Caja x 1.000 un" },
    ],
    highlight: "Sostenibilidad de alto estándar para catering y delivery.",
  },
  {
    id: "cuchillos-premium",
    name: "Cuchillos Ergonómicos de Mesa",
    category: "cubiertos",
    categoryLabel: "Cubiertos Eco",
    image: "/brand/cuchillos.jpg",
    badge: "Corte Preciso",
    tagline: "Filo microdentado para carnes, masas y preparaciones densas.",
    specs: [
      { label: "Largo", value: "16.5 cm" },
      { label: "Resistencia", value: "Anti-flexión" },
      { label: "Libre de Químicos", value: "100% Natural" },
    ],
    highlight: "Reemplazo directo de cubiertos plásticos tradicionales.",
  },
  {
    id: "rollo-kraft",
    name: "Rollo Kraft Industrial Reforzado",
    category: "papeles",
    categoryLabel: "Papeles & Kraft",
    image: "/catalogo_webp/rollo_kraf.webp",
    badge: "Alta Resistencia",
    tagline: "Bobina continua de fibra virgen para embalaje y protección de alimentos.",
    specs: [
      { label: "Gramaje", value: "80 g/m²" },
      { label: "Formato", value: "Bobina 40cm x 100m" },
      { label: "Propiedad", value: "Anti-desgarro" },
    ],
    highlight: "Protección óptima para delivery y despacho industrial.",
  },
  {
    id: "papel-antigrasa",
    name: "Papel Antigrasa Satinado",
    category: "papeles",
    categoryLabel: "Papeles & Kraft",
    image: "/catalogo_webp/papel_antigrasa.webp",
    badge: "Barrera Anti-aceite",
    tagline: "Tratamiento impermeable al aceite para hamburguesas, papas y frituras.",
    specs: [
      { label: "Tratamiento", value: "Barrera Lipídica" },
      { label: "Uso", value: "Contacto directo" },
      { label: "Formato", value: "Hojas cortadas" },
    ],
    highlight: "Mantiene la crocancia sin filtración de grasa ni humedad.",
  },
  {
    id: "porta-completo",
    name: "Envase Porta Completo Clásico",
    category: "envases",
    categoryLabel: "Envases Gastronómicos",
    image: "/catalogo_webp/porta_completo02.webp",
    badge: "Cierre Seguro",
    tagline: "Diseño ergonómico con aletas de sujeción para despacho térmico.",
    specs: [
      { label: "Capacidad", value: "Completo 22cm" },
      { label: "Retención", value: "Térmica y Vapor" },
      { label: "Ventilación", value: "Micro-poros" },
    ],
    highlight: "Conservación de temperatura sin condensación excesiva.",
  },
  {
    id: "bolsas-kraft",
    name: "Bolsas Kraft con Fuelle Delivery",
    category: "bolsas",
    categoryLabel: "Delivery & Bolsas",
    image: "/catalogo_webp/page-03-img-03-0020.webp",
    badge: "Base Reforzada",
    tagline: "Fondo plano auto-armable con soporte de peso para envíos gastronómicos.",
    specs: [
      { label: "Carga", value: "Hasta 5 kg" },
      { label: "Fuelle lateral", value: "14 cm" },
      { label: "Manillas", value: "Retorcidas reforzadas" },
    ],
    highlight: "Presencia estética premium para marcas de delivery.",
  },
  {
    id: "contenedores-hermeticos",
    name: "Contenedores Herméticos para Salsas",
    category: "envases",
    categoryLabel: "Envases Gastronómicos",
    image: "/catalogo_webp/page-02-img-04-0012.webp",
    badge: "Zero Fugas",
    tagline: "Sellado perimetral a presión para líquidos, emulsiones y salsas.",
    specs: [
      { label: "Capacidad", value: "2 oz / 4 oz" },
      { label: "Tapa", value: "Snap-lock" },
      { label: "Apilable", value: "Sí" },
    ],
    highlight: "Transporte seguro sin derrames en ruta de reparto.",
  },
];

const CATEGORIES = [
  { key: "todos", label: "Todo el Ecosistema" },
  { key: "cubiertos", label: "Cubiertos Eco" },
  { key: "papeles", label: "Papeles & Kraft" },
  { key: "envases", label: "Envases Gastro" },
  { key: "bolsas", label: "Bolsas & Delivery" },
];

export default function LivingProductShowcase() {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [selectedSpecimen, setSelectedSpecimen] = useState<ProductSpecimen | null>(null);

  const filtered = SPECIMENS.filter(
    (item) => activeCategory === "todos" || item.category === activeCategory
  );

  return (
    <section className="relative py-24 px-6 lg:px-16 overflow-hidden z-10">
      {/* Section Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header with Spatial Typography */}
      <div className="max-w-6xl mx-auto text-center mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Matriz de Suministros & Insumos Vivos</span>
        </div>

        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
          Ecosistema de Insumos{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BC7A3A] via-[#E6A868] to-[#BC7A3A] animate-gradient-shift">
            de Alta Gama
          </span>
        </h2>

        <p className="text-[rgba(248,246,246,0.6)] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Cada producto es un espécimen diseñado con estándares industriales:
          biodegradabilidad, tolerancia térmica y resistencia probada en la alta gastronomía.
        </p>

        {/* Dynamic Category Pill Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-10">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  sound.playClick(600);
                  setActiveCategory(cat.key);
                }}
                onMouseEnter={() => sound.playHover(480)}
                className={`px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(188,122,58,0.5)] scale-105"
                    : "bg-[rgba(255,255,255,0.03)] border border-[rgba(188,122,58,0.15)] text-[rgba(248,246,246,0.6)] hover:text-white hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Living 3D Tilt Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {filtered.map((specimen) => (
          <LivingTiltCard
            key={specimen.id}
            specimen={specimen}
            onSelect={(item) => {
              sound.playPulse();
              setSelectedSpecimen(item);
            }}
          />
        ))}
      </div>

      {/* Direct Catalog Gateway Callout */}
      <div className="max-w-3xl mx-auto mt-16 text-center">
        <Link
          href="/catalogo"
          onClick={() => sound.playClick(720)}
          onMouseEnter={() => sound.playHover(540)}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border border-primary/40 text-white font-bold text-base hover:shadow-[0_0_35px_rgba(188,122,58,0.4)] hover:scale-[1.02] transition-all group backdrop-blur-md"
        >
          <span>Explorar los +100 productos en el Catálogo Completo</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform text-primary" />
        </Link>
      </div>

      {/* Specimen Detail Modal */}
      {selectedSpecimen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in"
          onClick={() => {
            sound.playClick(440);
            setSelectedSpecimen(null);
          }}
        >
          <div
            className="relative w-full max-w-2xl bg-[#221610] border border-primary/40 rounded-3xl p-8 overflow-hidden shadow-[0_0_80px_rgba(188,122,58,0.25)] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Product Visual */}
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-gradient-to-b from-white/5 to-white/0 border border-primary/20 flex-shrink-0 flex items-center justify-center p-4">
                <Image
                  src={selectedSpecimen.image}
                  alt={selectedSpecimen.name}
                  width={220}
                  height={220}
                  className="object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)]"
                />
              </div>

              {/* Specimen Data */}
              <div className="flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase mb-2">
                  {selectedSpecimen.badge}
                </span>
                <h3 className="text-2xl font-black text-white mb-2">
                  {selectedSpecimen.name}
                </h3>
                <p className="text-[rgba(248,246,246,0.6)] text-sm mb-4 leading-relaxed">
                  {selectedSpecimen.tagline}
                </p>

                {/* Specs List */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {selectedSpecimen.specs.map((s, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                      <span className="text-[10px] uppercase text-[rgba(248,246,246,0.4)] block font-bold">
                        {s.label}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/catalogo"
                    onClick={() => sound.playClick(680)}
                    className="flex-1 text-center py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-[0_0_20px_rgba(188,122,58,0.4)] hover:bg-[#d4944e] transition-all"
                  >
                    Cotizar en Catálogo
                  </Link>
                  <button
                    onClick={() => {
                      sound.playClick(440);
                      setSelectedSpecimen(null);
                    }}
                    className="px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * 3D Holographic Tilt Card with Specular Glare Physics
 */
function LivingTiltCard({
  specimen,
  onSelect,
}: {
  specimen: ProductSpecimen;
  onSelect: (item: ProductSpecimen) => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseEnter = () => {
    sound.playHover(520);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(specimen)}
      className="group relative cursor-pointer rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(188,122,58,0.15)] p-5 transition-all duration-200 ease-out hover:border-primary/50 hover:shadow-[0_15px_40px_rgba(188,122,58,0.18)] backdrop-blur-md overflow-hidden flex flex-col justify-between"
      style={{ willChange: "transform" }}
    >
      {/* Specular Light Glare Follower */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(230,168,104,0.3) 0%, transparent 60%)`,
          opacity: glarePos.opacity,
        }}
      />

      {/* Top Meta */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary/90 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
          {specimen.categoryLabel}
        </span>
        <span className="text-[10px] font-medium text-[rgba(248,246,246,0.4)]">
          {specimen.badge}
        </span>
      </div>

      {/* Central 3D Product Float */}
      <div className="relative z-10 w-full h-44 my-2 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent p-4 group-hover:scale-105 transition-transform duration-300">
        <Image
          src={specimen.image}
          alt={specimen.name}
          fill
          className="object-contain p-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] group-hover:rotate-1 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      </div>

      {/* Bottom Information */}
      <div className="relative z-10 mt-3 pt-3 border-t border-[rgba(188,122,58,0.1)]">
        <h4 className="text-white text-base font-bold truncate group-hover:text-primary transition-colors">
          {specimen.name}
        </h4>
        <p className="text-[rgba(248,246,246,0.45)] text-xs line-clamp-2 mt-1 leading-relaxed">
          {specimen.tagline}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-primary/80 group-hover:text-primary flex items-center gap-1">
            Inspeccionar <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:shadow-[0_0_8px_#BC7A3A] transition-all" />
        </div>
      </div>
    </div>
  );
}
