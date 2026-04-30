'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

interface MigrationMapProps {
  data: any[]
}

export default function MigrationMap({ data }: MigrationMapProps) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  // Group data by full_name to reconstruct individual migration paths
  const members = data.reduce((acc: any, curr: any) => {
    if (!acc[curr.full_name]) acc[curr.full_name] = [];
    acc[curr.full_name].push(curr);
    return acc;
  }, {});

  const center: [number, number] = [20.5937, 78.9629] // Center of India

  return (
    <MapContainer 
      center={center} 
      zoom={5} 
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {Object.entries(members).map(([name, events]: [string, any], i) => {
        // Sort events by year
        const sortedEvents = events.sort((a: any, b: any) => (a.start_year || 0) - (b.start_year || 0));
        
        // Create points for polyline
        const points = sortedEvents
          .filter((e: any) => e.latitude && e.longitude)
          .map((e: any) => [e.latitude, e.longitude] as [number, number]);

        return (
          <div key={i}>
            {sortedEvents.map((event: any, idx: number) => (
              <Marker key={`${i}-${idx}`} position={[event.latitude, event.longitude]}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-primary">{name}</p>
                    <p className="font-semibold">{event.relationship}: {event.location_name}</p>
                    {event.start_year && <p className="text-gray-400">{event.start_year} {event.end_year ? `- ${event.end_year}` : ''}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
            {points.length > 1 && (
              <Polyline 
                positions={points} 
                color={`hsl(${(i * 137) % 360}, 70%, 50%)`}
                weight={3} 
                opacity={0.6}
                dashArray="10, 10"
              />
            )}
          </div>
        )
      })}
    </MapContainer>
  )
}
