"use client";

import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

const defaultCenter: [number, number] = [-6.2, 106.816666];

function MapViewport({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => { map.setView([latitude, longitude], map.getZoom(), { animate: true }); }, [latitude, longitude, map]);
  return null;
}

function MapClickHandler({ onSelect }: { onSelect: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click(event) { onSelect(event.latlng.lat, event.latlng.lng); } });
  return null;
}

export function WorkRegionMap({ latitude, longitude, radiusMeters, onSelect, readOnly = false }: { latitude?: number; longitude?: number; radiusMeters: number; onSelect?: (latitude: number, longitude: number) => void; readOnly?: boolean }) {
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const center: [number, number] = hasCoordinates ? [latitude!, longitude!] : defaultCenter;
  return <div className="overflow-hidden rounded-xl border border-slate-200" aria-label={readOnly ? "Peta wilayah kerja" : "Peta untuk memilih titik wilayah kerja"}><MapContainer center={center} zoom={hasCoordinates ? 15 : 11} scrollWheelZoom className="h-72 w-full" aria-label="Peta OpenStreetMap"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{hasCoordinates && <><MapViewport latitude={latitude!} longitude={longitude!} /><Circle center={center} radius={radiusMeters} pathOptions={{ color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 0.16 }} /><CircleMarker center={center} radius={8} pathOptions={{ color: "#1d4ed8", fillColor: "#2563eb", fillOpacity: 1 }} /></>}{!readOnly && onSelect && <MapClickHandler onSelect={onSelect} />}</MapContainer></div>;
}
