import type { EarthquakePoint, FeedStatus, SeismicRoleInfo, SeismicSequence } from './types'
import { formatDate, formatMagnitude, getSeismicRoleLabel } from './utils/formatters'

function EarthquakeList({
  earthquakes,
  rolesByEarthquakeId,
  selectedId,
  onSelect,
}: {
  earthquakes: EarthquakePoint[]
  rolesByEarthquakeId: Record<string, SeismicRoleInfo>
  selectedId: string | null
  onSelect: (earthquake: EarthquakePoint) => void
}) {
  return (
    <aside className="earthquake-list" aria-label="Listado de sismos">
      <div className="earthquake-list-header">
        <p>Sismos recientes</p>
        <span>{earthquakes.length} eventos</span>
      </div>
      <div className="earthquake-list-items">
        {earthquakes.map((earthquake) => {
          const roleInfo = rolesByEarthquakeId[earthquake.id]

          return (
            <button
              aria-pressed={earthquake.id === selectedId}
              className="earthquake-list-item"
              key={earthquake.id}
              onClick={() => onSelect(earthquake)}
              type="button"
            >
              <span className="earthquake-list-mag">
                M {formatMagnitude(earthquake.magnitude)}
              </span>
              <span className="earthquake-list-place">{earthquake.place}</span>
              <span className="earthquake-list-meta">
                {earthquake.depth.toFixed(1)} km · {formatDate(earthquake.time)}
              </span>
              {roleInfo?.role && roleInfo.role !== 'background' ? (
                <span className="sequence-role-badge" data-role={roleInfo.role}>
                  {getSeismicRoleLabel(roleInfo.role)}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function EarthquakeDetail({
  earthquake,
  roleInfo,
  onClose,
}: {
  earthquake: EarthquakePoint | null
  roleInfo: SeismicRoleInfo | undefined
  onClose: () => void
}) {
  if (!earthquake) {
    return null
  }

  return (
    <aside className="earthquake-detail" aria-live="polite">
      <button
        aria-label="Cerrar detalle del sismo"
        className="earthquake-detail-close"
        onClick={onClose}
        type="button"
      >
        x
      </button>
      <p className="earthquake-detail-kicker">Detalle del impacto</p>
      <h2>{earthquake.place}</h2>
      <dl>
        <div>
          <dt>Magnitud</dt>
          <dd>{formatMagnitude(earthquake.magnitude)}</dd>
        </div>
        <div>
          <dt>Profundidad</dt>
          <dd>{earthquake.depth.toFixed(1)} km</dd>
        </div>
        <div>
          <dt>Posición</dt>
          <dd>
            {earthquake.latitude.toFixed(2)}, {earthquake.longitude.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt>Hora</dt>
          <dd>{formatDate(earthquake.time)}</dd>
        </div>
        <div>
          <dt>Secuencia</dt>
          <dd>{roleInfo?.sequenceId ?? 'sin secuencia'}</dd>
        </div>
        <div>
          <dt>Clasificación</dt>
          <dd>{getSeismicRoleLabel(roleInfo?.role ?? 'background')}</dd>
        </div>
      </dl>
      {earthquake.tsunami ? (
        <p className="earthquake-alert">Alerta de tsunami reportada</p>
      ) : null}
      {earthquake.url ? (
        <a href={earthquake.url} rel="noreferrer" target="_blank">
          Abrir evento en USGS
        </a>
      ) : null}
    </aside>
  )
}

function FeedStatus({
  sequenceCount,
  status,
  total,
}: {
  sequenceCount: number
  status: FeedStatus
  total: number
}) {
  const feedStatusMessage = status === 'ready'
    ? `${total} sismos hoy · ${sequenceCount} secuencias`
    : status === 'error'
      ? 'Fuente de USGS no disponible'
      : 'Cargando sismos de USGS'

  return (
    <div className="earthquake-feed-status" data-status={status}>
      <span>{feedStatusMessage}</span>
    </div>
  )
}

export function EarthUI({
  earthquakes,
  rolesByEarthquakeId,
  selectedEarthquake,
  seismicSequences,
  status,
  onSelectEarthquake,
  onClearSelection,
}: {
  earthquakes: EarthquakePoint[]
  rolesByEarthquakeId: Record<string, SeismicRoleInfo>
  selectedEarthquake: EarthquakePoint | null
  seismicSequences: SeismicSequence[]
  status: FeedStatus
  onSelectEarthquake: (earthquake: EarthquakePoint) => void
  onClearSelection: () => void
}) {
  return (
    <>
      <EarthquakeList
        earthquakes={earthquakes}
        rolesByEarthquakeId={rolesByEarthquakeId}
        selectedId={selectedEarthquake?.id ?? null}
        onSelect={onSelectEarthquake}
      />
      <FeedStatus status={status} total={earthquakes.length} sequenceCount={seismicSequences.length} />
      <EarthquakeDetail
        earthquake={selectedEarthquake}
        roleInfo={selectedEarthquake ? rolesByEarthquakeId[selectedEarthquake.id] : undefined}
        onClose={onClearSelection}
      />
    </>
  )
}