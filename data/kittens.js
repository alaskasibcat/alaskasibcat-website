// Kitten list. Add one block per kitten and set published: true ONLY after Natalia confirms the details.
// Empty list = the site shows "no kittens right now, ask about future litters".
// Example (not published, never shown):
//   { published: false, name: "Name", sex: "Girl", color: "Color", born: "2026-01-01",
//     about: "One or two sentences about personality.", status: "Available", price: "$1,800",
//     ready: "January 2027",   (parents are NOT shown on kitten cards — Natalia's rule)
//     photo: "images/kittens/name-1.jpg", photoAlt: "Describe what is in the photo" }
window.KITTENS = [];
