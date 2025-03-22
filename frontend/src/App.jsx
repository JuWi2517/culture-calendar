import React from 'react';
import EventCalendar from './components/EventCalendar.jsx';
import './App.css';
import ContactForm from "./components/ContactForm.jsx";
function App() {
    return (
        <div className="App">

            <section className="calendar-section">
                <div className="calendar-image"></div>
                <div className="calendar-content">
                    <h1 className="calendar-title">Kulturní kalendář v Lounech</h1>
                    <div className="calendar-events">
                        <EventCalendar/>
                    </div>
                </div>
            </section>
            <div className="dottedLine">.</div>
            <div><ContactForm/></div>
            <div className="rotate">
                <div className="footer"></div>
            </div>
        </div>
    );
}

export default App;
