// Confirm every entry before setting published: true. Parent blocks are never shown here.
// Add kittens to KITTENS and retired adult cats to AVAILABLE_ADULTS.
// Both lists support: name, sex, color, born, ready, status, price, about, photo, photoAlt.
// Empty arrays leave the positive availability invitation and inquiry form visible.
// Template only (not a published animal):
// {published:false, name:"Name", status:"Available", about:"Confirmed description", photo:"images/kittens/file.webp", photoAlt:"Photo description"}
window.KITTENS = [];
window.AVAILABLE_ADULTS = [];
