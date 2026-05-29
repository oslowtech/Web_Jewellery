import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "91XXXXXXXXXX";
  const message = encodeURIComponent(
    "Hello, I would like to know more about your jewellery collections."
  );
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-onyx text-white shadow-soft"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={20} />
    </a>
  );
};

export default WhatsAppButton;
