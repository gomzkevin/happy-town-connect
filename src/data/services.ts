import { 
  Target,
  Fish, 
  Baby,
  Beef,
  Scissors,
  Palette,
  Wrench,
  Cake,
  ShoppingBag,
  Gem,
  Crown,
  Stethoscope,
  Hammer,
  ShoppingCart
} from "lucide-react";
import { Service } from "@/contexts/ServicesContext";

export const servicesData: Service[] = [
  {
    id: "boliche",
    icon: Target,
    title: "Boliche",
    description: "Diversión garantizada con pistas de boliche adaptadas para niños de todas las edades.",
    price: "Desde $850",
    category: "Estaciones de Juego",
    detailedDescription: "Nuestro boliche infantil cuenta con pistas especialmente diseñadas para niños, con pelotas ligeras y pinos adaptados. Los pequeños desarrollan coordinación mientras se divierten en un ambiente seguro y emocionante.",
    features: [
      "Pistas de boliche infantiles",
      "Pelotas ligeras y seguras",
      "Pinos de colores vibrantes",
      "Sistema de puntuación visual",
      "Zapatos especiales incluidos"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "4x3 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 8
  },
  {
    id: "pesca",
    icon: Fish,
    title: "Pesca",
    description: "Experiencia de pesca divertida y educativa con peces de juguete en una alberca especial.",
    price: "Desde $700",
    category: "Estaciones de Juego",
    detailedDescription: "La estación de pesca ofrece una experiencia relajante donde los niños pescan con cañas seguras en una alberca especial. Aprenden paciencia y coordinación mientras se divierten con esta actividad tradicional.",
    features: [
      "Cañas de pescar seguras",
      "Alberca especial para pesca",
      "Peces de colores magnéticos",
      "Premios por cada pesca",
      "Ambiente relajante y divertido"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "3x2 metros mínimo",
    duration: "30-45 minutos por sesión",
    ageRange: "3-10 años",
    maxParticipants: 6
  },
  {
    id: "guarderia",
    icon: Baby,
    title: "Guardería",
    description: "Espacio especial para cuidar bebés de juguete con todo lo necesario para ser un buen cuidador.",
    price: "Desde $600",
    category: "Estaciones de Juego",
    detailedDescription: "En la guardería, los niños aprenden sobre el cuidado y la responsabilidad mientras atienden a bebés de juguete. Desarrollan empatía y habilidades sociales en un ambiente tierno y educativo.",
    features: [
      "Bebés de juguete realistas",
      "Cunas y cambiadores",
      "Biberones y pañales de juguete",
      "Área de juego para bebés",
      "Delantales de cuidador"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "4-10 años",
    maxParticipants: 6
  },
  {
    id: "hamburgueseria",
    icon: Beef,
    title: "Hamburguesería",
    description: "Los pequeños chefs preparan deliciosas hamburguesas y aprenden sobre gastronomía divertida.",
    price: "Desde $800",
    category: "Gastronomía",
    detailedDescription: "En nuestra hamburguesería, los niños se convierten en chefs especializados en hamburguesas. Aprenden a preparar estos deliciosos platillos mientras desarrollan habilidades culinarias y creatividad gastronómica.",
    features: [
      "Ingredientes de juguete realistas",
      "Parrilla segura para niños",
      "Uniformes de chef incluidos",
      "Recetas paso a paso",
      "Empaques personalizados"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "3x2 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 8
  },
  {
    id: "spa",
    icon: Scissors,
    title: "Spa",
    description: "Maquillaje, peinados y tratamientos de spa para sentirse como verdaderos profesionales.",
    price: "Desde $700",
    category: "Servicios Profesionales",
    detailedDescription: "El Spa ofrece una experiencia completa de belleza y relajación. Los niños aprenden sobre cuidado personal mientras disfrutan de tratamientos relajantes y se sienten como verdaderos profesionales de la belleza.",
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
    id: "caballetes",
    icon: Palette,
    title: "Caballetes",
    description: "Estación de pintura con caballetes profesionales para crear obras de arte únicas.",
    price: "Desde $650",
    category: "Talleres Creativos",
    detailedDescription: "En la estación de caballetes, los niños pueden dar rienda suelta a su creatividad artística. Con caballetes profesionales y materiales de calidad, crean obras únicas mientras aprenden técnicas de pintura.",
    features: [
      "Caballetes ajustables",
      "Pinturas y pinceles profesionales",
      "Lienzos de diferentes tamaños",
      "Delantales protectores",
      "Marco para llevarse su obra"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "3x2 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 8
  },
  {
    id: "yesitos",
    icon: Wrench,
    title: "Yesitos",
    description: "Creación de figuras de yeso personalizadas para llevarse un recuerdo único.",
    price: "Desde $550",
    category: "Talleres Creativos",
    detailedDescription: "En el taller de yesitos, los niños crean sus propias figuras de yeso usando moldes divertidos. Aprenden sobre el proceso de moldeado mientras crean recuerdos únicos que pueden personalizar y llevarse a casa.",
    features: [
      "Variedad de moldes temáticos",
      "Yeso seguro para niños",
      "Pinturas para decorar",
      "Herramientas de moldeado",
      "Empaque especial para llevar"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "60-75 minutos por sesión",
    ageRange: "5-12 años",
    maxParticipants: 6
  },
  {
    id: "veterinaria",
    icon: Stethoscope,
    title: "Veterinaria",
    description: "Cuidan y atienden a sus mascotas de peluche como verdaderos veterinarios.",
    price: "Desde $750",
    category: "Servicios Profesionales",
    detailedDescription: "En la veterinaria, los niños se convierten en doctores de animales. Aprenden sobre el cuidado de las mascotas mientras atienden a pacientes de peluche con amor y profesionalismo.",
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
    id: "supermercado",
    icon: ShoppingCart,
    title: "Supermercado",
    description: "Aprenden sobre compras responsables y manejo de dinero de juguete.",
    price: "Desde $550",
    category: "Servicios Profesionales",
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
    id: "construccion",
    icon: Hammer,
    title: "Construcción",
    description: "Construyen proyectos increíbles usando herramientas seguras y su creatividad.",
    price: "Desde $750",
    category: "Servicios Profesionales",
    detailedDescription: "El taller de construcción permite a los niños experimentar el mundo de la construcción de manera segura. Utilizan herramientas adaptadas para crear proyectos únicos y desarrollar su creatividad y habilidades motoras.",
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
    id: "decora-cupcake",
    icon: Cake,
    title: "Decora tu cupcake",
    description: "Creatividad culinaria decorando cupcakes con diferentes técnicas y materiales.",
    price: "Desde $600",
    category: "Gastronomía",
    detailedDescription: "En este taller gastronómico, los niños aprenden técnicas de decoración de cupcakes. Utilizan diferentes materiales comestibles para crear verdaderas obras de arte culinarias que pueden disfrutar al final.",
    features: [
      "Cupcakes base incluidos",
      "Variedad de betunes y colores",
      "Decoraciones comestibles",
      "Herramientas de decoración",
      "Empaque especial para llevar"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "30-45 minutos por sesión",
    ageRange: "3-12 años",
    maxParticipants: 8
  },
  {
    id: "decora-tote-bag",
    icon: ShoppingBag,
    title: "Decora tu tote bag",
    description: "Personalización de bolsas tote con pinturas y técnicas de decoración únicas.",
    price: "Desde $500",
    category: "Talleres Creativos",
    detailedDescription: "Los niños crean su propia bolsa tote personalizada usando técnicas de decoración variadas. Aprenden sobre moda y diseño mientras crean un accesorio único que pueden usar y presumir.",
    features: [
      "Bolsas tote de calidad",
      "Pinturas textiles seguras",
      "Plantillas y sellos",
      "Pinceles y esponjas",
      "Secador para fijado"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "45-60 minutos por sesión",
    ageRange: "5-12 años",
    maxParticipants: 8
  },
  {
    id: "decora-gorra",
    icon: Crown,
    title: "Decora tu gorra",
    description: "Personalización creativa de gorras con diversos materiales y técnicas de decoración.",
    price: "Desde $450",
    category: "Talleres Creativos",
    detailedDescription: "En este taller de moda, los niños diseñan y decoran su propia gorra usando una variedad de materiales creativos. Aprenden sobre diseño y expresión personal mientras crean un accesorio único.",
    features: [
      "Gorras base de diferentes colores",
      "Materiales de decoración variados",
      "Pegamento especializado",
      "Lentejuelas y brillantina",
      "Letras y figuras adhesivas"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "30-45 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 10
  },
  {
    id: "haz-pulsera",
    icon: Gem,
    title: "Haz tu pulsera",
    description: "Creación de pulseras personalizadas con cuentas, hilos y materiales coloridos.",
    price: "Desde $400",
    category: "Talleres Creativos",
    detailedDescription: "Los niños crean sus propias pulseras usando una amplia variedad de materiales. Desarrollan habilidades motoras finas y aprenden sobre patrones y colores mientras hacen accesorios únicos.",
    features: [
      "Cuentas de colores variados",
      "Hilos y cordones resistentes",
      "Charms y dijes especiales",
      "Herramientas de joyería básicas",
      "Caja de regalo incluida"
    ],
    images: ["/api/placeholder/600/400", "/api/placeholder/600/400", "/api/placeholder/600/400"],
    spaceRequirement: "2x2 metros mínimo",
    duration: "30-45 minutos por sesión",
    ageRange: "4-12 años",
    maxParticipants: 10
  }
];