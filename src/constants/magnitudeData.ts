export interface MagnitudeDatum {
  label: string
  magnitude: number
  note: string
  impact: string
}

export const MAGNITUDES: MagnitudeDatum[] = [
  {
    label: 'Ligero',
    magnitude: 4,
    note: 'perceptible, bajo impacto',
    impact:
      'Se percibe ampliamente dentro de edificios, similar al paso de un camion pesado. Objetos colgantes se balancean y vidrios o platos pueden tintinear, pero los danos estructurales son sumamente raros en edificaciones bien construidas.',
  },
  {
    label: 'Moderado',
    magnitude: 5,
    note: '10x mas amplitud que M4',
    impact:
      'Provoca sacudidas fuertes que pueden asustar a la poblacion y desplazar objetos sueltos. Puede causar grietas ligeras en yeso o revestimientos y danos menores en construcciones antiguas o debiles.',
  },
  {
    label: 'Fuerte',
    magnitude: 6,
    note: '100x mas amplitud que M4',
    impact:
      'Libera energia peligrosa capaz de causar danos severos en comunidades hasta unos 160 km del epicentro. Construcciones mal disenadas pueden colapsar parcialmente y caminar durante el evento resulta muy dificil.',
  },
  {
    label: 'Mayor',
    magnitude: 7,
    note: '1.000x mas amplitud que M4',
    impact:
      'Puede provocar desastres generalizados, danos graves en la mayoria de edificios y colapso de infraestructuras sin normas modernas. Tambien puede romper tuberias, destruir vias y activar deslizamientos o licuefaccion.',
  },
  {
    label: 'Grande / catastrofico',
    magnitude: 8,
    note: '10.000x mas amplitud que M4',
    impact:
      'Puede destruir casi por completo comunidades cercanas al epicentro, colapsar edificios masivos y deformar infraestructura. Si ocurre bajo el oceano, puede generar tsunamis devastadores en cuestion de minutos.',
  },
]
