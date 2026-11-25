/* ============================================
   N-KITS – Product Data
   ============================================ */

let PRODUCTS = [
  { id: 1, name: "Manchester United 09/10 Home", club: "Manchester United", league: "Premier League", price: 85000, badge: "Retro", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=720&fit=crop", description: "The iconic AON-sponsored home jersey worn during the 2009/10 season. Classic red with white and black trim.", sizes: ["S", "M", "L", "XL", "XXL"], category: "premier-league" },
  { id: 2, name: "Arsenal 05/06 Highbury", club: "Arsenal", league: "Premier League", price: 78000, badge: "Classic", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=720&fit=crop", description: "The final Highbury season jersey. Redcurrant kit that marked the end of an era.", sizes: ["S", "M", "L", "XL"], category: "premier-league" },
  { id: 3, name: "Barcelona 10/11 Home", club: "FC Barcelona", league: "La Liga", price: 82000, badge: "Retro", image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=720&fit=crop", description: "Messi's peak years. The famous blaugrana kit from the 2010/11 Champions League campaign.", sizes: ["S", "M", "L", "XL", "XXL"], category: "la-liga" },
  { id: 4, name: "Nigeria 1994 World Cup", club: "Nigeria", league: "International", price: 92000, badge: "Limited", image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=720&fit=crop", description: "The legendary green eagle jersey from USA 94. Worn by the Super Eagles during their most memorable World Cup run.", sizes: ["M", "L", "XL", "XXL"], category: "international" },
  { id: 5, name: "AC Milan 06/07 Home", club: "AC Milan", league: "Serie A", price: 80000, badge: "Retro", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=720&fit=crop&sat=-30", description: "The red and black stripes that conquered Europe. Champions League winners kit.", sizes: ["S", "M", "L", "XL"], category: "serie-a" },
  { id: 6, name: "Real Madrid 01/02 Away", club: "Real Madrid", league: "La Liga", price: 88000, badge: "Classic", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=720&fit=crop&sat=-20", description: "Zidane's famous black away kit. The season of the volley in Glasgow.", sizes: ["S", "M", "L", "XL", "XXL"], category: "la-liga" },
  { id: 7, name: "Liverpool 08/09 Home", club: "Liverpool", league: "Premier League", price: 79000, badge: "Retro", image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=720&fit=crop&sat=-40", description: "Carlsberg-sponsored classic red. Gerrard's era at its peak.", sizes: ["S", "M", "L", "XL"], category: "premier-league" },
  { id: 8, name: "Brazil 2002 Home", club: "Brazil", league: "International", price: 95000, badge: "Limited", image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=720&fit=crop&sat=-10", description: "The yellow of the five-time champions. Ronaldo, Rivaldo and Ronaldinho's World Cup kit.", sizes: ["S", "M", "L", "XL", "XXL"], category: "international" },
  { id: 9, name: "Juventus 96/97 Home", club: "Juventus", league: "Serie A", price: 76000, badge: "Classic", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=720&fit=crop&sat=-50", description: "The black and white stripes of the Champions League winners.", sizes: ["M", "L", "XL"], category: "serie-a" },
  { id: 10, name: "Chelsea 03/04 Away", club: "Chelsea", league: "Premier League", price: 74000, badge: "Retro", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=720&fit=crop&sat=-60", description: "The white away kit from the first Mourinho season.", sizes: ["S", "M", "L", "XL", "XXL"], category: "premier-league" },
  { id: 11, name: "Inter Milan 09/10 Home", club: "Inter Milan", league: "Serie A", price: 81000, badge: "Retro", image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=720&fit=crop&sat=-25", description: "Treble-winning kit. The last great Inter side under Mourinho.", sizes: ["S", "M", "L", "XL"], category: "serie-a" },
  { id: 12, name: "Argentina 1986 Home", club: "Argentina", league: "International", price: 98000, badge: "Limited", image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=720&fit=crop&sat=-5", description: "Maradona's hand of God and goal of the century kit.", sizes: ["S", "M", "L", "XL", "XXL"], category: "international" }
];

let CATEGORIES = [
  {
    id: "all",
    name: "All Jerseys",
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/><path d="M2 12h20"/></svg>`
  },
  {
    id: "premier-league",
    name: "Premier League",
    icon: `<img src="assets/categories/premier-league.svg" alt="">`
  },
  {
    id: "la-liga",
    name: "La Liga",
    icon: `<img src="assets/categories/la-liga.svg" alt="">`
  },
  {
    id: "serie-a",
    name: "Serie A",
    icon: `<img src="assets/categories/serie-a.svg" alt="">`
  },
  {
    id: "international",
    name: "International",
    icon: `<span class="flag-stack"><img src="assets/categories/ng.png" alt="Nigeria"><img src="assets/categories/br.png" alt="Brazil"><img src="assets/categories/ar.png" alt="Argentina"></span>`
  }
];

function formatPrice(naira) {
  return "₦" + Number(naira).toLocaleString("en-NG");
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === Number(id));
}

function getProductsByCategory(category) {
  if (!category || category === "all") return PRODUCTS.slice();
  return PRODUCTS.filter(p => p.category === category);
}