import { 
  ChefHat, 
  Hammer, 
  Palette, 
  Scissors, 
  Stethoscope, 
  Camera,
  ShoppingBag,
  Music
} from "lucide-react";
import { Service } from "@/contexts/ServicesContext";

export const servicesData: Service[] = [
  {
    id: "chef",
    icon: ChefHat,
    title: "Estación Chef",
    description: "Los pequeños chefs preparan deliciosas recetas y aprenden sobre cocina saludable.",
    price: "Desde $800",
    category: "Estación",
    detailedDescription: "En nuestra Estación Chef, los niños se convierten en verdaderos chefs profesionales. Aprenden a preparar recetas sencillas y deliciosas mientras desarrollan habilidades culinarias básicas y aprenden sobre alimentación saludable.",
    features: [
      "Utensilios de cocina seguros para niños",
      "Recetas adaptadas por edad",
      "Ingredientes frescos y saludables",
      "Delantales y gorros de chef",
      "Certificado de chef junior"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 8
  },
  {
    id: "construccion",
    icon: Hammer,
    title: "Taller de Construcción",
    description: "Construyen proyectos increíbles usando herramientas seguras y su creatividad.",
    price: "Desde $750",
    category: "Taller",
    detailedDescription: "El Taller de Construcción permite a los niños experimentar el mundo de la construcción de manera segura. Utilizan herramientas adaptadas para crear proyectos únicos y desarrollar su creatividad y habilidades motoras.",
    features: [
      "Herramientas seguras adaptadas para niños",
      "Materiales de construcción variados",
      "Cascos y chaleco de seguridad",
      "Proyectos guiados paso a paso",
      "Planos y diseños creativos"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "3x2 metros mínimo",
    duration: "60-75 minutos por sesión",
    ageRange: "5-12 años",
    maxParticipants: 6
  },
  {
    id: "arte",
    icon: Palette,
    title: "Estudio de Arte",
    description: "Expresan su creatividad pintando, dibujando y creando obras de arte únicas.",
    price: "Desde $650",
    category: "Estación",
    detailedDescription: "En el Estudio de Arte, los niños pueden dar rienda suelta a su creatividad. Con una amplia variedad de materiales artísticos, crean obras únicas mientras aprenden diferentes técnicas de pintura y dibujo.",
    features: [
      "Pinturas, pinceles y lienzos",
      "Materiales de manualidades variados",
      "Delantales protectores",
      "Técnicas de pintura guiadas",
      "Marco para llevarse su obra"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "3-12 años",
    maxParticipants: 8
  },
  {
    id: "belleza",
    icon: Scissors,
    title: "Salón de Belleza",
    description: "Maquillaje, peinados y tratamientos de spa para sentirse como verdaderos profesionales.",
    price: "Desde $700",
    category: "Spa",
    detailedDescription: "El Salón de Belleza ofrece una experiencia completa de spa y belleza. Los niños aprenden sobre cuidado personal mientras disfrutan de tratamientos relajantes y se sienten como verdaderos profesionales de la belleza.",
    features: [
      "Maquillaje seguro para niños",
      "Accesorios para peinados",
      "Tratamientos de spa relajantes",
      "Espejos y sillas profesionales",
      "Productos de cuidado natural"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x3 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 6
  },
  {
    id: "veterinario",
    icon: Stethoscope,
    title: "Hospital Veterinario",
    description: "Cuidan y atienden a sus mascotas de peluche como verdaderos veterinarios.",
    price: "Desde $750",
    category: "Estación",
    detailedDescription: "En el Hospital Veterinario, los niños se convierten en doctores de animales. Aprenden sobre el cuidado de las mascotas mientras atienden a pacientes de peluche con amor y profesionalismo.",
    features: [
      "Instrumental médico de juguete",
      "Mascotas de peluche pacientes",
      "Batas de doctor veterinario",
      "Mesa de exploración",
      "Certificados médicos para las mascotas"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 6
  },
  {
    id: "fotografia",
    icon: Camera,
    title: "Estudio Fotográfico",
    description: "Sesión de fotos profesional con disfraces y accesorios temáticos.",
    price: "Desde $600",
    category: "Taller",
    detailedDescription: "El Estudio Fotográfico permite a los niños experimentar ser fotógrafos profesionales y modelos. Con disfraces temáticos y accesorios divertidos, crean recuerdos únicos de su experiencia.",
    features: [
      "Cámaras seguras para niños",
      "Disfraces y accesorios variados",
      "Fondos temáticos profesionales",
      "Iluminación adecuada",
      "Fotos impresas como recuerdo"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "3x3 metros mínimo",
    duration: "30-45 minutos por sesión",
    ageRange: "3-12 años",
    maxParticipants: 10
  },
  {
    id: "supermercado",
    icon: ShoppingBag,
    title: "Supermercado",
    description: "Aprenden sobre compras responsables y manejo de dinero de juguete.",
    price: "Desde $550",
    category: "Estación",
    detailedDescription: "En el Supermercado, los niños aprenden conceptos básicos de economía y compras responsables. Manejan dinero de juguete, aprenden a hacer listas de compras y entienden el valor de los productos.",
    features: [
      "Productos de juguete variados",
      "Cajas registradoras funcionales",
      "Dinero de juguete",
      "Carritos de compras",
      "Uniformes de cajero y cliente"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "3x2 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 8
  },
  {
    id: "musica",
    icon: Music,
    title: "Estudio Musical",
    description: "Componen, cantan y tocan instrumentos en su propio estudio de grabación.",
    price: "Desde $700",
    category: "Taller",
    detailedDescription: "El Estudio Musical ofrece una experiencia completa de creación musical. Los niños aprenden a tocar instrumentos básicos, cantan sus canciones favoritas y hasta graban su propia música.",
    features: [
      "Instrumentos musicales seguros",
      "Sistema de sonido profesional",
      "Micrófono para karaoke",
      "Grabación de canciones",
      "CD personalizado como recuerdo"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "3x3 metros mínimo",
    duration: "60-75 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 8
  }
];