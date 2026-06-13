export type StarRating = 1 | 2 | 3 | 4 | 5;
export type HotLevel  = 1 | 2 | 3;

export type HotHotel = {
  hotel_id:    string;
  hotel_name:  string;
  country:     string;
  city:        string;
  address:     string;
  star_rating: StarRating;
  hot_level:   HotLevel;
};

export const HOT_HOTELS: HotHotel[] = [
  { hotel_id: 'H0001', hotel_name: 'Mandarin Oriental Bangkok',             country: '泰国',       city: '曼谷',   address: '48 Oriental Avenue, Bang Rak',                         star_rating: 5, hot_level: 3 },
  { hotel_id: 'H0002', hotel_name: 'The Ritz-Carlton Tokyo',                country: '日本',       city: '东京',   address: 'Tokyo Midtown, 9-7-1 Akasaka, Minato',                 star_rating: 5, hot_level: 3 },
  { hotel_id: 'H0003', hotel_name: 'Atlantis The Palm Dubai',               country: '阿联酋',     city: '迪拜',   address: 'Crescent Road, Palm Jumeirah',                          star_rating: 5, hot_level: 3 },
  { hotel_id: 'H0004', hotel_name: 'Marina Bay Sands',                      country: '新加坡',     city: '新加坡', address: '10 Bayfront Avenue',                                   star_rating: 5, hot_level: 3 },
  { hotel_id: 'H0005', hotel_name: 'Four Seasons Resort Bali at Jimbaran',  country: '印度尼西亚', city: '巴厘岛', address: 'Jimbaran, Badung, Bali 80361',                          star_rating: 5, hot_level: 3 },
  { hotel_id: 'H0006', hotel_name: 'Anantara Seminyak Bali Resort',         country: '印度尼西亚', city: '巴厘岛', address: 'Jalan Abimanyu, Seminyak, Badung',                      star_rating: 4, hot_level: 2 },
  { hotel_id: 'H0007', hotel_name: 'Hyatt Regency Kuala Lumpur',            country: '马来西亚',   city: '吉隆坡', address: '1 Jalan Pinang, Kuala Lumpur City Centre',              star_rating: 4, hot_level: 2 },
  { hotel_id: 'H0008', hotel_name: 'Park Hyatt Sydney',                     country: '澳大利亚',   city: '悉尼',   address: '7 Hickson Road, The Rocks, Sydney',                     star_rating: 5, hot_level: 2 },
  { hotel_id: 'H0009', hotel_name: 'Hilton Paris Opera',                    country: '法国',       city: '巴黎',   address: '108 Boulevard Haussmann, 9e arrondissement',            star_rating: 4, hot_level: 2 },
  { hotel_id: 'H0010', hotel_name: 'The Langham London',                    country: '英国',       city: '伦敦',   address: '1c Portland Place, Regent Street, London',             star_rating: 5, hot_level: 1 },
];
