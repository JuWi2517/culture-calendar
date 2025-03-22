
import React, { useEffect, useState } from 'react';
import "../App.css"

const API_KEY = 'AIzaSyAMX66a24D59QVR8Exs_8fQbqdw2CztSQ4';
const TIME_MIN = new Date().toISOString();

// Mapování barvy ID na hex barvy
const colorMap = {
    "1": "#a4bdfc",
    "2": "#7ae7bf",
    "3": "#6615a3",
    "4": "#ff887c",
    "5": "#fbd75b",
    "6": "#21b526",
    "7": "#46d6db",
    "8": "#b52144",
    "9": "#5484ed",
    "10": "#ad985c",
    "11": "#dc2127"
};

// Mapování barvy ID na kategorii
const categoryMap = {
    "3": "Koncert",
    "4": "Divadlo",
    "6": "Sport",
    "8": "Pro děti",
    "10": "Přednáška",
    "1": "Workshop",
    "2": "Seminář",
    "5": "Setkání",
    "7": "Konference",
    "9": "Párty",
    "11": "Jiné"
};

const categoryFilterList = ["Koncert", "Divadlo", "Sport", "Pro děti", "Přednáška"];

// Funkce pro získání geolokačních dat z adresy
const getGeocodingData = async (address) => {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            place_id: result.place_id
        };
    } else {
        throw new Error("Chyba API geokódování: " + data.status);
    }
};

