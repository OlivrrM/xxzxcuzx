

const Contact = () => {
    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Contact</h1>

            <form
                action="https://formspree.io/f/xreyzdoz"
                method="POST"
                className="space-y-4"
            >
                <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium mb-1">
                        Name
                    </label>
                    <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        className="app-input w-full"
                    />
                </div>

                <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium mb-1">
                        Email
                    </label>
                    <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        className="app-input w-full"
                    />
                </div>

                <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium mb-1">
                        Message
                    </label>
                    <textarea
                        id="contact-message"
                        name="message"
                        required
                        className="app-input w-full min-h-40"
                    />
                </div>

                <button type="submit" className="app-btn app-btn-primary">
                    Send
                </button>
            </form>
        </div>
    );
};

export default Contact;