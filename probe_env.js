
console.log("--- ENV PROBE ---");
const keys = Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('GEMINI'));
console.log("Found keys:", keys);
keys.forEach(k => console.log(`${k}: ${process.env[k]?.substring(0, 5)}...`));
console.log("--- END PROBE ---");
