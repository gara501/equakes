import { useCallback, useState } from 'react'
import { EarthModel } from './components/EarthModel'
import './App.css'

interface LocationRequest {
  id: number
  latitude: number
  longitude: number
}

function App() {
  const [locationRequest, setLocationRequest] = useState<LocationRequest | null>(null)
  const [safetyMessage, setSafetyMessage] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  const handleNearestEarthquake = useCallback((distanceKm: number, magnitude: number) => {
    setSafetyMessage(
      `El sismo mas cercano a ti fue a ${Math.round(distanceKm)}km, de magnitud ${magnitude.toFixed(1)}.`,
    )
    setIsLocating(false)
  }, [])

  const handleLocationError = useCallback(() => {
    setSafetyMessage('No pude obtener tu ubicacion actual.')
    setIsLocating(false)
  }, [])

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      handleLocationError()
      return
    }

    setIsLocating(true)
    setSafetyMessage('Buscando tu ubicacion...')

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

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Live geospatial view</p>
          <h1 id="page-title">Earthquake monitoring from orbit</h1>
          <p className="lede">
            A rotating 3D Earth model sets the main scene for exploring seismic
            activity and global movement patterns.
          </p>
          <div className="stats-row" aria-label="Earth model features">
            <button
              className="location-check-button"
              disabled={isLocating}
              onClick={handleLocateUser}
              type="button"
            >
              {isLocating ? 'locating...' : 'AM I save?'}
            </button>
            <span>Last 24 hours</span>
            <span>Principal Events</span>
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