// Funkce pro extrakci URL z HTML popisu události
const extractUrlFromDescription = (description) => {
    if (!description) return null;
    const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=(['"])(.*?)\1/;
    const anchorMatch = description.match(anchorRegex);
    if (anchorMatch && anchorMatch[2]) return anchorMatch[2];
    const strippedText = description.replace(/<[^>]*>/g, '');
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlMatch = strippedText.match(urlRegex);
    if (urlMatch && urlMatch.length > 0) return urlMatch[0];
    const wwwRegex = /(www\.[^\s]+)/g;
    const wwwMatch = strippedText.match(wwwRegex);
    if (wwwMatch && wwwMatch.length > 0) {
        let url = wwwMatch[0];
        if (!url.startsWith("http")) url = "https://" + url;
        return url;
    }
    return null;
};

const EventCalendar = () => {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [geoCache, setGeoCache] = useState({});
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [availableMonths, setAvailableMonths] = useState([]);

    // Načítání událostí z API + uložení měsíců, ve kterých jsou události
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('http://192.168.100.102:3001/api/events'); // nahraď svou IP
                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();
                setEvents(data);

                const months = Array.from(new Set(data.map(event => {
                    const date = new Date(event.start?.dateTime || event.start?.date);
                    const rawMonth = date.toLocaleString('cs-CZ', { month: 'long' });
                    return rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
                })));
                setAvailableMonths(months);

            } catch (err) {
                console.error("Chyba při načítání událostí:", err);
                setError(err.message);
            }
        };
        fetchEvents();
    }, []);

    // Geokódování adres pro mapové odkazy
    useEffect(() => {
        const fetchGeocoding = async () => {
            const addresses = [...new Set(events.filter(e => e.location).map(e => e.location))];
            addresses.forEach(async (address) => {
                if (!geoCache[address]) {
                    try {
                        const geocodeData = await getGeocodingData(address);
                        setGeoCache(prev => ({ ...prev, [address]: geocodeData }));
                    } catch (err) {
                        console.error("Chyba při geokódování adresy:", address, err);
                    }
                }
            });
        };
        if (events.length > 0) fetchGeocoding();
    }, [events, geoCache]);

    // Formátování času bez počáteční nuly u hodin
    const formatTime = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };

    // Formátování časového rozpětí události
    const formatEventTime = (event) => {
        if (event.start?.dateTime) {
            const start = new Date(event.start.dateTime);
            const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
            return end && start.toDateString() !== end.toDateString()
                ? `${formatTime(start)}`
                : formatTime(start);
        } else if (event.start?.date) {
            return event.start.date;
        }
        return '';
    };

    // Formátování data události v češtině
    const formatEventDate = (event) => {
        let start = event.start?.dateTime ? new Date(event.start.dateTime) : new Date(event.start?.date);
        let end = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end?.date);
        if (start) {
            const startFormatted = start.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long'});
            return (end && start.toDateString() !== end.toDateString())
                ? `${startFormatted} - ${end.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}`
                : startFormatted;
        }
        return '';
    };

    // Vrací název místa z adresy
    const extractPlaceName = (location) => location.split(',')[0];

    // Filtrování událostí podle kategorie a měsíce
    const filteredEvents = events.filter(event => {
        const eventColorId = event.colorId || "11";
        const category = categoryMap[eventColorId] || "Jiné";
        const date = new Date(event.start?.dateTime || event.start?.date);
        const rawMonth = date.toLocaleString('cs-CZ', { month: 'long' });
        const month = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
        return (!selectedCategory || category === selectedCategory) && (!selectedMonth || month === selectedMonth);
    });

    // Seskupení událostí podle měsíce
    const eventsByMonth = filteredEvents.reduce((acc, event) => {
        const date = new Date(event.start?.dateTime || event.start?.date);
        const rawMonth = date.toLocaleString('cs-CZ', { month: 'long' });
        const month = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
        if (!acc[month]) acc[month] = [];
        acc[month].push(event);
        return acc;
    }, {});

    return (
        <div>
            {error && <p>Chyba při načítání událostí: {error}</p>}
            {events.length === 0 && !error && <p>Nenalezeny žádné události.</p>}

            {/* Dropdown filtry */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', margin: '30px 0' }}>
                <div className="category-filter">
                    <select
                        value={selectedCategory || ""}
                        onChange={(e) => setSelectedCategory(e.target.value || null)}
                    >
                        <option value="">Všechny kategorie</option>
                        {categoryFilterList.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div className="category-filter">
                    <select
                        value={selectedMonth || ""}
                        onChange={(e) => setSelectedMonth(e.target.value || null)}
                    >
                        <option value="">Všechny měsíce</option>
                        {availableMonths.map((month) => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Výpis událostí po měsících */}
            {Object.entries(eventsByMonth).map(([month, events]) => (
                <div key={month} style={{ marginBottom: '40px' }}>
                    <h2 style={{ paddingBottom: '10px' }}>{month}</h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {events.map(event => {
                            const eventColorId = event.colorId || "11";
                            const category = categoryMap[eventColorId] || "Jiné";
                            const placeName = event.location ? extractPlaceName(event.location) : '';
                            const infoUrl = extractUrlFromDescription(event.description);
                            const isMobile = /Mobi|Android/i.test(navigator.userAgent);
                            const mapsLink = geoCache[event.location]
                                ? !isMobile && geoCache[event.location].place_id
                                    ? `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${geoCache[event.location].place_id}`
                                    : `https://www.google.com/maps?q=${geoCache[event.location].lat},${geoCache[event.location].lng}`
                                : '';

                            return (
                                <li
                                    key={event.id}
                                    className="event-card"
                                    style={{ borderLeft: `10px solid ${colorMap[eventColorId]}` }}
                                >
                                    <span className="event-category">{category}</span>
                                    <h3 style={{
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word'
                                    }}>{event.summary}</h3>
                                    <p><strong>Datum:</strong> {formatEventDate(event)}</p>
                                    <p><strong>Začátek:</strong> {formatEventTime(event)}</p>
                                    {event.location && (
                                        <p><strong>Umístění:</strong> {mapsLink
                                            ? <a href={mapsLink} target="_blank" rel="noopener noreferrer">{placeName}</a>
                                            : placeName}</p>
                                    )}
                                    {infoUrl && (
                                        <p><a href={infoUrl} target="_blank" rel="noopener noreferrer">Klikněte zde pro více informací</a></p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default EventCalendar;
