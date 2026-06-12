"use client";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { timeAgo } from "../lib/format";

// Icône personnalisée (évite le problème des images Leaflet manquantes)
function truckIcon(moving) {
  const color = moving ? "#2563eb" : "#64748b";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff;font-size:15px;">🚚</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 7 });
    }
  }, []); // eslint-disable-line
  return null;
}

export default function FleetMap({ trucks, trackers }) {
  // Construit la liste initiale des positions (camion + traceur)
  const initial = useMemo(() => {
    return trucks
      .map((t) => {
        const tr = trackers.find((x) => x.id === t.tracker_id);
        if (!tr || tr.last_lat == null) return null;
        return {
          id: t.id,
          plate: t.plate,
          label: `${t.brand} ${t.model}`,
          lat: tr.last_lat,
          lng: tr.last_lng,
          speed: tr.last_speed || 0,
          last_seen: tr.last_seen,
          online: tr.status === "actif",
        };
      })
      .filter(Boolean);
  }, [trucks, trackers]);

  const [positions, setPositions] = useState(initial);

  // Simulation de déplacement (mode démo) : les camions en mouvement avancent légèrement.
  useEffect(() => {
    const id = setInterval(() => {
      setPositions((prev) =>
        prev.map((p) => {
          if (p.speed <= 0 || !p.online) return p;
          const step = (p.speed / 3600) * 0.03; // déplacement approximatif
          return {
            ...p,
            lat: p.lat + (Math.random() - 0.45) * step,
            lng: p.lng + (Math.random() - 0.3) * step,
            last_seen: new Date().toISOString(),
          };
        })
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const center = positions.length ? [positions[0].lat, positions[0].lng] : [46.6, 2.5];

  return (
    <MapContainer center={center} zoom={6} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={positions} />
      {positions.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={truckIcon(p.speed > 0 && p.online)}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{p.plate}</p>
              <p className="text-slate-500">{p.label}</p>
              <p className="mt-1">Vitesse : <strong>{Math.round(p.speed)} km/h</strong></p>
              <p>Dernier point : {timeAgo(p.last_seen)}</p>
              {!p.online && <p className="text-rose-600">⚠ Traceur hors ligne</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
