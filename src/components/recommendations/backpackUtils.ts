import type {
  ChecklistSection,
  PreparednessProfile,
} from './recommendationsData'

const CONTINGENCY_DAYS = 3
const DIAPERS_PER_CHILD_PER_DAY = 6
const FORMULA_PORTIONS_PER_CHILD_PER_DAY = 3
const WIPES_PACKS_PER_CHILD = 1
const PET_FOOD_RATIONS_PER_DAY = 2

export function buildEmergencyChecklist(
  profile: PreparednessProfile,
): ChecklistSection[] {
  const adults = Math.max(0, profile.adults)
  const children = Math.max(0, profile.children)
  const seniors = Math.max(0, profile.seniors)
  const petCount =
    profile.petType === 'ninguno' ? 0 : Math.max(0, profile.petCount)
  const totalPeople = adults + children + seniors
  const totalBeings = totalPeople + petCount
  const waterLiters = Math.max(3, totalBeings * CONTINGENCY_DAYS)
  const mealPortions = Math.max(3, totalPeople * CONTINGENCY_DAYS)

  return [
    {
      title: 'Agua y alimentos',
      description: 'Suministros base para 72 horas de autonomia.',
      items: [
        {
          id: 'water',
          category: 'Agua y alimentos',
          label: 'Agua potable',
          quantity: `${waterLiters} litros`,
          description:
            'Calculado con 1 litro por persona o mascota al dia durante 3 dias.',
        },
        {
          id: 'food',
          category: 'Agua y alimentos',
          label: 'Raciones no perecederas',
          quantity: `${mealPortions} porciones`,
          description:
            'Incluye barras, enlatados de apertura facil y alimentos listos para consumo.',
        },
        ...(petCount > 0
          ? [
              {
                id: 'pet-food',
                category: 'Agua y alimentos',
                label: `Comida para ${profile.petType === 'perro' ? 'perro' : 'gato'}`,
                quantity: `${petCount * PET_FOOD_RATIONS_PER_DAY * CONTINGENCY_DAYS} raciones`,
                description:
                  'Reserva comida seca o humeda y un recipiente plegable para las mascotas.',
              },
            ]
          : []),
        ...(children > 0
          ? [
              {
                id: 'baby-formula',
                category: 'Agua y alimentos',
                label: 'Formula o alimento infantil',
                quantity: `${children * FORMULA_PORTIONS_PER_CHILD_PER_DAY * CONTINGENCY_DAYS} porciones`,
                description:
                  'Incluye leche, papillas o alimentos adaptados a la edad del bebe o nino pequeno.',
              },
              {
                id: 'baby-bottles',
                category: 'Agua y alimentos',
                label: 'Biberones o vasos entrenadores',
                quantity: `${Math.max(1, children)} unidades`,
                description:
                  'Llevalos limpios y listos para usar, preferiblemente con tapa de transporte.',
              },
            ]
          : []),
      ],
    },
    {
      title: 'Higiene',
      description: 'Elementos para mantener limpieza y confort basico.',
      items: [
        {
          id: 'soap',
          category: 'Higiene',
          label: 'Jabon, gel antibacterial y toallas',
          quantity: `${Math.max(1, Math.ceil(totalPeople / 2))} kit`,
          description:
            'Combina higiene de manos, toallas pequenas y bolsas para residuos.',
        },
        {
          id: 'toilet-paper',
          category: 'Higiene',
          label: 'Papel higienico y panos humedos',
          quantity: `${Math.max(2, Math.ceil(totalPeople * 1.5))} rollos / paquetes`,
          description:
            'Mantiene el cuidado basico si se interrumpe el suministro de agua.',
        },
        ...(children > 0
          ? [
              {
                id: 'baby-diapers',
                category: 'Higiene',
                label: 'Panales y toallitas para bebes',
                quantity: `${children * DIAPERS_PER_CHILD_PER_DAY * CONTINGENCY_DAYS} panales y ${Math.max(1, children * WIPES_PACKS_PER_CHILD)} paquete(s)`,
                description:
                  'Cantidad recomendada para cubrir cambios frecuentes durante la contingencia.',
              },
            ]
          : []),
        ...(seniors > 0
          ? [
              {
                id: 'senior-care',
                category: 'Higiene',
                label: 'Apoyos de cuidado personal para adultos mayores',
                quantity: `${Math.max(1, seniors)} kit`,
                description:
                  'Considera protectores absorbentes, panos suaves y elementos de apoyo segun necesidad.',
              },
            ]
          : []),
      ],
    },
    {
      title: 'Botiquin',
      description: 'Primeros auxilios y tratamiento de uso habitual.',
      items: [
        {
          id: 'first-aid',
          category: 'Botiquin',
          label: 'Botiquin de primeros auxilios',
          quantity: '1 completo',
          description:
            'Debe incluir gasas, vendas, analgesicos, tijeras, guantes y antiseptico.',
        },
        {
          id: 'thermal-blanket',
          category: 'Botiquin',
          label: 'Mantas termicas y mascarillas',
          quantity: `${Math.max(2, totalPeople)} unidades`,
          description:
            'Ayudan a manejar frio, polvo y permanencias prolongadas fuera de casa.',
        },
        ...(seniors > 0
          ? [
              {
                id: 'senior-medicine',
                category: 'Botiquin',
                label: 'Medicamentos de uso continuo',
                quantity: `${seniors} kit personalizado`,
                description:
                  'Reserva dosis para varios dias y registra nombre, horario y via de administracion.',
              },
            ]
          : []),
      ],
    },
    {
      title: 'Herramientas y extras',
      description: 'Recursos para comunicacion, orientacion y energia.',
      items: [
        {
          id: 'flashlight',
          category: 'Herramientas y extras',
          label: 'Linterna y pilas de repuesto',
          quantity: `${Math.max(1, Math.ceil(totalPeople / 2))} kit`,
          description:
            'Prioriza linternas LED y pilas almacenadas por separado.',
        },
        {
          id: 'radio',
          category: 'Herramientas y extras',
          label: 'Radio, cargador y bateria externa',
          quantity: '1 set',
          description:
            'Permite recibir alertas y mantener un telefono util si falla la energia.',
        },
        {
          id: 'documents',
          category: 'Herramientas y extras',
          label: 'Documentos, efectivo y contactos',
          quantity: '1 sobre impermeable',
          description:
            'Guarda copias de identificacion, datos medicos y telefonos de emergencia.',
        },
        {
          id: 'whistle',
          category: 'Herramientas y extras',
          label: 'Silbato, multiusos y guantes de trabajo',
          quantity: '1 set',
          description:
            'Mejora la capacidad de pedir ayuda y manipular objetos con menor riesgo.',
        },
      ],
    },
  ]
}

export function getHouseholdSummary(profile: PreparednessProfile) {
  const petCount =
    profile.petType === 'ninguno' ? 0 : Math.max(0, profile.petCount)

  return [
    `${profile.adults} adulto${profile.adults === 1 ? '' : 's'}`,
    `${profile.children} nino${profile.children === 1 ? '' : 's'}`,
    `${profile.seniors} adulto${profile.seniors === 1 ? ' mayor' : 's mayores'}`,
    petCount > 0
      ? `${petCount} ${profile.petType}${petCount === 1 ? '' : 's'}`
      : 'sin mascotas',
  ]
}
