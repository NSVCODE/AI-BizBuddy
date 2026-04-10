"""
LatteLune Café — Static business configuration.
This is the knowledge base injected into the AI system prompt.
"""

RESTAURANT_CONFIG = {
    "name": "LatteLune",
    "tagline": "Where every sip feels like moonlight ☕🌙",
    "type": "Aesthetic Café",
    "location": "Indiranagar, Bengaluru, Karnataka, India",
    "phone": "+91 98765 43210",
    "email": "hello@lattelune.in",
    "instagram": "@lattelune.cafe",
    "description": (
        "LatteLune is a cozy, aesthetic café in the heart of Indiranagar, Bengaluru. "
        "Known for our artisanal coffee, dreamy interiors, and delicious baked goods. "
        "We're the perfect spot for work sessions, dates, or catching up with friends."
    ),
    "hours": {
        "Monday": "8:00 AM – 10:00 PM",
        "Tuesday": "8:00 AM – 10:00 PM",
        "Wednesday": "8:00 AM – 10:00 PM",
        "Thursday": "8:00 AM – 10:00 PM",
        "Friday": "8:00 AM – 11:00 PM",
        "Saturday": "9:00 AM – 11:00 PM",
        "Sunday": "9:00 AM – 10:00 PM",
    },
    "amenities": [
        "Free high-speed WiFi",
        "Power outlets at every table",
        "Pet-friendly outdoor seating",
        "Board games available",
        "Private event space (up to 30 people)",
        "Live acoustic music on weekends",
    ],
    "menu": {
        "Coffee & Espresso": [
            {"name": "Signature LatteLune Latte", "price": 220, "description": "House blend espresso with velvety oat milk and a hint of vanilla"},
            {"name": "Iced Caramel Cloud", "price": 240, "description": "Cold brew espresso, caramel syrup, whipped cream"},
            {"name": "Espresso", "price": 140, "description": "Double shot of our house blend"},
            {"name": "Cappuccino", "price": 180, "description": "Espresso with steamed milk foam"},
            {"name": "Flat White", "price": 190, "description": "Ristretto shots with velvety microfoam"},
            {"name": "Mocha", "price": 220, "description": "Espresso, dark chocolate, steamed milk"},
        ],
        "Non-Coffee Drinks": [
            {"name": "Iced Matcha Latte", "price": 250, "description": "Ceremonial grade matcha with oat milk"},
            {"name": "Turmeric Golden Latte", "price": 200, "description": "Warm turmeric, ginger, coconut milk"},
            {"name": "Blue Butterfly Lemonade", "price": 220, "description": "Butterfly pea flower, lemon, honey"},
            {"name": "Strawberry Basil Cooler", "price": 200, "description": "Fresh strawberries, basil, soda"},
            {"name": "Hot Chocolate", "price": 190, "description": "Rich Belgian chocolate with steamed milk"},
        ],
        "Food": [
            {"name": "Butter Croissant", "price": 180, "description": "Flaky, buttery, freshly baked daily"},
            {"name": "Avocado Toast", "price": 280, "description": "Sourdough, smashed avocado, cherry tomatoes, microgreens"},
            {"name": "Waffle Stack", "price": 320, "description": "Belgian waffles, seasonal berries, maple syrup, whipped cream"},
            {"name": "Pasta Alfredo", "price": 340, "description": "Fettuccine, cream sauce, parmesan, herbs"},
            {"name": "Grilled Cheese Panini", "price": 260, "description": "Three-cheese blend, tomato, basil on sourdough"},
            {"name": "Acai Bowl", "price": 300, "description": "Acai base, banana, granola, honey, seasonal fruits"},
            {"name": "Cinnamon Roll", "price": 200, "description": "Soft, gooey, topped with cream cheese glaze"},
        ],
        "Cakes & Desserts": [
            {"name": "Lotus Biscoff Cheesecake", "price": 260, "description": "Creamy cheesecake on a Biscoff crust"},
            {"name": "Blueberry Tart", "price": 240, "description": "Buttery tart shell, vanilla custard, fresh blueberries"},
            {"name": "Chocolate Lava Cake", "price": 280, "description": "Warm chocolate cake with molten center"},
            {"name": "Tiramisu", "price": 270, "description": "Classic Italian dessert, espresso soaked"},
        ],
    },
    "faqs": [
        {
            "question": "Do you have vegan options?",
            "answer": "Yes! We offer oat milk, almond milk, and soy milk for all drinks at no extra charge. Our Acai Bowl, Avocado Toast, and Blue Butterfly Lemonade are fully vegan. We also have gluten-free options available — just ask our staff."
        },
        {
            "question": "Is there WiFi?",
            "answer": "Absolutely! We offer free high-speed WiFi. The password is displayed on your table card. We also have power outlets at every table, perfect for work sessions."
        },
        {
            "question": "Are you pet-friendly?",
            "answer": "Yes, we love furry friends! Our outdoor seating area is fully pet-friendly. We even have a water bowl station for your pets near the entrance."
        },
        {
            "question": "Can I host a private event?",
            "answer": "Yes! We have a private event space that fits up to 30 guests, ideal for birthdays, baby showers, corporate events, or photoshoots. Please contact us at hello@lattelune.in for event packages and pricing."
        },
        {
            "question": "Do you take reservations?",
            "answer": "Yes, we accept table reservations for parties of 2 or more. You can book through this chat, call us at +91 98765 43210, or visit us directly. Walk-ins are always welcome too!"
        },
        {
            "question": "Do you have parking?",
            "answer": "There is paid street parking available on 12th Main Road. We also have a partnership with the parking lot on CMH Road, just a 2-minute walk away."
        },
        {
            "question": "Do you offer home delivery?",
            "answer": "Yes! We're available on Swiggy and Zomato for delivery within a 5 km radius. You can also call us for takeaway orders."
        },
        {
            "question": "Do you have a loyalty program?",
            "answer": "Yes! Our LunaStars loyalty program gives you 1 star per ₹100 spent. Collect 50 stars and get a free signature drink. Ask our staff to sign you up or mention it during booking."
        },
    ],
    "booking_slots": {
        "duration_minutes": 90,
        "max_party_size": 6,
        "min_advance_hours": 1,
        "slot_times": ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "20:30"],
    },
    "ai_persona": {
        "name": "Luna",
        "personality": (
            "You are Luna, the friendly and charming AI assistant for LatteLune café. "
            "You're warm, helpful, and a little whimsical — like the café itself. "
            "You speak in a friendly, conversational tone with occasional café-themed warmth. "
            "You help customers with: table reservations, menu questions, event inquiries, "
            "general FAQs, and anything related to LatteLune. "
            "When collecting booking details, gather them naturally in conversation — don't ask for everything at once. "
            "Always confirm bookings with a summary. "
            "If asked about topics unrelated to LatteLune, politely redirect to café-related help. "
            "Keep responses concise and friendly."
        ),
    },
}
