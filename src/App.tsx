import { useCallback, useState } from 'react'
import { EarthModel } from './components/EarthModel'
import { SeismicScalePage } from './components/SeismicScalePage'
import './App.css'

interface LocationRequest {
  id: number
  latitude: number
  longitude: number
}

type AppPage = 'earth' | 'scale'

function App() {
  const [activePage, setActivePage] = useState<AppPage>('earth')
  const [locationRequest, setLocationRequest] = useState<LocationRequest | null>(null)
  const [safetyMessage, setSafetyMessage] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  const handleNearestEarthquake = useCallback((distanceKm: number, magnitude: number, place: string) => {
    setSafetyMessage(
      `El sismo más cercano a ti fue a ${Math.round(distanceKm)} km, de magnitud ${magnitude.toFixed(1)}, en ${place}.`,
    )
    setIsLocating(false)
  }, [])

  const handleLocationError = useCallback(() => {
    setSafetyMessage('No pude obtener tu ubicación actual.')
    setIsLocating(false)
  }, [])

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      handleLocationError()
      return
    }

    setIsLocating(true)
    setSafetyMessage('Buscando tu ubicación...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationRequest({
          id: Date.now(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      handleLocationError,
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 12000,
      },
    )
  }

  if (activePage === 'scale') {
    return (
      <main className="app-shell app-shell-scale">
        <SeismicScalePage onBack={() => setActivePage('earth')} />
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Vista geoespacial en vivo</p>
          <h1 id="page-title">Visor de sismos</h1>
          <p className="lede">
            Un modelo 3D de la Tierra permite explorar la actividad sísmica
            reciente y sus patrones globales.
          </p>
          <div className="stats-row" aria-label="Funciones del modelo terrestre">
            <button
              className="location-check-button"
              disabled={isLocating}
              onClick={handleLocateUser}
              type="button"
            >
              {isLocating ? 'ubicando...' : '¿Estoy a salvo?'}
            </button>
            <button type="button" onClick={() => setActivePage('scale')}>
              Escala sismológica
            </button>
          </div>
          {safetyMessage ? <p className="safety-message">{safetyMessage}</p> : null}
        </div>

        <EarthModel
          focusLocation={locationRequest}
          onNearestEarthquake={handleNearestEarthquake}
        />
      </section>
    </main>
  )
}

export default App