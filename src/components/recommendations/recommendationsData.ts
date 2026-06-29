export type PetType = 'ninguno' | 'perro' | 'gato'

export interface PreparednessProfile {
  adults: number
  children: number
  seniors: number
  petCount: number
  petType: PetType
}

export interface ChecklistItem {
  id: string
  category: string
  description: string
  label: string
  quantity: string
}

export interface ChecklistSection {
  description: string
  items: ChecklistItem[]
  title: string
}

export interface QuizOption {
  explanation: string
  id: string
  isCorrect: boolean
  label: string
  text: string
}

export interface QuizQuestion {
  context: string
  id: string
  options: QuizOption[]
  prompt: string
}

export const BACKPACK_STORAGE_KEY = 'equakes.recommendations.backpack.v1'
export const QUIZ_DURATION_MS = 10_000

export const DEFAULT_PROFILE: PreparednessProfile = {
  adults: 2,
  children: 0,
  seniors: 0,
  petCount: 0,
  petType: 'ninguno',
}

export const PET_TYPE_OPTIONS: Array<{ label: string; value: PetType }> = [
  { label: 'Ninguno', value: 'ninguno' },
  { label: 'Perro', value: 'perro' },
  { label: 'Gato', value: 'gato' },
]

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'edificio-moderno',
    context: 'Escenario 1',
    prompt: 'Estas en el piso 5 de un edificio moderno y empieza a temblar fuerte. ¿Que haces?',
    options: [
      {
        id: 'escaleras',
        isCorrect: false,
        label: 'A',
        text: 'Correr de inmediato por las escaleras.',
        explanation:
          'Salir mientras el edificio esta en movimiento aumenta el riesgo de caidas, golpes y exposicion a vidrios o fachadas que pueden desprenderse.',
      },
      {
        id: 'zona-segura',
        isCorrect: true,
        label: 'B',
        text: 'Ubicarte en una zona de menor riesgo junto a una columna o mueble firme y proteger cabeza y cuello.',
        explanation:
          'La conducta recomendada es agacharte, cubrirte y sujetarte. Permanecer dentro y lejos de ventanas reduce trauma por caida de objetos y fragmentos.',
      },
      {
        id: 'ascensor',
        isCorrect: false,
        label: 'C',
        text: 'Tomar el ascensor para bajar mas rapido.',
        explanation:
          'El ascensor puede detenerse por fallas electricas o deformaciones del edificio. Es una de las opciones mas peligrosas durante un sismo.',
      },
    ],
  },
  {
    id: 'conduciendo',
    context: 'Escenario 2',
    prompt: 'Vas conduciendo y el auto empieza a sacudirse cerca de un puente. ¿Cual es la mejor decision inmediata?',
    options: [
      {
        id: 'bajo-puente',
        isCorrect: false,
        label: 'A',
        text: 'Detenerte justo debajo del puente para cubrirte.',
        explanation:
          'Puentes, pasos elevados y avisos pueden colapsar o desprender piezas. Debes alejarte de esas estructuras, no buscar refugio debajo de ellas.',
      },
      {
        id: 'parquear-seguro',
        isCorrect: true,
        label: 'B',
        text: 'Reducir velocidad, detenerte en un area abierta y quedarte dentro del vehiculo.',
        explanation:
          'El vehiculo protege de fragmentos pequenos y te mantiene controlado. La prioridad es detenerte lejos de postes, puentes, tuneles y cables.',
      },
      {
        id: 'salir-corriendo',
        isCorrect: false,
        label: 'C',
        text: 'Salir del vehiculo y correr a campo abierto.',
        explanation:
          'Salir apresuradamente te expone a trafico, caidas y objetos que puedan desprenderse. Es mejor detenerse primero en un sitio seguro.',
      },
    ],
  },
  {
    id: 'despues-del-sismo',
    context: 'Escenario 3',
    prompt: 'El movimiento principal termina y hay olor a gas en tu vivienda. ¿Que haces primero?',
    options: [
      {
        id: 'encender-luz',
        isCorrect: false,
        label: 'A',
        text: 'Encender la luz para revisar mejor la cocina.',
        explanation:
          'Cualquier chispa electrica puede detonar una fuga de gas. Evita interruptores, enchufes y llamas hasta asegurar la ventilacion.',
      },
      {
        id: 'ventilar-cerrar',
        isCorrect: true,
        label: 'B',
        text: 'Abrir ventilacion, cerrar la llave de gas si es seguro y evacuar con calma.',
        explanation:
          'La secuencia correcta es reducir el riesgo de explosion, cortar el suministro solo si puedes hacerlo sin exponerte y salir hacia una zona segura.',
      },
      {
        id: 'volver-dormir',
        isCorrect: false,
        label: 'C',
        text: 'Ignorarlo porque ya paso la parte peligrosa.',
        explanation:
          'Despues del sismo persisten riesgos secundarios: fugas, incendios, replicas y estructuras debilitadas. La fase posterior sigue siendo critica.',
      },
    ],
  },
]
