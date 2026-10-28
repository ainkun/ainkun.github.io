// Edit this file to personalize the portfolio. Empty URLs show a clear placeholder.
window.PORTFOLIO = {
  name: "ainkun",
  description: "Hands-on experience in penetration testing and Android security. Current research centers on Android platforms, with vuln research and AI automation in the mix.",
  about: "I’m Hussain K., known as ainkun — a Security Researcher and a casual CTF player. I’m driven by curiosity about how things work under the hood, and even more by how they break. Most of my time goes into reverse engineering, malware analysis and development, mobile security, cryptography, and vulnerability research. I currently work across Android security, application security, and AI automation, with a focus on understanding systems deeply before securing them. I like sharing what I learn through writeups and notes, hoping they save someone else a few hours of head-scratching.",
  // Shown as the `ls skills/` output in the About terminal. Adjust these areas to reflect your actual skills.
  skills: ["Penetration Testing", "Cryptography", "Reversing", "Programming", "Malware Dev", "Android Security", "AI Automation"],
  // The collectible card opened by clicking the hero avatar. All text is editable.
  analystCard: {
    name: "AinKun",
    evolvesFrom: "Hussain K.", // Shown under the name as "Evolves from …", like an evolved trading card.
    japaneseRole: "セキュリティ研究者", // Shown in the artwork caption; add role: "…" to show English text beside it.
    type: "GLITCH TYPE",
    statLabel: "CURIOSITY",
    statValue: "∞", // Decorative card flavor, not a skill rating or certification.
    mainImage: "", // Optional poster/fallback; leave empty for video only.
    mainVideo: "card-back-main-clip.mp4", // Muted loop.
    mainImageAlt: "",
    portraitImage: "card-top-left-small.jpeg?v=d738260b", // Refresh cached copies after replacing the portrait.
    portraitImageAlt: "The supplied corner portrait for ainkun's card",
    imagePosition: "center 43%",
    ability: {
      title: "Security Researcher",
      description: "Researching the Android platform with a focus on reversing and vuln research."
    },
    techniques: [
      { symbol: "◎", title: "Reverse Engineering", description: "Binary analysis and malware reversing.", tag: "REVERSE" },
      { symbol: "◇", title: "Mobile Security", description: "Explore Android internals and mobile attack surfaces.", tag: "MOBILE" }
    ],
    stats: ["Cryptography", "Reversing", "Programming", "Malware Dev", "Android Security", "AI Automation"]
    // Optional: motto (line under STATS), edition and number (footer text beside the a刀 mark).
  },
  blog: { feed: "data/medium.json", labels: "data/blog-labels.json", maxPosts: 100 }, // Card labels/tags: edit data/blog-labels.json
  socials: { github: "https://github.com/ainkun", medium: "https://ainkun.medium.com/", linkedin: "https://www.linkedin.com/in/ainkun/", x: "https://x.com/ain__kun", email: "contact@ainkun.com" }, // email: plain email address
  projects: [
    { title: "Deep Learning Side-Channel Attack on AES-128 in IoT Devices", category: "01 / UNIVERSITY FYDP", description: "Final-year project recovering AES-128 encryption keys from IoT hardware by training deep learning models on power side-channel traces. Applied cryptography meets hardware attack research.", tags: ["AES-128", "IoT Hardware", "Deep Learning", "Side Channels"], url: "", icon: "◎" },
    { title: "CyberSents CTF 2025 Challenges", category: "02 / CTF CHALLENGE AUTHOR", description: "Created challenges for CyberSents CTF 2025. Explore the challenge collection and solutions on GitHub.", tags: ["CTF", "Challenge Design", "2025"], url: "https://github.com/ainkun/my-ctf-challenges", linkLabel: "View challenges and solutions", icon: "⌘" }
  ],
  achievements: [
    { title: "Ignite Cyber Hackathon — 2nd Place", description: "Our team secured second place at the Ignite 2024 Cyber Hackathon.", year: "2024", type: "TEAM ACHIEVEMENT", url: "" },
    { title: "Black Hat MEA — Finalist", description: "Reached the Black Hat MEA finals in 2023 and 2025.", year: "2023 & 2025", type: "CTF FINALIST", url: "" }
  ]
};
