import phone from "../assets/phone.gif";
import mail from "../assets/mail.gif";
import ContactGif from "../assets/contact.gif";

const Contact = () => {
    return (
        <div className="p-4 w-full">
            <div className="flex flex-col w-full mb-6">
                <img src={ContactGif} alt="Contact" className="w-fit font-bold mx-auto" />
                <img src={mail} alt="Mail" className="w-[40px] h-fit" />
            </div>
            <form
                action="https://formspree.io/f/xreyzdoz"
                method="POST"
                className="space-y-4 w-full"
            >
                <div>
                    <label htmlFor="contact-name" className="block text-start text-sm font-medium mb-1 text-white">
                        Name
                    </label>
                    <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        required
                        className="app-input w-full"
                    />
                </div>

                <div>
                    <label htmlFor="contact-email" className="block text-start text-sm font-medium mb-1 text-white">
                        Email
                    </label>
                    <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="app-input w-full"
                    />
                </div>

                <div>
                    <label htmlFor="contact-message" className="block text-start text-sm font-medium mb-1 text-white">
                        Message
                    </label>
                    <textarea
                        id="contact-message"
                        name="message"
                        placeholder="Write your message..."
                        required
                        className="app-input w-full min-h-40"
                    />
                </div>

                <div className="flex gap-2 w-full justify-end">
                    <button type="reset" className="app-btn app-btn-secondary w-fit">
                        Clear
                    </button>
                    <button type="submit" className="app-btn app-btn-primary w-fit">
                        Send
                    </button>
                </div>
            </form>

            <p className="text-[#ff0000] text-xl font-bold text-center">Call me up</p>
            <img src={phone} alt="Phone" className="w-50 h-auto mt-2 mx-auto" />

        </div>
    );
};

export default Contact;