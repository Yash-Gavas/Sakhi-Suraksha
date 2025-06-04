import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the page title
document.title = "Sakhi Suraksha - Women's Safety App";

// Add meta description for SEO
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'Sakhi Suraksha - Comprehensive women\'s safety app with emergency SOS, voice activation, and community alerts. Stay safe with real-time location sharing and instant emergency responses.';
document.head.appendChild(metaDescription);

// Add Open Graph tags for social sharing
const ogTitle = document.createElement('meta');
ogTitle.property = 'og:title';
ogTitle.content = 'Sakhi Suraksha - Women\'s Safety App';
document.head.appendChild(ogTitle);

const ogDescription = document.createElement('meta');
ogDescription.property = 'og:description';
ogDescription.content = 'Emergency SOS, voice activation, and community safety features designed for women\'s protection and peace of mind.';
document.head.appendChild(ogDescription);

const ogType = document.createElement('meta');
ogType.property = 'og:type';
ogType.content = 'website';
document.head.appendChild(ogType);

createRoot(document.getElementById("root")!).render(<App />);
