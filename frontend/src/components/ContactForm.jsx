
import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import '../ContactForm.css';

const ContactForm = () => {
    const form = useRef();
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(false);

    const sendEmail = (e) => {
        e.preventDefault();
        setSent(false);
        setError(false);

        emailjs.sendForm(
            'service_dwtt5n9',
            'template_jikm4do',
            form.current,
            'S9b38i735A8ty8_X4'
        ).then(
            () => {
                setSent(true);
                form.current.reset();
                setTimeout(() => setSent(false), 2000);
            },
            () => setError(true)
        );
    };

    return (
        <section className="contact-section">
            <h2 className="form-heading">Něco vám tu chybí? Napište nám!</h2>
            <form ref={form} onSubmit={sendEmail} className="contact-form">
                <input type="text" name="name" placeholder="Jméno a příjmení / firma (povinné)" required />
                <input type="text" name="phone" placeholder="Telefonní číslo" />
                <input type="email" name="email" placeholder="E-mailová adresa (povinné)" required />
                <textarea name="message" placeholder="Zpráva (nejlépe link na událost)" rows="6"></textarea>
                <button type="submit">Odeslat</button>
                {sent && <p className="form-success">Zpráva byla odeslána.</p>}
                {error && <p className="form-error">Nastala chyba při odesílání zprávy.</p>}
            </form>
        </section>
    );
};

export default ContactForm;