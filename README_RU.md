# ALASKASIBCAT — website owner guide

Updated October 25, 2026. Website: https://alaskasibcat.com/

## Your everyday links

- Public website: https://alaskasibcat.com/
- Reviews: https://alaskasibcat.com/reviews
- Private reviews admin: https://alaskasibcat.com/admin/
- Kitten preparation guide: https://alaskasibcat.com/preparing
- Repository: https://github.com/alaskasibcat/alaskasibcat-website

## Manage reviews

Open the private admin page and sign in with your approved email and the one-time code. Visitors cannot access this area. New reviews are drafts; they never publish automatically.

Use Pending review to find submissions. Edit the display name, optional kitten name, date or text, then save. Publish shows a review publicly. Hide removes it from public view. Delete moves it to Deleted; Restore recovers it. Saving an already published review updates its public text. These controls do not manage photos or kitten listings.

## Add photographs later

Only Natalia uploads images to GitHub. The website code already refers to the selected Our cats filenames in images/cats. Before upload, the page displays a simple notice instead of broken photos. The uploaded photos appear at those same paths without changing the page layout. Use the prepared files in the project upload folder; keep their existing names. Biography text can be added separately later.

Keep Our cats, Available kittens and Previous litters separate. Parent blocks belong only in the selected past-litter galleries, never on Available kittens. Previous litters remains outside navigation until Natalia selects its real content.

## Update kitten listings

The two lists are in data/kittens.js: window.KITTENS for kittens and window.AVAILABLE_ADULTS for retired adult cats. Each entry can contain a name, sex, color, birth date, ready date, status, price, description, photo path and photo alt text. An entry appears only when published is true. Do not add unconfirmed data. The home page always links to the availability section. The availability page invites visitors to ask about current animals and future reservations, even before individual entries are published. It does not state that no kittens are available.

Check the information before publishing or changing a listing. Do not add fake reviews, placeholder kittens or invented biographies.

## Website structure and updates

index.html, about.html, cats.html, kittens.html, adopt.html, contact.html, reviews.html and preparing.html are the main public pages. previous-litters.html is a prepared page awaiting selected materials. The home cover uses css/home.css. Shared styles are in css/styles.css.

Cloudflare Pages builds the main branch and publishes automatically. The build copies public assets into dist. Review handling uses Pages Functions, Cloudflare Access and D1; moving only the static files to another host would not transfer the reviews system.

Keep private configuration and secrets outside this public repository. The admin email is not a public contact address. Existing form delivery, review protection and anti-spam settings are already connected.

Noindex remains on the pages until Natalia explicitly approves opening the site to search engines. Publishing a text update does not remove that setting.
